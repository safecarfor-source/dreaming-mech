"""FFmpeg 레터박스 렌더링 + 타이틀 오버레이"""

import os
import subprocess
import tempfile

from config import (
    AUX_TEXT_COLOR,
    AUX_TEXT_FONTSIZE,
    BG_COLOR,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    FADE_DURATION,
    FONT_BOLD_INDEX,
    FONT_PATH,
    HOOK_TITLE_BG_COLOR,
    HOOK_TITLE_BG_OPACITY,
    HOOK_TITLE_COLOR,
    HOOK_TITLE_FONTSIZE,
    HOOK_TITLE_MAX_CHARS,
    LAYOUT_TOP_PX,
    SUBTITLE_BG_COLOR,
    SUBTITLE_BG_OPACITY,
    SUBTITLE_COLOR,
    SUBTITLE_FONTSIZE,
)
from modules.composer import ComposedClip


def render_clip(
    video_path: str,
    clip: ComposedClip,
    output_path: str,
) -> str:
    """숏폼 클립 렌더링

    Args:
        video_path: 원본 영상 경로
        clip: ComposedClip 객체
        output_path: 출력 파일 경로

    Returns:
        출력 파일 경로
    """
    if clip.is_composition and len(clip.segments) > 1:
        # 2-pass: 먼저 구간 합성 → 레터박스 + 오버레이
        tmp_concat = output_path.replace(".mp4", "_concat.mp4")
        _concat_segments(video_path, clip, tmp_concat)
        _apply_letterbox_overlay(tmp_concat, clip, output_path, is_concat=True)
        # 임시 파일 정리
        if os.path.exists(tmp_concat):
            os.remove(tmp_concat)
    else:
        # 1-pass: 단일 구간 직접 처리
        _apply_letterbox_overlay(video_path, clip, output_path, is_concat=False)

    return output_path


def _concat_segments(video_path: str, clip: ComposedClip, output_path: str):
    """여러 구간을 이어붙이기 (trim + concat + fade)"""
    segments = clip.segments
    n = len(segments)

    filter_parts = []
    concat_inputs = []

    for i, seg in enumerate(segments):
        # 비디오 트림
        filter_parts.append(
            f"[0:v]trim=start={seg.start_sec}:end={seg.end_sec},"
            f"setpts=PTS-STARTPTS[v{i}]"
        )
        # 오디오 트림
        filter_parts.append(
            f"[0:a]atrim=start={seg.start_sec}:end={seg.end_sec},"
            f"asetpts=PTS-STARTPTS[a{i}]"
        )
        concat_inputs.append(f"[v{i}][a{i}]")

    # concat
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
        output_path,
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def _apply_letterbox_overlay(
    video_path: str,
    clip: ComposedClip,
    output_path: str,
    is_concat: bool = False,
):
    """레터박스 배경 + 영상 중앙 배치 + 타이틀 오버레이"""
    seg = clip.segments[0]

    # 한글 텍스트를 임시 파일로 저장 (인코딩 문제 방지)
    hook_file = _write_text_file(clip.hook_title)
    sub_file = _write_text_file(clip.subtitle)
    aux_file = _write_text_file(clip.aux_text)

    # 폰트 존재 여부 확인
    font = FONT_PATH if os.path.exists(FONT_PATH) else ""
    font_opt = f":fontfile='{font}'" if font else ""
    font_bold_opt = f":fontfile='{font}':fontindex={FONT_BOLD_INDEX}" if font else ""

    # 훅 타이틀 줄바꿈 처리
    hook_text = clip.hook_title
    if len(hook_text) > HOOK_TITLE_MAX_CHARS:
        # 중간 지점에서 줄바꿈
        mid = len(hook_text) // 2
        # 공백 기준으로 가장 가까운 위치 찾기
        space_pos = hook_text.rfind(" ", 0, mid + 5)
        if space_pos == -1:
            space_pos = mid
        hook_text = hook_text[:space_pos] + "\n" + hook_text[space_pos:].lstrip()
        _rewrite_text_file(hook_file, hook_text)

    # 배경색 opacity 변환 (hex alpha)
    hook_bg_alpha = hex(int(HOOK_TITLE_BG_OPACITY * 255))[2:].upper().zfill(2)
    sub_bg_alpha = hex(int(SUBTITLE_BG_OPACITY * 255))[2:].upper().zfill(2)

    # FFmpeg 필터 체인
    # 1. 원본 영상 스케일 (가로 1080에 맞춤)
    # 2. 검정 배경 생성 (1080x1920)
    # 3. 영상을 배경 중앙에 배치
    # 4. drawtext로 타이틀/서브타이틀 오버레이

    # 훅 타이틀 Y 위치: 상단 20% 영역 중앙 (384px 영역에서 중앙)
    hook_y = LAYOUT_TOP_PX // 2 - HOOK_TITLE_FONTSIZE // 2  # 약 160px

    # 서브타이틀 Y 위치: 하단 20% 영역 상단
    sub_y = CANVAS_HEIGHT - LAYOUT_TOP_PX + 60  # 약 1596px

    # 보조 텍스트 Y 위치
    aux_y = sub_y + SUBTITLE_FONTSIZE + 40  # 서브타이틀 아래

    # 시간 범위 (concat된 경우 전체, 아닌 경우 세그먼트)
    if is_concat:
        ss_args = []
        to_args = []
    else:
        ss_args = ["-ss", seg.start]
        to_args = ["-to", seg.end]

    filter_complex = (
        # 스케일 + 배경
        f"[0:v]scale={CANVAS_WIDTH}:-2[scaled];"
        f"color={BG_COLOR}:s={CANVAS_WIDTH}x{CANVAS_HEIGHT}[bg];"
        f"[bg][scaled]overlay=(W-w)/2:(H-h)/2[base];"
        # 훅 타이틀 (배경색 span, 전체 지속)
        f"[base]drawtext="
        f"textfile='{hook_file}'"
        f"{font_bold_opt}"
        f":fontsize={HOOK_TITLE_FONTSIZE}"
        f":fontcolor={HOOK_TITLE_COLOR}"
        f":box=1"
        f":boxcolor={HOOK_TITLE_BG_COLOR}@{HOOK_TITLE_BG_OPACITY}"
        f":boxborderw=16"
        f":x=(w-tw)/2"
        f":y={hook_y}"
        f"[with_hook];"
        # 서브타이틀
        f"[with_hook]drawtext="
        f"textfile='{sub_file}'"
        f"{font_opt}"
        f":fontsize={SUBTITLE_FONTSIZE}"
        f":fontcolor={SUBTITLE_COLOR}"
        f":box=1"
        f":boxcolor={SUBTITLE_BG_COLOR}@{SUBTITLE_BG_OPACITY}"
        f":boxborderw=12"
        f":x=(w-tw)/2"
        f":y={sub_y}"
        f"[with_sub];"
        # 보조 텍스트
        f"[with_sub]drawtext="
        f"textfile='{aux_file}'"
        f"{font_opt}"
        f":fontsize={AUX_TEXT_FONTSIZE}"
        f":fontcolor={AUX_TEXT_COLOR}"
        f":x=(w-tw)/2"
        f":y={aux_y}"
        f"[final]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        *ss_args,
        *to_args,
        "-filter_complex", filter_complex,
        "-map", "[final]",
        "-map", "0:a",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-shortest",
        output_path,
    ]
    subprocess.run(cmd, check=True, capture_output=True)

    # 임시 텍스트 파일 정리
    for f in [hook_file, sub_file, aux_file]:
        if os.path.exists(f):
            os.remove(f)


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
