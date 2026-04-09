"""구간 합성 로직 — 단일/멀티 구간 조립"""

import logging
from dataclasses import dataclass, field

from config import MAX_CLIP_DURATION, MIN_CLIP_DURATION

logger = logging.getLogger(__name__)


@dataclass
class ClipSegment:
    """하나의 시간 구간"""
    start: str  # HH:MM:SS
    end: str
    start_sec: float = 0.0
    end_sec: float = 0.0

    def __post_init__(self):
        self.start_sec = _time_to_seconds(self.start)
        self.end_sec = _time_to_seconds(self.end)

    @property
    def duration(self) -> float:
        return self.end_sec - self.start_sec


@dataclass
class ComposedClip:
    """최종 클립 (단일 또는 합성)"""
    segments: list[ClipSegment]
    hook_title: str = ""
    subtitle: str = ""
    aux_text: str = "꿈꾸는정비사"
    virality_score: int = 0
    primary_desire: str = ""
    reason: str = ""
    score_breakdown: dict = field(default_factory=dict)
    is_composition: bool = False
    words: list[dict] = field(default_factory=list)  # Whisper word-level 타임스탬프
    hook_reorder: dict | None = None  # 3초 훅 리오더 {"hook_start": "HH:MM:SS", "hook_end": "HH:MM:SS"}
    loop_friendly: bool = False  # 루프 친화 구간 (엔딩→시작 자연 연결)
    hook_type: str = ""  # 훅 유형 (fear/secret/diagnosis/money)
    highlight_keywords: list[str] = field(default_factory=list)  # 자막 강조 키워드

    @property
    def total_duration(self) -> float:
        return sum(s.duration for s in self.segments)

    @property
    def display_time(self) -> str:
        if len(self.segments) == 1:
            return f"{self.segments[0].start} ~ {self.segments[0].end}"
        parts = [f"{s.start}~{s.end}" for s in self.segments]
        return " + ".join(parts)


def build_clips(
    analysis_clips: list[dict],
    all_words: list[dict] | None = None,
) -> tuple[list[ComposedClip], list[dict]]:
    """분석 결과에서 ComposedClip 리스트 생성

    Args:
        analysis_clips: analyzer.analyze_two_stage() 결과
        all_words: Whisper word-level 타임스탬프 (전체 영상)

    Returns:
        (유효 클립 리스트, 초과 클립 원본 데이터 리스트)
        - 유효 클립: 검증 통과, Virality Score순
        - 초과 클립: duration > MAX → pipeline에서 recut 처리용
    """
    clips = []
    oversized_raw = []  # recut 대상 원본 데이터

    for clip_data in analysis_clips:
        if clip_data.get("is_composition") and clip_data.get("segments"):
            segments = [
                ClipSegment(start=s["start"], end=s["end"])
                for s in clip_data["segments"]
            ]
            composed = ComposedClip(
                segments=segments,
                is_composition=True,
                hook_title=clip_data.get("hook_title", ""),
                subtitle=clip_data.get("subtitle", ""),
                aux_text=clip_data.get("aux_text", "꿈꾸는정비사"),
                virality_score=clip_data.get("virality_score", 0),
                primary_desire=clip_data.get("primary_desire", ""),
                reason=clip_data.get("reason", ""),
                score_breakdown=clip_data.get("score_breakdown", {}),
                hook_reorder=clip_data.get("hook_reorder"),
                loop_friendly=clip_data.get("loop_friendly", False),
                hook_type=clip_data.get("hook_type", ""),
                highlight_keywords=clip_data.get("highlight_keywords", []),
            )
        else:
            seg = ClipSegment(
                start=clip_data.get("start", "00:00:00"),
                end=clip_data.get("end", "00:00:00"),
            )
            # 키워드 병합: 1단계 keywords + 2단계 highlight_keywords
            merged_keywords = list(set(
                (clip_data.get("highlight_keywords") or []) +
                (clip_data.get("keywords") or [])
            ))
            composed = ComposedClip(
                segments=[seg],
                is_composition=False,
                hook_title=clip_data.get("hook_title", ""),
                subtitle=clip_data.get("subtitle", ""),
                aux_text=clip_data.get("aux_text", "꿈꾸는정비사"),
                virality_score=clip_data.get("virality_score", 0),
                primary_desire=clip_data.get("primary_desire", ""),
                reason=clip_data.get("reason", ""),
                score_breakdown=clip_data.get("score_breakdown", {}),
                hook_reorder=clip_data.get("hook_reorder"),
                loop_friendly=clip_data.get("loop_friendly", False),
                hook_type=clip_data.get("hook_type", ""),
                highlight_keywords=merged_keywords,
            )

        # 클립 범위 내 워드 필터링
        if all_words:
            composed.words = _filter_words_for_clip(all_words, composed)

        if composed.total_duration > MAX_CLIP_DURATION:
            # 초과 클립 → recut 대상으로 분리
            logger.warning(
                f"[OVERSIZED] '{composed.hook_title}' {composed.total_duration:.0f}초 > "
                f"MAX {MAX_CLIP_DURATION}초 → recut 대상으로 분리"
            )
            oversized_raw.append(clip_data)
        elif _validate_clip(composed):
            clips.append(composed)

    clips.sort(key=lambda c: c.virality_score, reverse=True)

    # 하네스: 겹치는 클립 자동 제거 (30% 이상 겹치면 낮은 점수 클립 탈락)
    clips = _deduplicate_overlapping(clips)

    return clips, oversized_raw


def _filter_words_for_clip(
    all_words: list[dict],
    clip: "ComposedClip",
) -> list[dict]:
    """클립 시간 범위 내 워드만 필터링"""
    clip_words = []
    for seg in clip.segments:
        for w in all_words:
            w_start = w.get("start", 0)
            w_end = w.get("end", 0)
            if w_start >= seg.start_sec - 0.1 and w_end <= seg.end_sec + 0.1:
                clip_words.append(w)
    return clip_words


def _validate_clip(clip: ComposedClip) -> bool:
    """클립 유효성 검증"""
    duration = clip.total_duration

    if duration < MIN_CLIP_DURATION:
        logger.warning(
            f"[REJECT] 클립 '{clip.hook_title}' 길이 {duration:.1f}초 < "
            f"MIN {MIN_CLIP_DURATION}초 → 탈락"
        )
        return False
    if duration > MAX_CLIP_DURATION:
        # clamp 이후에도 여기 오면 진짜 문제 — 절대 통과 불가
        logger.error(
            f"[REJECT] 클립 '{clip.hook_title}' 길이 {duration:.1f}초 > "
            f"MAX {MAX_CLIP_DURATION}초 → 탈락 (clamp 실패)"
        )
        return False
    if not clip.hook_title:
        logger.warning("[REJECT] 훅 타이틀 없음 → 탈락")
        return False

    # 각 세그먼트의 시간이 유효한지
    for seg in clip.segments:
        if seg.start_sec >= seg.end_sec:
            logger.warning(
                f"[REJECT] 세그먼트 시간 역전: {seg.start}({seg.start_sec}) >= "
                f"{seg.end}({seg.end_sec}) → 탈락"
            )
            return False

    # 워드 타임스탬프로 화면전환(공백) 감지
    if clip.words and _has_long_gap(clip.words):
        logger.warning(
            f"[REJECT] 클립 '{clip.hook_title}' 내부에 2초+ 공백 감지 "
            f"→ 화면 전환 포함 가능성 → 탈락"
        )
        return False

    return True


def _deduplicate_overlapping(clips: list[ComposedClip]) -> list[ComposedClip]:
    """겹치는 클립 자동 제거 (하네스 강제)

    두 클립의 시간이 30% 이상 겹치면, virality_score가 낮은 쪽을 제거.
    이미 virality_score 내림차순 정렬된 상태에서 호출됨.
    """
    if len(clips) <= 1:
        return clips

    kept = []
    for clip in clips:
        clip_start = clip.segments[0].start_sec
        clip_end = clip.segments[-1].end_sec
        clip_dur = clip_end - clip_start

        is_duplicate = False
        for existing in kept:
            ex_start = existing.segments[0].start_sec
            ex_end = existing.segments[-1].end_sec

            # 겹침 구간 계산
            overlap_start = max(clip_start, ex_start)
            overlap_end = min(clip_end, ex_end)
            overlap = max(0, overlap_end - overlap_start)

            # 둘 중 짧은 클립 기준 겹침률
            shorter_dur = min(clip_dur, ex_end - ex_start)
            if shorter_dur > 0 and overlap / shorter_dur > 0.3:
                logger.warning(
                    f"[DEDUP] '{clip.hook_title}' ↔ '{existing.hook_title}' "
                    f"겹침 {overlap:.0f}초 ({overlap/shorter_dur*100:.0f}%) → 낮은 점수 제거"
                )
                is_duplicate = True
                break

        if not is_duplicate:
            kept.append(clip)

    if len(kept) < len(clips):
        logger.info(f"[DEDUP] {len(clips)}개 → {len(kept)}개 (중복 {len(clips)-len(kept)}개 제거)")

    return kept


def _has_long_gap(words: list[dict], gap_threshold: float = 2.0) -> bool:
    """워드 타임스탬프에서 2초 이상 공백(화면전환) 감지"""
    for i in range(1, len(words)):
        prev_end = words[i - 1].get("end", 0)
        curr_start = words[i].get("start", 0)
        if curr_start - prev_end >= gap_threshold:
            return True
    return False


def _time_to_seconds(time_str: str) -> float:
    """HH:MM:SS → 초"""
    parts = time_str.split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return float(parts[0])


def _seconds_to_time(seconds: float) -> str:
    """초 → HH:MM:SS"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"
