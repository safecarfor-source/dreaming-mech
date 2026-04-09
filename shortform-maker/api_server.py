"""숏폼 메이커 v2.0 — FastAPI 서버
영상 업로드 → 비동기 파이프라인 실행 → 결과 다운로드
v2.0: 블랙바 레이아웃 + 번인 자막 + LUFS + 썸네일
"""

import json
import os
import shutil
import tempfile
import threading
import uuid
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, Body, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="숏폼 메이커 API", version="2.0.0")

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
    """서버 시작 시 디스크에서 잡 복원 (COMPLETED + PREVIEW_READY)"""
    if not os.path.exists(OUTPUT_BASE):
        return
    restorable = {"COMPLETED", "PREVIEW_READY"}
    for name in os.listdir(OUTPUT_BASE):
        job_dir = os.path.join(OUTPUT_BASE, name)
        if not os.path.isdir(job_dir):
            continue
        job = _load_job_from_disk(name)
        if job and job.get("status") in restorable:
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
    """백그라운드에서 분석 파이프라인 실행 → PREVIEW_READY로 전환"""
    from pipeline import run_analysis_pipeline, _clip_to_preview_dict

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
        composed_clips, resolved_video_path, all_words = run_analysis_pipeline(
            source=video_path,
            output_dir=output_dir,
            progress_callback=_progress,
        )

        # preview 데이터 구성 (프론트엔드 프리뷰용)
        preview = [_clip_to_preview_dict(clip, i + 1) for i, clip in enumerate(composed_clips)]

        with _jobs_lock:
            _jobs[job_id]["status"] = "PREVIEW_READY"
            _jobs[job_id]["progress"] = f"분석 완료! {len(composed_clips)}개 클립 프리뷰 준비됨"
            _jobs[job_id]["preview"] = preview
            # 렌더링 단계에서 필요한 데이터 보존
            _jobs[job_id]["video_path"] = resolved_video_path
            _save_job_to_disk(job_id, _jobs[job_id])
    except Exception as e:
        import traceback
        traceback.print_exc()
        with _jobs_lock:
            _jobs[job_id]["status"] = "FAILED"
            _jobs[job_id]["progress"] = "분석 실패"
            _jobs[job_id]["error"] = str(e)
            _save_job_to_disk(job_id, _jobs[job_id])


def _run_render_task(job_id: str, selected_indices: list[int] | None):
    """백그라운드에서 렌더링 파이프라인 실행 → COMPLETED로 전환"""
    import json as _json
    from pipeline import _preview_dict_to_clip, run_render_pipeline

    with _jobs_lock:
        job = _jobs.get(job_id, {})
    output_dir = job.get("output_dir", "")
    video_path = job.get("video_path", "")

    def _progress(step, total, msg):  # noqa: ARG001
        with _jobs_lock:
            _jobs[job_id]["status"] = "PROCESSING"
            _jobs[job_id]["progress"] = msg

    try:
        # preview.json에서 ComposedClip 복원
        preview_path = os.path.join(output_dir, "preview.json")
        with open(preview_path, "r", encoding="utf-8") as f:
            preview_data = _json.load(f)

        # transcript.json에서 all_words 로드 (ASS 자막 생성용)
        all_words = []
        transcript_path = os.path.join(output_dir, "transcript.json")
        if os.path.exists(transcript_path):
            with open(transcript_path, "r", encoding="utf-8") as f:
                transcript = _json.load(f)
            all_words = transcript.get("words", [])

        composed_clips = [_preview_dict_to_clip(d, all_words) for d in preview_data]

        results = run_render_pipeline(
            video_path=video_path,
            composed_clips=composed_clips,
            output_dir=output_dir,
            all_words=all_words,
            progress_callback=_progress,
            selected_indices=selected_indices,
        )

        # 결과 변환 (프론트엔드 인터페이스에 맞춤)
        formatted = []
        for r in results:
            entry = {
                "index": r.get("index", 0),
                "hookTitle": r.get("hook_title", ""),
                "subTitle": r.get("subtitle", ""),
            }
            if r.get("error"):
                entry["error"] = r["error"]
            else:
                entry["downloadUrl"] = f"/shortform/download/{job_id}/{r.get('index', 0)}"
            if r.get("thumbnail_filename"):
                entry["thumbnailUrl"] = f"/shortform/thumbnail/{job_id}/{r.get('index', 0)}"
            formatted.append(entry)

        success_count = sum(1 for r in results if not r.get("error"))
        with _jobs_lock:
            _jobs[job_id]["status"] = "COMPLETED"
            _jobs[job_id]["progress"] = f"완료! {success_count}/{len(results)}개 숏폼 생성됨"
            _jobs[job_id]["results"] = formatted
            _save_job_to_disk(job_id, _jobs[job_id])
    except Exception as e:
        import traceback
        traceback.print_exc()
        with _jobs_lock:
            _jobs[job_id]["status"] = "FAILED"
            _jobs[job_id]["progress"] = "렌더링 실패"
            _jobs[job_id]["error"] = str(e)
            _save_job_to_disk(job_id, _jobs[job_id])


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

    response_data: dict = {
        "jobId": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "results": job.get("results"),
        "error": job.get("error"),
    }
    # PREVIEW_READY 상태일 때 preview 클립 목록 포함
    if job["status"] == "PREVIEW_READY":
        response_data["preview"] = job.get("preview")

    return JSONResponse({"data": response_data})


@app.post("/shortform/approve/{job_id}")
async def approve_job(
    job_id: str,
    x_yt_token: Optional[str] = Header(None),
    body: Optional[dict] = Body(default=None),
):
    """프리뷰 승인 → 선택한 클립만 렌더링 시작

    Body (선택):
        { "selectedIndices": [1, 2, 3] }  — 없으면 전체 렌더링
    """
    _check_auth(x_yt_token)

    with _jobs_lock:
        job = _jobs.get(job_id)

    if not job:
        job = _load_job_from_disk(job_id)
        if job:
            with _jobs_lock:
                _jobs[job_id] = job

    if not job:
        raise HTTPException(status_code=404, detail="잡을 찾을 수 없습니다")

    if job.get("status") != "PREVIEW_READY":
        raise HTTPException(
            status_code=400,
            detail=f"PREVIEW_READY 상태인 잡만 승인할 수 있습니다 (현재: {job.get('status')})",
        )

    # selected_indices 파싱 (1-base, None이면 전부 렌더링)
    selected_indices: list[int] | None = None
    if body and "selectedIndices" in body:
        raw = body["selectedIndices"]
        if isinstance(raw, list) and raw:
            selected_indices = [int(i) for i in raw]

    # 상태를 PROCESSING으로 변경 후 렌더링 스레드 시작
    with _jobs_lock:
        _jobs[job_id]["status"] = "PROCESSING"
        _jobs[job_id]["progress"] = "렌더링 시작 중..."

    thread = threading.Thread(
        target=_run_render_task,
        args=(job_id, selected_indices),
        daemon=True,
    )
    thread.start()

    return JSONResponse({
        "data": {
            "jobId": job_id,
            "status": "PROCESSING",
            "selectedIndices": selected_indices,
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
        # fallback: overlay 실패 시 concat 파일 제공 (구버전 호환)
        clip_path = os.path.join(output_dir, f"clip_{index:02d}_concat.mp4")
    if not os.path.exists(clip_path):
        raise HTTPException(status_code=404, detail="클립 파일을 찾을 수 없습니다")

    return FileResponse(
        clip_path,
        media_type="video/mp4",
        filename=f"shortform_clip_{index:02d}.mp4",
    )


@app.get("/shortform/thumbnail/{job_id}/{index}")
async def download_thumbnail(
    job_id: str,
    index: int,
    x_yt_token: Optional[str] = Header(None),
    token: Optional[str] = None,
):
    """썸네일 이미지 다운로드"""
    auth_token = x_yt_token or token
    _check_auth(auth_token)

    output_dir = os.path.join(OUTPUT_BASE, job_id)
    thumb_path = os.path.join(output_dir, f"thumb_{index:02d}.jpg")

    if not os.path.exists(thumb_path):
        raise HTTPException(status_code=404, detail="썸네일 파일을 찾을 수 없습니다")

    return FileResponse(
        thumb_path,
        media_type="image/jpeg",
        filename=f"shortform_thumb_{index:02d}.jpg",
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


@app.get("/shortform/storage")
async def list_storage(x_yt_token: Optional[str] = Header(None)):
    """output 디렉토리 파일 리스트 (날짜, 용량 포함)"""
    _check_auth(x_yt_token)

    from datetime import datetime

    jobs = []
    output_base = Path(OUTPUT_BASE)
    if not output_base.exists():
        return JSONResponse({"data": [], "totalSize": "0 MB"})

    total_bytes = 0
    for job_dir in sorted(output_base.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not job_dir.is_dir():
            continue
        files = []
        dir_size = 0
        for f in sorted(job_dir.iterdir()):
            if f.is_file():
                sz = f.stat().st_size
                dir_size += sz
                files.append({
                    "name": f.name,
                    "size": f"{sz / 1024 / 1024:.1f} MB",
                })
        total_bytes += dir_size
        mtime = datetime.fromtimestamp(job_dir.stat().st_mtime)
        # job.json에서 progress 읽기
        job_json = job_dir / "job.json"
        label = ""
        if job_json.exists():
            try:
                with open(job_json) as jf:
                    label = json.load(jf).get("progress", "")
            except Exception:
                pass
        jobs.append({
            "jobId": job_dir.name,
            "date": mtime.strftime("%Y-%m-%d %H:%M"),
            "size": f"{dir_size / 1024 / 1024:.1f} MB",
            "files": files,
            "label": label,
        })

    return JSONResponse({
        "data": jobs,
        "totalSize": f"{total_bytes / 1024 / 1024:.1f} MB",
    })


@app.delete("/shortform/storage/{job_id}")
async def delete_storage(job_id: str, x_yt_token: Optional[str] = Header(None)):
    """특정 job 폴더 삭제"""
    _check_auth(x_yt_token)

    target = Path(OUTPUT_BASE) / job_id
    if not target.exists() or not target.is_dir():
        raise HTTPException(status_code=404, detail="폴더를 찾을 수 없습니다")

    # 안전: OUTPUT_BASE 하위인지 확인
    if not str(target.resolve()).startswith(str(Path(OUTPUT_BASE).resolve())):
        raise HTTPException(status_code=403, detail="접근 금지")

    shutil.rmtree(target)
    # 인메모리에서도 제거
    with _jobs_lock:
        _jobs.pop(job_id, None)

    return JSONResponse({"message": f"{job_id} 삭제 완료"})
