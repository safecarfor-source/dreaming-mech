"""Claude 2단계 분석 — 하이라이트 선정 + 문구 생성 + Virality Score"""

import json
import logging

import anthropic

from config import (
    CLAUDE_MAX_TOKENS_ANALYSIS,
    CLAUDE_MAX_TOKENS_COPY,
    CLAUDE_MODEL,
    CLAUDE_MODEL_OPUS,
    MAX_CLIP_DURATION,
    PROMPTS_DIR,
)

logger = logging.getLogger(__name__)
from modules.knowledge import load_rules_for_prompt
from modules.subtitle_parser import segments_to_transcript_text


def analyze_two_stage(
    segments: list[dict],
    script: str | None = None,
) -> list[dict]:
    """2단계 Claude 분석 실행

    1단계: 하이라이트 구간 선정 + 구간 합성 제안
    2단계: 소비자 욕구 기반 문구 생성 + Virality Score

    Args:
        segments: Whisper/SRT 파싱된 자막 세그먼트 리스트
        script: 대본 텍스트 (선택)

    Returns:
        최종 클립 정보 리스트 (Virality Score순 정렬)
    """
    client = anthropic.Anthropic()
    rules_text = load_rules_for_prompt()
    transcript_text = segments_to_transcript_text(segments)

    # 1단계: 하이라이트 분석
    stage1_result = _stage1_highlights(client, rules_text, transcript_text, script)

    # 2단계: 문구 생성 + Virality Score
    stage2_result = _stage2_copy(client, rules_text, stage1_result, segments)

    # 세그먼트 정보 병합 + Virality Score순 정렬
    clips = _merge_results(stage1_result, stage2_result)
    clips.sort(key=lambda c: c.get("virality_score", 0), reverse=True)

    return clips


def _stage1_highlights(
    client: anthropic.Anthropic,
    rules_text: str,
    transcript_text: str,
    script: str | None,
) -> dict:
    """1단계: 하이라이트 구간 선정"""
    prompt_path = PROMPTS_DIR / "analyze_highlights.txt"
    if prompt_path.exists():
        template = prompt_path.read_text(encoding="utf-8")
    else:
        raise FileNotFoundError("prompts/analyze_highlights.txt 없음")

    script_section = ""
    if script:
        script_section = f"\n## 대본 (참고)\n{script}\n"

    prompt = template.replace("{rules}", rules_text)
    prompt = prompt.replace("{transcript}", transcript_text)
    prompt = prompt.replace("{script_section}", script_section)

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=CLAUDE_MAX_TOKENS_ANALYSIS,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(response.content[0].text)


def _stage2_copy(
    client: anthropic.Anthropic,
    rules_text: str,
    stage1_result: dict,
    segments: list[dict],
) -> dict:
    """2단계: 소비자 욕구 기반 문구 + Virality Score"""
    prompt_path = PROMPTS_DIR / "generate_copy.txt"
    if prompt_path.exists():
        template = prompt_path.read_text(encoding="utf-8")
    else:
        raise FileNotFoundError("prompts/generate_copy.txt 없음")

    # 각 선정 구간의 실제 자막 텍스트 추출
    segments_text_parts = []
    for seg in stage1_result.get("segments", []):
        start_sec = _time_to_seconds(seg["start"])
        end_sec = _time_to_seconds(seg["end"])
        relevant = [
            s["text"] for s in segments
            if s["end"] > start_sec and s["start"] < end_sec
        ]
        segments_text_parts.append(
            f"### 구간 {seg['id']}: [{seg['start']} ~ {seg['end']}]\n" + " ".join(relevant)
        )

    # 합성 구간 텍스트도 추가
    segments_by_id = {s["id"]: s for s in stage1_result.get("segments", [])}
    for comp in stage1_result.get("compositions", []):
        comp_text_parts = []
        for seg_id in comp["segment_ids"]:
            seg = segments_by_id.get(seg_id, {})
            start_sec = _time_to_seconds(seg["start"])
            end_sec = _time_to_seconds(seg["end"])
            relevant = [
                s["text"] for s in segments
                if s["end"] > start_sec and s["start"] < end_sec
            ]
            comp_text_parts.append(f"[{seg['start']}~{seg['end']}] " + " ".join(relevant))
        segments_text_parts.append(
            f"### 합성 구간 {comp['segment_ids']}\n" + "\n".join(comp_text_parts)
        )

    prompt = template.replace("{rules}", rules_text)
    prompt = prompt.replace("{segments_json}", json.dumps(stage1_result, ensure_ascii=False, indent=2))
    prompt = prompt.replace("{segments_text}", "\n\n".join(segments_text_parts))

    response = client.messages.create(
        model=CLAUDE_MODEL_OPUS,
        max_tokens=CLAUDE_MAX_TOKENS_COPY,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(response.content[0].text)


def _merge_results(stage1: dict, stage2: dict) -> list[dict]:
    """1단계 + 2단계 결과 병합"""
    clips = []
    segments_map = {s["id"]: s for s in stage1.get("segments", [])}
    compositions_map = {
        tuple(c["segment_ids"]): c for c in stage1.get("compositions", [])
    }

    for clip_info in stage2.get("clips", []):
        clip = dict(clip_info)

        if clip.get("is_composition") and clip.get("composition_ids"):
            # 합성 구간
            comp_key = tuple(clip["composition_ids"])
            comp = compositions_map.get(comp_key, {})
            clip["segments"] = [segments_map[sid] for sid in clip["composition_ids"] if sid in segments_map]
            clip["composition_reason"] = comp.get("reason", "")
        else:
            # 단일 구간
            seg_id = clip.get("segment_id", 0)
            seg = segments_map.get(seg_id, {})
            clip["start"] = seg.get("start", "00:00:00")
            clip["end"] = seg.get("end", "00:00:00")
            clip["keywords"] = seg.get("keywords", [])
            clip["summary"] = seg.get("summary", "")
            # v2.0: 3초 훅 리오더 + 루프 친화성
            clip["hook_reorder"] = seg.get("hook_reorder")
            clip["loop_friendly"] = seg.get("loop_friendly", False)

        clips.append(clip)

    return clips


def recut_oversized_segment(
    clip_data: dict,
    segments: list[dict],
) -> list[dict]:
    """초과 구간을 AI에게 보내서 50초 이내로 재설계

    Args:
        clip_data: 초과된 클립 정보 (start, end, summary, keywords 등)
        segments: 전체 자막 세그먼트 리스트

    Returns:
        재설계된 클립 데이터 리스트 (1~2개). 실패 시 빈 리스트.
    """
    client = anthropic.Anthropic()

    # 해당 구간의 자막 추출
    start_sec = _time_to_seconds(clip_data.get("start", "00:00:00"))
    end_sec = _time_to_seconds(clip_data.get("end", "00:00:00"))
    duration_sec = round(end_sec - start_sec)

    relevant_text = []
    for s in segments:
        if s["end"] > start_sec and s["start"] < end_sec:
            relevant_text.append(f"[{_seconds_to_time(s['start'])}] {s['text']}")
    segment_transcript = "\n".join(relevant_text)

    # 프롬프트 조립
    prompt_path = PROMPTS_DIR / "recut_oversized.txt"
    if not prompt_path.exists():
        logger.error("[RECUT] recut_oversized.txt 프롬프트 없음")
        return []

    template = prompt_path.read_text(encoding="utf-8")
    prompt = template.replace("{start}", clip_data.get("start", ""))
    prompt = prompt.replace("{end}", clip_data.get("end", ""))
    prompt = prompt.replace("{duration_sec}", str(duration_sec))
    prompt = prompt.replace("{summary}", clip_data.get("summary", ""))
    prompt = prompt.replace("{keywords}", ", ".join(clip_data.get("keywords", [])))
    prompt = prompt.replace("{segment_transcript}", segment_transcript)

    logger.info(
        f"[RECUT] '{clip_data.get('summary', '')}' {duration_sec}초 → "
        f"50초 이내로 재설계 요청"
    )

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=CLAUDE_MAX_TOKENS_ANALYSIS,
            messages=[{"role": "user", "content": prompt}],
        )
        result = _parse_json_response(response.content[0].text)
        recut_segments = result.get("recut_segments", [])

        # 재설계 결과 검증 — 여전히 초과하면 버림
        valid = []
        for seg in recut_segments:
            seg_start = _time_to_seconds(seg["start"])
            seg_end = _time_to_seconds(seg["end"])
            seg_dur = seg_end - seg_start
            if seg_dur <= MAX_CLIP_DURATION and seg_dur >= 15:
                valid.append(seg)
                logger.info(f"[RECUT] ✅ 재설계 성공: {seg['start']}~{seg['end']} ({seg_dur:.0f}초)")
            else:
                logger.warning(f"[RECUT] ❌ 재설계 결과도 범위 밖: {seg_dur:.0f}초 → 제외")

        return valid

    except Exception as e:
        logger.error(f"[RECUT] AI 재설계 실패: {e}")
        return []


def _seconds_to_time(seconds: float) -> str:
    """초 → HH:MM:SS"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def snap_to_sentence_boundary(
    target_time: float,
    segments: list[dict],
    direction: str = "nearest",
) -> float:
    """타임코드를 가장 가까운 세그먼트 경계로 스냅

    Args:
        target_time: 목표 시간 (초)
        segments: 자막 세그먼트 리스트
        direction: "nearest" | "before" | "after"

    Returns:
        스냅된 시간 (초)
    """
    if not segments:
        return target_time

    boundaries = []
    for seg in segments:
        boundaries.append(seg["start"])
        boundaries.append(seg["end"])

    boundaries = sorted(set(boundaries))

    if direction == "before":
        candidates = [b for b in boundaries if b <= target_time]
        return max(candidates) if candidates else target_time
    elif direction == "after":
        candidates = [b for b in boundaries if b >= target_time]
        return min(candidates) if candidates else target_time
    else:
        return min(boundaries, key=lambda b: abs(b - target_time))


def _parse_json_response(text: str) -> dict:
    """Claude 응답에서 JSON 추출"""
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    return json.loads(text.strip())


def _time_to_seconds(time_str: str) -> float:
    """HH:MM:SS → 초"""
    parts = time_str.split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return float(parts[0])
