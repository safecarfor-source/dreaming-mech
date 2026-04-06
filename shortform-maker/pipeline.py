"""숏폼 자동변환 파이프라인 v2.0 — 블랙바 + 번인 자막 + LUFS"""

import json
import os

from modules.analyzer import analyze_two_stage
from modules.caption_builder import build_ass_subtitles
from modules.composer import ComposedClip, build_clips
from modules.ingest import download_youtube, extract_audio, get_video_info, transcribe_audio
from modules.renderer import render_clip
from modules.subtitle_parser import parse_subtitle_file, parse_subtitle_text
from modules.thumbnail import generate_thumbnail


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

    # 5. 클립 조립 (검증 + 정렬 + 워드 필터링)
    composed_clips = build_clips(analysis_clips, all_words=all_words)

    # 6. FFmpeg 렌더링 (블랙바 + 번인 자막)
    results = []
    for i, clip in enumerate(composed_clips):
        _progress(6, f"클립 {i + 1}/{len(composed_clips)} 렌더링 중: {clip.hook_title}")
        clip_path = os.path.join(output_dir, f"clip_{i + 1:02d}.mp4")

        # ASS 자막 생성 (워드 데이터 있을 때)
        ass_path = None
        if clip.words:
            ass_path = build_ass_subtitles(
                words=clip.words,
                clip_start_sec=clip.segments[0].start_sec,
                clip_end_sec=clip.segments[-1].end_sec,
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
