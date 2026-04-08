"""숏폼 자동변환 파이프라인 v2.0 — 블랙바 + 번인 자막 + LUFS"""

import json
import logging
import os

from config import MAX_CLIP_DURATION
from modules.analyzer import analyze_two_stage, recut_oversized_segment
from modules.caption_builder import build_ass_subtitles
from modules.composer import ComposedClip, build_clips
from modules.ingest import download_youtube, extract_audio, get_video_info, transcribe_audio
from modules.renderer import render_clip
from modules.subtitle_parser import parse_subtitle_file, parse_subtitle_text
from modules.thumbnail import generate_thumbnail

logger = logging.getLogger(__name__)


def run_pipeline(
    source: str,
    output_dir: str,
    subtitle_source: str | None = None,
    subtitle_text: str | None = None,
    script: str | None = None,
    progress_callback=None,
) -> list[dict]:
    """전체 파이프라인 실행

    Args:
        source: YouTube URL 또는 로컬 영상 파일 경로
        output_dir: 출력 디렉토리
        subtitle_source: SRT/VTT 파일 경로 (있으면 Whisper 스킵)
        subtitle_text: SRT/VTT 텍스트 내용 (파일 대신 직접 입력)
        script: 대본 텍스트 (선택)
        progress_callback: (step, total_steps, message) 콜백

    Returns:
        생성된 클립 정보 리스트
    """
    os.makedirs(output_dir, exist_ok=True)
    total_steps = 7

    def _progress(step, msg):
        if progress_callback:
            progress_callback(step, total_steps, msg)

    # 1. 영상 확보
    if source.startswith("http"):
        _progress(1, "YouTube 영상 다운로드 중...")
        video_path = download_youtube(source, output_dir)
    else:
        video_path = source
        _progress(1, "영상 파일 확인 완료")

    # 2. 자막 확보 (SRT 있으면 Whisper 스킵)
    segments = None
    all_words = []  # v2.0: 워드 레벨 타임스탬프

    if subtitle_text:
        _progress(2, "SRT 자막 파싱 중... (Whisper 스킵)")
        segments = parse_subtitle_text(subtitle_text)
    elif subtitle_source:
        _progress(2, "SRT 파일 파싱 중... (Whisper 스킵)")
        segments = parse_subtitle_file(subtitle_source)

    if not segments:
        # Whisper로 자막 생성 (워드 레벨 포함)
        _progress(2, "오디오 추출 중...")
        audio_path = extract_audio(video_path, output_dir)
        _progress(3, "AI 자막 생성 중... (Whisper 워드 레벨)")
        transcript = transcribe_audio(audio_path)
        segments = transcript.get("segments", [])
        all_words = transcript.get("words", [])

        # 자막 저장
        transcript_path = os.path.join(output_dir, "transcript.json")
        with open(transcript_path, "w", encoding="utf-8") as f:
            json.dump(transcript, f, ensure_ascii=False, indent=2)
    else:
        _progress(3, "자막 준비 완료 (SRT 사용)")

    # 4. Claude 2단계 분석 (하이라이트 + 문구 + Virality Score)
    _progress(4, "AI 하이라이트 분석 중... (Claude 1단계)")
    _progress(5, "AI 문구 생성 + Virality Score 계산 중... (Claude 2단계)")
    analysis_clips = analyze_two_stage(segments, script)

    # 분석 결과 저장
    analysis_path = os.path.join(output_dir, "analysis.json")
    with open(analysis_path, "w", encoding="utf-8") as f:
        json.dump(analysis_clips, f, ensure_ascii=False, indent=2)

    # 5. 클립 조립 (유효 클립 + 초과 클립 분리)
    composed_clips, oversized_raw = build_clips(analysis_clips, all_words=all_words)

    # 5.5 하네스: 초과 클립 → AI 재설계 (자막 기반 맥락 보존 리컷)
    if oversized_raw:
        _progress(5, f"초과 구간 {len(oversized_raw)}개 → AI 재설계 중...")
        for raw_clip in oversized_raw:
            # 합성 구간은 start/end가 없고 segments 배열에 시간이 있음
            # → 전체 범위를 start/end로 계산해서 recut에 넘김
            if raw_clip.get("is_composition") and raw_clip.get("segments"):
                all_starts = [s.get("start", "99:99:99") for s in raw_clip["segments"]]
                all_ends = [s.get("end", "00:00:00") for s in raw_clip["segments"]]
                raw_clip["start"] = min(all_starts)
                raw_clip["end"] = max(all_ends)

            recut_results = recut_oversized_segment(raw_clip, segments)
            if recut_results:
                # 재설계된 구간으로 새 클립 생성
                for recut in recut_results:
                    recut_clip_data = {
                        **raw_clip,
                        "start": recut["start"],
                        "end": recut["end"],
                        "summary": recut.get("summary", raw_clip.get("summary", "")),
                        "keywords": recut.get("keywords", raw_clip.get("keywords", [])),
                    }
                    # 합성이었으면 단일 구간으로 변환
                    recut_clip_data.pop("is_composition", None)
                    recut_clip_data.pop("segments", None)
                    recut_clip_data.pop("composition_ids", None)

                    recut_valid, _ = build_clips([recut_clip_data], all_words=all_words)
                    composed_clips.extend(recut_valid)
            else:
                logger.warning(
                    f"[RECUT] 재설계 실패: '{raw_clip.get('hook_title', '')}' → "
                    f"이 구간은 최종 결과에서 제외"
                )

        # 재설계 후 다시 정렬
        composed_clips.sort(key=lambda c: c.virality_score, reverse=True)

    # 5.5 하네스: 렌더 전 최종 검증 (구조적 안전장치)
    safe_clips = []
    for clip in composed_clips:
        dur = clip.total_duration
        if dur > MAX_CLIP_DURATION:
            logger.error(
                f"[PIPELINE GUARD] 클립 '{clip.hook_title}' {dur:.1f}초 > "
                f"MAX {MAX_CLIP_DURATION}초 → 렌더링 제외 (composer 통과했으나 파이프라인에서 차단)"
            )
            continue
        safe_clips.append(clip)

    if len(safe_clips) < len(composed_clips):
        logger.warning(
            f"[PIPELINE GUARD] {len(composed_clips) - len(safe_clips)}개 클립이 "
            f"길이 초과로 제외됨"
        )
    composed_clips = safe_clips

    # 6. FFmpeg 렌더링 (블랙바 + 번인 자막)
    results = []
    for i, clip in enumerate(composed_clips):
        _progress(6, f"클립 {i + 1}/{len(composed_clips)} 렌더링 중: {clip.hook_title}")
        clip_path = os.path.join(output_dir, f"clip_{i + 1:02d}.mp4")

        # ASS 동적 자막 생성 (Whisper word-level + 키워드 강조)
        ass_path = None
        if clip.words:
            highlight_kw = clip.highlight_keywords if clip.highlight_keywords else []
            if not highlight_kw:
                # keywords가 없으면 hook_title에서 핵심 단어 추출
                highlight_kw = [w for w in clip.hook_title.split() if len(w) >= 2]
            ass_path = build_ass_subtitles(
                clip.words,
                clip.segments[0].start_sec,
                clip.segments[-1].end_sec,
                highlight_keywords=highlight_kw,
            )

        try:
            render_clip(video_path, clip, clip_path, ass_path=ass_path)

            # 썸네일 생성
            thumb_path = os.path.join(output_dir, f"thumb_{i + 1:02d}.jpg")
            thumb_result = generate_thumbnail(
                video_path=video_path,
                hook_title=clip.hook_title,
                output_path=thumb_path,
                start_sec=clip.segments[0].start_sec,
                end_sec=clip.segments[-1].end_sec,
            )

            result_dict = _clip_to_dict(clip, clip_path, i + 1)
            if thumb_result:
                result_dict["thumbnail"] = thumb_path
                result_dict["thumbnail_filename"] = f"thumb_{i + 1:02d}.jpg"
            results.append(result_dict)
        except Exception as e:
            results.append({
                **_clip_to_dict(clip, "", i + 1),
                "error": str(e),
            })
        finally:
            # ASS 임시 파일 정리
            if ass_path and os.path.exists(ass_path):
                os.remove(ass_path)

    # 7. 결과 저장
    results_path = os.path.join(output_dir, "results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    _progress(7, f"완료! {len(results)}개 숏폼 클립 생성됨")
    return results


def _clip_to_dict(clip: ComposedClip, file_path: str, index: int) -> dict:
    """ComposedClip → 딕셔너리 변환"""
    return {
        "index": index,
        "hook_title": clip.hook_title,
        "subtitle": clip.subtitle,
        "aux_text": clip.aux_text,
        "virality_score": clip.virality_score,
        "score_breakdown": clip.score_breakdown,
        "primary_desire": clip.primary_desire,
        "reason": clip.reason,
        "is_composition": clip.is_composition,
        "time_display": clip.display_time,
        "duration": round(clip.total_duration, 1),
        "file": file_path,
        "filename": f"clip_{index:02d}.mp4",
    }
