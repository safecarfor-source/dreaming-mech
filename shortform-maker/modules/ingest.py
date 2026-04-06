"""영상 확보 + 오디오 추출 + Whisper 자막 생성"""

import os
import subprocess

import openai


def download_youtube(url: str, output_dir: str) -> str:
    """YouTube 영상 다운로드 (yt-dlp)"""
    output_path = os.path.join(output_dir, "source.mp4")
    subprocess.run(
        [
            "yt-dlp",
            "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
            "--merge-output-format", "mp4",
            "-o", output_path,
            url,
        ],
        check=True,
    )
    return output_path


def extract_audio(video_path: str, output_dir: str) -> str:
    """영상에서 오디오 추출 (FFmpeg)"""
    audio_path = os.path.join(output_dir, "audio.mp3")
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn", "-acodec", "libmp3lame", "-q:a", "4",
            audio_path,
        ],
        check=True,
        capture_output=True,
    )
    return audio_path


def transcribe_audio(audio_path: str, language: str = "ko") -> dict:
    """Whisper API로 음성 → 자막 + 타임스탬프 변환"""
    client = openai.OpenAI()

    with open(audio_path, "rb") as f:
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            language=language,
            response_format="verbose_json",
            timestamp_granularities=["segment", "word"],
        )

    return result.model_dump()


def get_video_info(video_path: str) -> dict:
    """영상 해상도/길이 정보 조회"""
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,duration",
            "-show_entries", "format=duration",
            "-of", "json",
            video_path,
        ],
        capture_output=True, text=True,
    )
    import json
    info = json.loads(probe.stdout)
    stream = info.get("streams", [{}])[0]
    fmt = info.get("format", {})
    return {
        "width": stream.get("width", 1920),
        "height": stream.get("height", 1080),
        "duration": float(fmt.get("duration", stream.get("duration", 0))),
    }
