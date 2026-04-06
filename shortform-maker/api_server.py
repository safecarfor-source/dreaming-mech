"""숏폼 메이커 v1.0 — FastAPI 서버
영상 업로드 → 비동기 파이프라인 실행 → 결과 다운로드
"""

import os
import shutil
import tempfile
import threading
import uuid
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="숏폼 메이커 API", version="1.0.0")

# ─── 잡 상태 저장 (인메모리) ──────────────────────────────────────
# { jobId: { status, progress, results, error, output_dir } }
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()

YT_PASSWORD = os.getenv("YT_PASSWORD", "")


def _check_auth(x_yt_token: Optional[str]) -> None:
    """YT 비밀번호 검증"""
    if YT_PASSWORD and x_yt_token != YT_PASSWORD:
        raise HTTPException(status_code=401, detail="인증 실패")


def _run_pipeline_task(job_id: str, video_path: str, output_dir: str):
    """백그라운드에서 파이프라인 실행"""
    from pipeline import run_pipeline

    def _progress(step, total, msg):
        status_map = {
            1: "UPLOADING",
            2: "TRANSCRIBING",
            3: "TRANSCRIBING",
            4: "ANALYZING",
            5: "ANALYZING",
            6: "PROCESSING",
            7: "PROCESSING",
        }
        with _jobs_lock:
            _jobs[job_id]["status"] = status_map.get(step, "PROCESSING")
            _jobs[job_id]["progress"] = msg

    try:
        results = run_pipeline(
            source=video_path,
            output_dir=output_dir,
            progress_callback=_progress,
        )
        # 결과 변환 (프론트엔드 인터페이스에 맞춤)
        formatted = []
        for r in results:
            formatted.append({
                "index": r.get("index", 0),
                "hookTitle": r.get("hook_title", ""),
                "subTitle": r.get("subtitle", ""),
                "downloadUrl": f"/shortform/download/{job_id}/{r.get('index', 0)}",
            })
        with _jobs_lock:
            _jobs[job_id]["status"] = "COMPLETED"
            _jobs[job_id]["progress"] = f"완료! {len(results)}개 숏폼 생성됨"
            _jobs[job_id]["results"] = formatted
    except Exception as e:
        with _jobs_lock:
            _jobs[job_id]["status"] = "FAILED"
            _jobs[job_id]["progress"] = "처리 실패"
            _jobs[job_id]["error"] = str(e)
    finally:
        # 원본 업로드 파일 삭제 (output_dir 내 클립은 유지)
        if os.path.exists(video_path) and video_path != output_dir:
            try:
                os.remove(video_path)
            except Exception:
                pass


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/shortform/process")
async def process_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    x_yt_token: Optional[str] = Header(None),
):
    """영상 업로드 → 비동기 파이프라인 시작 → jobId 반환"""
    _check_auth(x_yt_token)

    # 저장 경로 설정
    job_id = str(uuid.uuid4())
    output_dir = f"/app/output/{job_id}"
    os.makedirs(output_dir, exist_ok=True)

    # 업로드 파일 저장
    ext = Path(video.filename or "video.mp4").suffix or ".mp4"
    video_path = os.path.join(output_dir, f"source{ext}")
    with open(video_path, "wb") as f:
        shutil.copyfileobj(video.file, f)

    # 잡 초기화
    with _jobs_lock:
        _jobs[job_id] = {
            "status": "UPLOADING",
            "progress": "영상 업로드 완료, 분석 시작 중...",
            "results": None,
            "error": None,
            "output_dir": output_dir,
        }

    # 백그라운드 스레드에서 파이프라인 실행
    thread = threading.Thread(
        target=_run_pipeline_task,
        args=(job_id, video_path, output_dir),
        daemon=True,
    )
    thread.start()

    return JSONResponse({"data": {"jobId": job_id}})


@app.get("/shortform/job/{job_id}")
async def get_job_status(
    job_id: str,
    x_yt_token: Optional[str] = Header(None),
):
    """잡 상태 조회"""
    _check_auth(x_yt_token)

    with _jobs_lock:
        job = _jobs.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="잡을 찾을 수 없습니다")

    return JSONResponse({
        "data": {
            "status": job["status"],
            "progress": job["progress"],
            "results": job.get("results"),
            "error": job.get("error"),
        }
    })


@app.get("/shortform/download/{job_id}/{index}")
async def download_clip(
    job_id: str,
    index: int,
    x_yt_token: Optional[str] = Header(None),
    token: Optional[str] = None,
):
    """렌더링된 숏폼 클립 다운로드"""
    # 쿼리파라미터 token도 허용 (다운로드 링크용)
    auth_token = x_yt_token or token
    _check_auth(auth_token)

    with _jobs_lock:
        job = _jobs.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="잡을 찾을 수 없습니다")
    if job["status"] != "COMPLETED":
        raise HTTPException(status_code=400, detail="아직 처리 중입니다")

    clip_path = os.path.join(job["output_dir"], f"clip_{index:02d}.mp4")
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="클립 파일을 찾을 수 없습니다")

    return FileResponse(
        clip_path,
        media_type="video/mp4",
        filename=f"shortform_clip_{index:02d}.mp4",
    )
