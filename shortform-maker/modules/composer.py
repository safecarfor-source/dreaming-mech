"""구간 합성 로직 — 단일/멀티 구간 조립"""

from dataclasses import dataclass, field

from config import MAX_CLIP_DURATION, MIN_CLIP_DURATION


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

    @property
    def total_duration(self) -> float:
        return sum(s.duration for s in self.segments)

    @property
    def display_time(self) -> str:
        if len(self.segments) == 1:
            return f"{self.segments[0].start} ~ {self.segments[0].end}"
        parts = [f"{s.start}~{s.end}" for s in self.segments]
        return " + ".join(parts)


def build_clips(analysis_clips: list[dict]) -> list[ComposedClip]:
    """분석 결과에서 ComposedClip 리스트 생성

    Args:
        analysis_clips: analyzer.analyze_two_stage() 결과

    Returns:
        검증 통과한 ComposedClip 리스트 (Virality Score순)
    """
    clips = []

    for clip_data in analysis_clips:
        if clip_data.get("is_composition") and clip_data.get("segments"):
            # 합성 구간
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
            )
        else:
            # 단일 구간
            seg = ClipSegment(
                start=clip_data.get("start", "00:00:00"),
                end=clip_data.get("end", "00:00:00"),
            )
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
            )

        # 검증
        if _validate_clip(composed):
            clips.append(composed)

    # Virality Score순 정렬
    clips.sort(key=lambda c: c.virality_score, reverse=True)
    return clips


def _validate_clip(clip: ComposedClip) -> bool:
    """클립 유효성 검증"""
    duration = clip.total_duration

    if duration < MIN_CLIP_DURATION:
        return False
    if duration > MAX_CLIP_DURATION:
        return False
    if not clip.hook_title:
        return False

    # 각 세그먼트의 시간이 유효한지
    for seg in clip.segments:
        if seg.start_sec >= seg.end_sec:
            return False

    return True


def _time_to_seconds(time_str: str) -> float:
    """HH:MM:SS → 초"""
    parts = time_str.split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return float(parts[0])
