"""SRT/VTT 자막 파싱 → 통합 세그먼트 형식 변환"""

import re


def parse_srt(content: str) -> list[dict]:
    """SRT 자막 파싱 → Whisper 호환 세그먼트 리스트

    Returns:
        [{"start": float, "end": float, "text": str}, ...]
    """
    segments = []
    blocks = re.split(r"\n\s*\n", content.strip())

    for block in blocks:
        lines = block.strip().split("\n")
        if len(lines) < 3:
            continue

        # 타임코드 라인 찾기
        time_line = None
        text_lines = []
        for i, line in enumerate(lines):
            if "-->" in line:
                time_line = line
                text_lines = lines[i + 1:]
                break

        if not time_line:
            continue

        # 타임코드 파싱
        match = re.match(
            r"(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})",
            time_line.strip(),
        )
        if not match:
            continue

        start = _srt_time_to_seconds(match.group(1))
        end = _srt_time_to_seconds(match.group(2))
        text = " ".join(line.strip() for line in text_lines if line.strip())
        # HTML 태그 제거
        text = re.sub(r"<[^>]+>", "", text)

        if text:
            segments.append({"start": start, "end": end, "text": text})

    return segments


def parse_vtt(content: str) -> list[dict]:
    """VTT 자막 파싱 → Whisper 호환 세그먼트 리스트"""
    # WEBVTT 헤더 제거
    content = re.sub(r"^WEBVTT.*?\n\n", "", content, flags=re.DOTALL)
    # NOTE 블록 제거
    content = re.sub(r"NOTE.*?\n\n", "", content, flags=re.DOTALL)

    segments = []
    blocks = re.split(r"\n\s*\n", content.strip())

    for block in blocks:
        lines = block.strip().split("\n")
        if not lines:
            continue

        time_line = None
        text_lines = []
        for i, line in enumerate(lines):
            if "-->" in line:
                time_line = line
                text_lines = lines[i + 1:]
                break

        if not time_line:
            continue

        match = re.match(
            r"(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})",
            time_line.strip(),
        )
        if not match:
            continue

        start = _vtt_time_to_seconds(match.group(1))
        end = _vtt_time_to_seconds(match.group(2))
        text = " ".join(line.strip() for line in text_lines if line.strip())
        text = re.sub(r"<[^>]+>", "", text)

        if text:
            segments.append({"start": start, "end": end, "text": text})

    return segments


def parse_subtitle_file(file_path: str) -> list[dict]:
    """파일 확장자에 따라 자동으로 SRT/VTT 파싱"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if file_path.lower().endswith(".vtt"):
        return parse_vtt(content)
    return parse_srt(content)


def parse_subtitle_text(content: str, format_hint: str = "srt") -> list[dict]:
    """텍스트 내용을 직접 파싱 (파일 없이)"""
    if format_hint == "vtt" or content.strip().startswith("WEBVTT"):
        return parse_vtt(content)
    return parse_srt(content)


def segments_to_transcript_text(segments: list[dict]) -> str:
    """세그먼트를 Claude 분석용 텍스트로 변환

    형식: [HH:MM:SS ~ HH:MM:SS] 자막 텍스트
    """
    lines = []
    for seg in segments:
        start = _format_time(seg["start"])
        end = _format_time(seg["end"])
        text = seg["text"].strip()
        lines.append(f"[{start} ~ {end}] {text}")
    return "\n".join(lines)


def _srt_time_to_seconds(time_str: str) -> float:
    """SRT 타임코드 (00:01:23,456) → 초"""
    time_str = time_str.replace(",", ".")
    return _vtt_time_to_seconds(time_str)


def _vtt_time_to_seconds(time_str: str) -> float:
    """VTT 타임코드 (00:01:23.456) → 초"""
    parts = time_str.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    elif len(parts) == 2:
        m, s = parts
        return int(m) * 60 + float(s)
    return float(parts[0])


def _format_time(seconds: float) -> str:
    """초 → HH:MM:SS 형식"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"
