"""자동 썸네일 생성기 — 장면 변화 감지 + 텍스트 합성"""

import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

from config import (
    FONT_BOLD_INDEX,
    FONT_PATH,
    HOOK_FONT_PATH_DOCKER,
    HOOK_FONT_PATH_MAC,
)

# 썸네일 사이즈 (YouTube 표준)
THUMB_WIDTH = 1280
THUMB_HEIGHT = 720


def generate_thumbnail(
    video_path: str,
    hook_title: str,
    output_path: str,
    start_sec: float = 0,
    end_sec: float = 0,
) -> str | None:
    """영상에서 썸네일 자동 생성

    Args:
        video_path: 원본 영상 경로
        hook_title: 훅 타이틀 텍스트
        output_path: 출력 경로 (.jpg)
        start_sec: 클립 시작 시간
        end_sec: 클립 종료 시간

    Returns:
        썸네일 파일 경로 또는 None
    """
    try:
        # 1. 장면 변화가 큰 프레임 추출 (최대 5개 후보)
        frames = _extract_scene_frames(video_path, start_sec, end_sec)
        if not frames:
            # fallback: 중간 지점 프레임
            frames = _extract_midpoint_frame(video_path, start_sec, end_sec)

        if not frames:
            return None

        # 2. 첫 번째 후보 프레임에 텍스트 합성
        best_frame = frames[0]
        _composite_thumbnail(best_frame, hook_title, output_path)

        # 임시 프레임 파일 정리
        for f in frames:
            if os.path.exists(f):
                os.remove(f)

        return output_path

    except Exception:
        return None


def _extract_scene_frames(
    video_path: str,
    start_sec: float,
    end_sec: float,
    max_frames: int = 5,
) -> list[str]:
    """장면 변화 감지로 역동적 프레임 추출"""
    tmpdir = tempfile.mkdtemp(prefix="sfm_thumb_")

    ss_args = []
    to_args = []
    if start_sec > 0:
        ss_args = ["-ss", str(start_sec)]
    if end_sec > 0:
        to_args = ["-to", str(end_sec)]

    cmd = [
        "ffmpeg", "-y",
        *ss_args,
        "-i", video_path,
        *to_args,
        "-vf", "select='gt(scene\\,0.25)',scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
        "-vsync", "vfr",
        "-frames:v", str(max_frames),
        "-q:v", "2",
        os.path.join(tmpdir, "frame_%02d.jpg"),
    ]

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        return []

    frames = sorted(
        [os.path.join(tmpdir, f) for f in os.listdir(tmpdir) if f.endswith(".jpg")]
    )
    return frames


def _extract_midpoint_frame(
    video_path: str,
    start_sec: float,
    end_sec: float,
) -> list[str]:
    """중간 지점 프레임 추출 (fallback)"""
    mid = (start_sec + end_sec) / 2 if end_sec > 0 else 5.0
    tmpdir = tempfile.mkdtemp(prefix="sfm_thumb_")
    out_path = os.path.join(tmpdir, "frame_mid.jpg")

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(mid),
        "-i", video_path,
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
        "-frames:v", "1",
        "-q:v", "2",
        out_path,
    ]

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode == 0 and os.path.exists(out_path):
        return [out_path]
    return []


def _split_to_two_lines(text: str) -> tuple[str, str]:
    """텍스트를 항상 2줄로 분할 (짧아도 강제 2줄)"""
    # 공백 기준 중간 지점에서 분할
    mid = len(text) // 2
    space = text.rfind(" ", 0, mid + 5)
    if space == -1:
        space = text.find(" ", mid)
    if space == -1:
        # 공백이 없으면 글자 수 기준 분할
        space = mid
    line1 = text[:space].strip()
    line2 = text[space:].strip()
    return line1, line2


def _composite_thumbnail(
    frame_path: str,
    hook_title: str,
    output_path: str,
):
    """프레임에 훅 타이틀 텍스트 합성 — 상단 배치, 1줄 빨간 + 2줄 노란"""
    img = Image.open(frame_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 폰트 로딩 (85px, Black Han Sans 우선)
    font_size = 85
    try:
        if os.path.exists(HOOK_FONT_PATH_DOCKER):
            font = ImageFont.truetype(HOOK_FONT_PATH_DOCKER, font_size)
        elif os.path.exists(HOOK_FONT_PATH_MAC):
            font = ImageFont.truetype(HOOK_FONT_PATH_MAC, font_size, index=FONT_BOLD_INDEX)
        elif FONT_PATH.endswith(".ttc"):
            font = ImageFont.truetype(FONT_PATH, font_size, index=FONT_BOLD_INDEX)
        else:
            font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()

    # 항상 2줄로 분할
    line1, line2 = _split_to_two_lines(hook_title)

    # 각 줄 바운딩 박스 계산
    bbox1 = draw.textbbox((0, 0), line1, font=font)
    bbox2 = draw.textbbox((0, 0), line2, font=font)
    tw1 = bbox1[2] - bbox1[0]
    th1 = bbox1[3] - bbox1[1]
    tw2 = bbox2[2] - bbox2[0]
    th2 = bbox2[3] - bbox2[1]

    # 상단 배치 (y=80부터)
    line_gap = 15
    x1 = (THUMB_WIDTH - tw1) // 2
    y1 = 80
    x2 = (THUMB_WIDTH - tw2) // 2
    y2 = y1 + th1 + line_gap

    # 1줄: 빨간색, 2줄: 노란색 (배경 바/외곽선/그림자 없음)
    draw.text((x1, y1), line1, font=font, fill=(255, 0, 0))
    draw.text((x2, y2), line2, font=font, fill=(255, 255, 0))

    img.save(output_path, "JPEG", quality=90)
