"""자동 썸네일 생성기 — 장면 변화 감지 + 텍스트 합성"""

import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

from config import (
    FONT_BOLD_INDEX,
    FONT_PATH,
    HOOK_TITLE_BG_COLOR,
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


def _composite_thumbnail(
    frame_path: str,
    hook_title: str,
    output_path: str,
):
    """프레임에 훅 타이틀 텍스트 합성"""
    img = Image.open(frame_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 폰트 로딩
    font_size = 64
    try:
        if FONT_PATH.endswith(".ttc"):
            font = ImageFont.truetype(FONT_PATH, font_size, index=FONT_BOLD_INDEX)
        else:
            font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()

    # 텍스트 줄바꿈 (20자 초과 시)
    if len(hook_title) > 20:
        mid = len(hook_title) // 2
        space = hook_title.rfind(" ", 0, mid + 5)
        if space == -1:
            space = mid
        hook_title = hook_title[:space] + "\n" + hook_title[space:].lstrip()

    # 텍스트 바운딩 박스 계산
    bbox = draw.textbbox((0, 0), hook_title, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # 하단 1/3 영역에 배치
    x = (THUMB_WIDTH - tw) // 2
    y = THUMB_HEIGHT - th - 80

    # 반투명 배경 바
    pad = 20
    bg_box = [x - pad, y - pad, x + tw + pad, y + th + pad]

    # 브랜드 컬러 배경 (#E4015C → RGB)
    bg_r = int(HOOK_TITLE_BG_COLOR[1:3], 16)
    bg_g = int(HOOK_TITLE_BG_COLOR[3:5], 16)
    bg_b = int(HOOK_TITLE_BG_COLOR[5:7], 16)

    # 반투명 오버레이
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle(bg_box, fill=(bg_r, bg_g, bg_b, 200))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # 텍스트 그리기 (그림자 + 본문)
    draw = ImageDraw.Draw(img)
    # 그림자
    draw.text((x + 2, y + 2), hook_title, font=font, fill=(0, 0, 0))
    # 본문
    draw.text((x, y), hook_title, font=font, fill=(255, 255, 255))

    img.save(output_path, "JPEG", quality=90)
