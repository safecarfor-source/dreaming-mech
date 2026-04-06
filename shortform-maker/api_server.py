"""숏폼 메이커 v1.1 — FastAPI 서버
영상 업로드 → 비동기 파이프라인 실행 → 결과 다운로드
v1.1: job 상태 디스크 영속화 (서버 재시작 후에도 다운로드 가능)
"""

import json
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

app = FastAPI(title="숏폼 메이커 API", version="1.1.0")

OUTPUT_BASE = "/app/output"

# ─── 잡 상태 저장 (인메모리 + 디스크 백업) ─────────────────────────
# { jobId: { status, progress, results, error, output_dir } }
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()


def _save_job_to_disk(job_id: str, job: dict) -> None:
    """job 상태를 디스크에 저장 (서버 재시작 후 복원용)"""
    try:
        job_dir = job.get("output_dir", os.path.join(OUTPUT_BASE, job_id))
        os.makedirs(job_dir, exist_ok=True)
        job_file = os.path.join(job_dir, "job.json")
        with open(job_file, "w", encoding="utf-8") as f:
            json.dump({"job_id": job_id, **job}, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def _load_job_from_disk(job_id: str) -> dict | None:
    """디스크에서 job 상태 복원"""
    job_file = os.path.join(OUTPUT_BASE, job_id, "job.json")
    if not os.path.exists(job_file):
        return None
    try:
        with open(job_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        data.pop("job_id", None)
        return data
    except Exception:
        return None


def _restore_jobs_from_disk() -> None:
    """서버 시작 시 디스크에서 완료된 잡 복원"""
    if not os.path.exists(OUTPUT_BASE):
        return
    for name in os.listdir(OUTPUT_BASE):
        job_dir = os.path.join(OUTPUT_BASE, name)
        if not os.path.isdir(job_dir):
            continue
        job = _load_job_from_disk(name)
        if job and job.get("status") == "COMPLETED":
            with _jobs_lock:
                if name not in _jobs:
                    _jobs[name] = job


# 서버 시작 시 기존 잡 복원
_restore_jobs_from_disk()

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
            entry = {
                "index": r.get("index", 0),
                "hookTitle": r.get("hook_title", ""),
                "subTitle": r.get("subtitle", ""),
            }
            # 렌더 실패한 클립은 다운로드 URL 제외
            if r.get("error"):
                entry["error"] = r["error"]
            else:
                entry["downloadUrl"] = f"/shortform/download/{job_id}/{r.get('index', 0)}"
            formatted.append(entry)
        success_count = sum(1 for r in results if not r.get("error"))
        with _jobs_lock:
            _jobs[job_id]["status"] = "COMPLETED"
            _jobs[job_id]["progress"] = f"완료! {success_count}/{len(results)}개 숏폼 생성됨"
            _jobs[job_id]["results"] = formatted
            _save_job_to_disk(job_id, _jobs[job_id])
    except Exception as e:
        with _jobs_lock:
            _jobs[job_id]["status"] = "FAILED"
            _jobs[job_id]["progress"] = "처리 실패"
            _jobs[job_id]["error"] = str(e)
            _save_job_to_disk(job_id, _jobs[job_id])
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

    # 인메모리에 없으면 디스크에서 복원
    if not job:
        job = _load_job_from_disk(job_id)
        if job:
            with _jobs_lock:
                _jobs[job_id] = job

    if not job:
        raise HTTPException(status_code=404, detail="잡을 찾을 수 없습니다")

    return JSONResponse({
        "data": {
            "jobId": job_id,
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

    # 인메모리 → 디스크 fallback (서버 재시작 후에도 다운로드 가능)
    with _jobs_lock:
        job = _jobs.get(job_id)

    if not job:
        job = _load_job_from_disk(job_id)
        if job:
            with _jobs_lock:
                _jobs[job_id] = job

    # 파일 경로: 인메모리 job 없어도 디스크에서 직접 찾기
    output_dir = job["output_dir"] if job else os.path.join(OUTPUT_BASE, job_id)

    if job and job.get("status") not in ("COMPLETED", None):
        if job["status"] != "COMPLETED":
            raise HTTPException(status_code=400, detail="아직 처리 중입니다")

    clip_path = os.path.join(output_dir, f"clip_{index:02d}.mp4")
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="클립 파일을 찾을 수 없습니다")

    return FileResponse(
        clip_path,
        media_type="video/mp4",
        filename=f"shortform_clip_{index:02d}.mp4",
    )


@app.get("/shortform/jobs")
async def list_jobs(
    x_yt_token: Optional[str] = Header(None),
):
    """완료된 잡 목록 조회 (프론트엔드 복원용)"""
    _check_auth(x_yt_token)

    result = []
    with _jobs_lock:
        for jid, job in _jobs.items():
            if job.get("status") == "COMPLETED" and job.get("results"):
                result.append({
                    "jobId": jid,
                    "status": job["status"],
                    "progress": job.get("progress", ""),
                    "results": job["results"],
                })
    return JSONResponse({"data": result})
