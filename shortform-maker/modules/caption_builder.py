"""ASS 번인 자막 생성기 — 워드별 하이라이트 카라오케 효과

Whisper word-level 타임스탬프 → ASS (Advanced SubStation Alpha) 자막 파일 변환
FFmpeg의 ass 필터로 렌더링하면 워드별 색상 전환 효과가 적용됨
"""

import os
import tempfile

from config import (
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    CAPTION_COLOR,
    CAPTION_FONTSIZE,
    CAPTION_HIGHLIGHT_COLOR,
    CAPTION_MAX_CHARS_PER_LINE,
    CAPTION_OUTLINE_COLOR,
    CAPTION_OUTLINE_WIDTH,
    CAPTION_SHADOW_DEPTH,
    FONT_NAME,
    LETTERBOX_BOTTOM_Y,
    CAPTION_Y_OFFSET,
)


def build_ass_subtitles(
    words: list[dict],
    clip_start_sec: float,
    clip_end_sec: float,
    highlight_keywords: list[str] | None = None,
) -> str | None:
    """워드 타임스탬프 → ASS 자막 파일 생성 (키워드 강조 지원)

    Args:
        words: Whisper word-level 결과 [{"word": str, "start": float, "end": float}, ...]
        clip_start_sec: 클립 시작 시간 (초)
        clip_end_sec: 클립 종료 시간 (초)
        highlight_keywords: AI가 선정한 핵심 키워드 리스트 (매칭 시 노란색 강조)

    Returns:
        ASS 파일 경로 또는 None (워드 데이터 없을 때)
    """
    if not words:
        return None

    # 클립 범위 내 워드만 필터링
    clip_words = [
        w for w in words
        if w.get("start", 0) >= clip_start_sec - 0.1
        and w.get("end", 0) <= clip_end_sec + 0.1
    ]

    if not clip_words:
        return None

    # 워드를 표시 그룹(줄)으로 분할
    groups = _group_words_into_lines(clip_words)

    # 키워드 세트 (소문자 매칭용)
    kw_set = set()
    if highlight_keywords:
        kw_set = {kw.strip().lower() for kw in highlight_keywords if kw.strip()}

    # ASS 파일 생성
    ass_content = _build_ass_content(groups, clip_start_sec, kw_set)

    fd, path = tempfile.mkstemp(suffix=".ass", prefix="sfm_caption_")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(ass_content)

    return path


def _group_words_into_lines(words: list[dict]) -> list[list[dict]]:
    """워드를 줄 단위로 그룹핑 (한 화면에 최대 2줄)

    한국어 기준 CAPTION_MAX_CHARS_PER_LINE 글자마다 줄바꿈.
    시간 간격이 1.5초 이상이면 새 그룹(새 화면) 시작.
    """
    if not words:
        return []

    groups = []
    current_line = []
    current_chars = 0

    for word in words:
        text = word.get("word", "").strip()
        if not text:
            continue

        # 시간 간격이 크면 새 그룹
        if current_line:
            prev_end = current_line[-1].get("end", 0)
            curr_start = word.get("start", 0)
            if curr_start - prev_end > 1.5:
                if current_line:
                    groups.append(current_line)
                current_line = []
                current_chars = 0

        # 줄 길이 초과 시 새 그룹
        if current_chars + len(text) > CAPTION_MAX_CHARS_PER_LINE * 2:
            if current_line:
                groups.append(current_line)
            current_line = []
            current_chars = 0

        current_line.append(word)
        current_chars += len(text)

    if current_line:
        groups.append(current_line)

    return groups


def _build_ass_content(groups: list[list[dict]], clip_start_sec: float, highlight_keywords: set | None = None) -> str:
    """ASS 자막 파일 내용 생성"""
    # 자막 Y 위치 (PlayResY 기준)
    margin_v = CANVAS_HEIGHT - LETTERBOX_BOTTOM_Y - CAPTION_Y_OFFSET

    header = f"""[Script Info]
Title: Shortform Captions
ScriptType: v4.00+
PlayResX: {CANVAS_WIDTH}
PlayResY: {CANVAS_HEIGHT}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,{FONT_NAME},{CAPTION_FONTSIZE},{CAPTION_COLOR},{CAPTION_HIGHLIGHT_COLOR},{CAPTION_OUTLINE_COLOR},&H80000000,-1,0,0,0,100,100,0,0,1,{CAPTION_OUTLINE_WIDTH},{CAPTION_SHADOW_DEPTH},2,20,20,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    for group in groups:
        if not group:
            continue

        group_start = group[0].get("start", 0) - clip_start_sec
        group_end = group[-1].get("end", 0) - clip_start_sec

        # 음수 방지
        group_start = max(0, group_start)
        group_end = max(group_start + 0.1, group_end)

        start_ts = _seconds_to_ass_time(group_start)
        end_ts = _seconds_to_ass_time(group_end)

        # 카라오케 태그로 워드별 하이라이트
        text_parts = []
        for i, word in enumerate(group):
            w_text = word.get("word", "").strip()
            if not w_text:
                continue

            w_start = word.get("start", 0) - clip_start_sec
            w_end = word.get("end", 0) - clip_start_sec

            # 카라오케 지속시간 (centiseconds)
            duration_cs = max(1, int((w_end - w_start) * 100))

            # 키워드 강조: 매칭되면 노란색 + 1.3배 크기
            is_keyword = False
            if highlight_keywords:
                w_lower = w_text.lower().strip()
                for kw in highlight_keywords:
                    if kw in w_lower or w_lower in kw:
                        is_keyword = True
                        break

            if is_keyword:
                # 키워드: 노란색 + 크게 + 카라오케
                keyword_size = int(CAPTION_FONTSIZE * 1.3)
                text_parts.append(
                    f"{{\\kf{duration_cs}\\c{CAPTION_HIGHLIGHT_COLOR}\\fs{keyword_size}}}"
                    f"{w_text}"
                    f"{{\\c{CAPTION_COLOR}\\fs{CAPTION_FONTSIZE}}}"
                )
            else:
                # 일반: 카라오케만
                text_parts.append(f"{{\\kf{duration_cs}}}{w_text}")

            # 줄바꿈 체크 (CAPTION_MAX_CHARS_PER_LINE 초과 시)
            total_chars = sum(len(w.get("word", "").strip()) for w in group[:i+1])
            if (total_chars >= CAPTION_MAX_CHARS_PER_LINE
                    and i < len(group) - 1):
                # 다음 워드부터 이미 넘으면 줄바꿈
                next_total = sum(len(w.get("word", "").strip()) for w in group[:i+2])
                if next_total > CAPTION_MAX_CHARS_PER_LINE:
                    text_parts.append("\\N")

        text = "".join(text_parts)
        events.append(f"Dialogue: 0,{start_ts},{end_ts},Caption,,0,0,0,,{text}")

    return header + "\n".join(events) + "\n"


def _seconds_to_ass_time(seconds: float) -> str:
    """초 → ASS 타임코드 (H:MM:SS.CC)"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int((seconds % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"
