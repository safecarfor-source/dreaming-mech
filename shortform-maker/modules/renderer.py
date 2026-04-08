"""숏폼 렌더러 v2.0 — 블랙바 레이아웃 + ASS 번인 자막 + LUFS 정규화"""

import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)

from config import (
    AUX_TEXT_COLOR,
    AUX_TEXT_FONTSIZE,
    BG_COLOR,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    DYNAMIC_HOLD_ENABLED,
    DYNAMIC_HOLD_MAX_ZOOM,
    DYNAMIC_HOLD_ZOOM_RATE,
    FADE_DURATION,
    FONT_BOLD_INDEX,
    FONT_PATH,
    HOOK_FONT_PATH_DOCKER,
    HOOK_FONT_PATH_MAC,
    HOOK_TITLE_FONTSIZE,
    HOOK_TITLE_MAX_CHARS,
    HOOK_TITLE_Y,
    LETTERBOX_VIDEO_H,
    LETTERBOX_VIDEO_W,
    LETTERBOX_VIDEO_Y,
    LUFS_LRA,
    LUFS_TARGET,
    LUFS_TP,
    LOOP_ENABLED,
    LOOP_TAIL_FADE_SEC,
    MAX_CLIP_DURATION,
    PLAYBACK_SPEED,
    VIDEO_SCALE_FACTOR,
)
from modules.composer import ComposedClip


def render_clip(
    video_path: str,
    clip: ComposedClip,
    output_path: str,
    ass_path: str | None = None,
) -> str:
    """숏폼 클립 렌더링 (v2.0 블랙바 모드)

    Args:
        video_path: 원본 영상 경로
        clip: ComposedClip 객체
        output_path: 출력 파일 경로
        ass_path: ASS 자막 파일 경로 (없으면 drawtext 자막 사용)

    Returns:
        출력 파일 경로
    """
    # ─── 하드 가드: MAX_CLIP_DURATION 초과 절대 차단 ───
    clip_duration = clip.total_duration
    if clip_duration > MAX_CLIP_DURATION:
        logger.error(
            f"[HARD GUARD] 클립 '{clip.hook_title}' 길이 {clip_duration:.1f}초 > "
            f"MAX {MAX_CLIP_DURATION}초 → 렌더링 거부"
        )
        raise ValueError(
            f"클립 길이 {clip_duration:.1f}초가 최대 {MAX_CLIP_DURATION}초를 초과합니다. "
            f"렌더링을 거부합니다."
        )

    if clip.is_composition and len(clip.segments) > 1:
        # 2-pass: 먼저 구간 합성 → 블랙바 + 오버레이
        tmp_concat = output_path.replace(".mp4", "_concat.mp4")
        _concat_segments(video_path, clip, tmp_concat)
        _apply_letterbox_overlay(tmp_concat, clip, output_path, is_concat=True, ass_path=ass_path)
        if os.path.exists(tmp_concat):
            os.remove(tmp_concat)
    else:
        # 1-pass: 단일 구간 직접 처리
        _apply_letterbox_overlay(video_path, clip, output_path, is_concat=False, ass_path=ass_path)

    return output_path


def _concat_segments(video_path: str, clip: ComposedClip, output_path: str):
    """여러 구간을 이어붙이기 (trim + concat)"""
    segments = clip.segments
    n = len(segments)

    filter_parts = []
    concat_inputs = []

    speed_pts = f"setpts=PTS/{PLAYBACK_SPEED}" if PLAYBACK_SPEED != 1.0 else ""
    speed_atempo = f"atempo={PLAYBACK_SPEED}" if PLAYBACK_SPEED != 1.0 else ""

    for i, seg in enumerate(segments):
        v_filters = f"trim=start={seg.start_sec}:end={seg.end_sec},setpts=PTS-STARTPTS"
        if speed_pts:
            v_filters += f",{speed_pts}"
        filter_parts.append(f"[0:v]{v_filters}[v{i}]")

        a_filters = f"atrim=start={seg.start_sec}:end={seg.end_sec},asetpts=PTS-STARTPTS"
        if speed_atempo:
            a_filters += f",{speed_atempo}"
        filter_parts.append(f"[0:a]{a_filters}[a{i}]")
        concat_inputs.append(f"[v{i}][a{i}]")

    filter_parts.append(
        "".join(concat_inputs) + f"concat=n={n}:v=1:a=1[vout][aout]"
    )

    filter_complex = ";\n".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-filter_complex", filter_complex,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-t", str(MAX_CLIP_DURATION),  # 하드 가드
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[FFmpeg CONCAT ERROR] exit={result.returncode}")
        print(f"[FFmpeg STDERR] {result.stderr[-1500:]}")
        result.check_returncode()


def _apply_letterbox_overlay(
    video_path: str,
    clip: ComposedClip,
    output_path: str,
    is_concat: bool = False,
    ass_path: str | None = None,
):
    """블랙바 레이아웃 + 훅 타이틀 + 번인 자막 + LUFS 정규화"""
    seg = clip.segments[0]

    # 한글 텍스트 임시 파일 (인코딩 문제 방지)
    aux_file = _write_text_file(clip.aux_text)

    # 훅 타이틀 항상 2줄 분할 (빨간 + 노란)
    hook_text = clip.hook_title
    line1, line2 = _split_hook_to_two_lines(hook_text)
    hook_line1_file = _write_text_file(line1)
    hook_line2_file = _write_text_file(line2)

    # 폰트 설정
    font = FONT_PATH if os.path.exists(FONT_PATH) else ""
    font_opt = f":fontfile='{font}'" if font else ""

    # 훅 타이틀 전용 폰트 (Black Han Sans)
    hook_font = HOOK_FONT_PATH_DOCKER if os.path.exists(HOOK_FONT_PATH_DOCKER) else ""
    if not hook_font:
        hook_font = HOOK_FONT_PATH_MAC if os.path.exists(HOOK_FONT_PATH_MAC) else font
    hook_font_opt = f":fontfile='{hook_font}'" if hook_font else ""
    if hook_font and hook_font.endswith(".ttc"):
        hook_font_opt += f":fontindex={FONT_BOLD_INDEX}"

    # 시간 범위
    if is_concat:
        ss_args = []
        to_args = []
    else:
        ss_args = ["-ss", seg.start]
        to_args = ["-to", seg.end]

    # ─── 블랙바 필터 체인 ─────────────────────────────
    # 1단계: 소스 영상을 가로 맞춤 스케일 (비율 유지)
    # 2단계: 검정 캔버스(1080x1920) 생성
    # 3단계: 영상을 캔버스 중앙(y=656)에 배치
    # 4단계: 훅 타이틀 (상단 구역)
    # 5단계: ASS 자막 또는 drawtext 자막 (하단 구역)
    # 6단계: 보조 텍스트 (하단)

    # 다이나믹 홀드 (줌 효과) — 선택적
    if DYNAMIC_HOLD_ENABLED:
        zoom_filter = (
            f"zoompan=z='min(zoom+{DYNAMIC_HOLD_ZOOM_RATE},{DYNAMIC_HOLD_MAX_ZOOM})':"
            f"d=1:s={LETTERBOX_VIDEO_W}x{LETTERBOX_VIDEO_H}:fps=30,"
        )
    else:
        zoom_filter = ""

    # ─── 비디오 필터 체인 ─────────────────────────────
    # 120% 확대 후 중앙 크롭 (영상을 더 크게 보이게)
    scaled_w = int(LETTERBOX_VIDEO_W * VIDEO_SCALE_FACTOR)
    scaled_h = int(LETTERBOX_VIDEO_H * VIDEO_SCALE_FACTOR)
    filter_parts = [
        # 소스를 120% 크게 스케일 → 중앙 크롭으로 1080x608에 맞춤
        # + 재생 속도 적용 (1.0이 아닌 경우)
        f"[0:v]{zoom_filter}scale={scaled_w}:{scaled_h}:"
        f"force_original_aspect_ratio=decrease,"
        f"crop={LETTERBOX_VIDEO_W}:{LETTERBOX_VIDEO_H}:(iw-{LETTERBOX_VIDEO_W})/2:(ih-{LETTERBOX_VIDEO_H})/2"
        f"{',setpts=PTS/' + str(PLAYBACK_SPEED) if PLAYBACK_SPEED != 1.0 else ''}"
        f"[scaled]",

        # 검정 배경 캔버스
        f"color=c={BG_COLOR}:s={CANVAS_WIDTH}x{CANVAS_HEIGHT}:r=30[bg]",

        # 영상을 캔버스에 배치
        f"[bg][scaled]overlay=0:{LETTERBOX_VIDEO_Y}:shortest=1[base]",
    ]

    # 자막 비활성화 — 원본 영상 자막 그대로 사용
    base_label = "base"

    # 훅 타이틀 1줄 (빨간색) — 배경 바 없음, Black Han Sans
    line_gap = 20  # 줄 간격
    filter_parts.append(
        f"[{base_label}]drawtext="
        f"textfile='{hook_line1_file}'"
        f"{hook_font_opt}"
        f":fontsize={HOOK_TITLE_FONTSIZE}"
        f":fontcolor=red"
        f":x=(w-tw)/2:y={HOOK_TITLE_Y}"
        f"[with_hook1]"
    )

    # 훅 타이틀 2줄 (노란색)
    hook_line2_y = HOOK_TITLE_Y + HOOK_TITLE_FONTSIZE + line_gap
    filter_parts.append(
        f"[with_hook1]drawtext="
        f"textfile='{hook_line2_file}'"
        f"{hook_font_opt}"
        f":fontsize={HOOK_TITLE_FONTSIZE}"
        f":fontcolor=yellow"
        f":x=(w-tw)/2:y={hook_line2_y}"
        f"[with_hook]"
    )

    # 보조 텍스트 (화면 하단)
    aux_y = CANVAS_HEIGHT - 80
    filter_parts.append(
        f"[with_hook]drawtext="
        f"textfile='{aux_file}'"
        f"{font_opt}"
        f":fontsize={AUX_TEXT_FONTSIZE}:fontcolor={AUX_TEXT_COLOR}"
        f":x=(w-tw)/2:y={aux_y}"
        f"[final]"
    )

    # ─── 오디오: 속도 조절 + LUFS 정규화 + 루프 최적화 ───
    audio_filters = []
    if PLAYBACK_SPEED != 1.0:
        audio_filters.append(f"atempo={PLAYBACK_SPEED}")
    audio_filters.append(f"loudnorm=I={LUFS_TARGET}:LRA={LUFS_LRA}:TP={LUFS_TP}")
    # 루프 최적화: loop_friendly 클립은 엔딩 오디오를 짧게 페이드아웃
    # → 루프 재생 시 끝→시작이 자연스럽게 이어짐 (하드컷 느낌)
    if LOOP_ENABLED and hasattr(clip, 'loop_friendly') and clip.loop_friendly:
        audio_filters.append(f"afade=t=out:st={clip.total_duration - LOOP_TAIL_FADE_SEC}:d={LOOP_TAIL_FADE_SEC}")
    filter_parts.append(
        f"[0:a]{','.join(audio_filters)}[aout]"
    )

    filter_complex = ";\n".join(filter_parts)

    # 하드 가드: FFmpeg 출력도 MAX_CLIP_DURATION으로 강제 제한
    max_output_duration = ["-t", str(MAX_CLIP_DURATION)]

    cmd = [
        "ffmpeg", "-y",
        *ss_args,                    # -ss를 -i 앞에 배치 (입력 seek = 빠름)
        "-i", video_path,
        *to_args,
        "-filter_complex", filter_complex,
        "-map", "[final]",           # 비디오
        "-map", "[aout]",            # 오디오
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-shortest",
        *max_output_duration,        # 하드 가드: 절대 이 길이 초과 불가
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[FFmpeg ERROR] exit={result.returncode}")
        print(f"[FFmpeg STDERR] {result.stderr[-1500:]}")
        result.check_returncode()  # CalledProcessError 발생

    # 임시 파일 정리
    cleanup_files = [hook_line1_file, hook_line2_file, aux_file]
    for f in cleanup_files:
        if os.path.exists(f):
            os.remove(f)


def _split_hook_to_two_lines(text: str) -> tuple[str, str]:
    """훅 타이틀을 항상 2줄로 분할 (짧아도 강제 2줄)"""
    mid = len(text) // 2
    space = text.rfind(" ", 0, mid + 5)
    if space == -1:
        space = text.find(" ", mid)
    if space == -1:
        space = mid
    line1 = text[:space].strip()
    line2 = text[space:].strip()
    return line1, line2


def _write_text_file(text: str) -> str:
    """텍스트를 임시 파일로 저장 (FFmpeg drawtext용)"""
    fd, path = tempfile.mkstemp(suffix=".txt", prefix="sfm_")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)
    return path


def _rewrite_text_file(path: str, text: str):
    """기존 임시 파일 덮어쓰기"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
