#!/usr/bin/env python3
"""극동 마감 동기화 — GUI 클라이언트 (v1)
더블클릭으로 실행. TOTAL.GDB 업로드 후 서버 동기화 API 호출.
"""
import os
import sys
import json
import hashlib
import threading
import tkinter as tk
from tkinter import ttk
from datetime import datetime

# ========== 기본 CONFIG (config.json 없을 때 폴백) ==========
DEFAULT_CONFIG = {
    "server_ip": "13.209.143.155",
    "server_user": "ubuntu",
    "pem_path": r"C:\gd-sync\dreaming-mech-key.pem",
    "gdb_path": r"C:\Program Files\PsimCarS\Data\DM\TOTAL.GDB",
    "remote_dir": "/home/ubuntu/gd-sync/incoming",
    "api_url": "https://dreammechaniclab.com/api/incentive/gd/trigger-sync",
    "sync_token": "gd-close-sync-2026"
}
CONFIG_PATH = r"C:\gd-sync\config.json"
LOG_FILE = r"C:\gd-sync\close_sync.log"
AUTO_CLOSE_SECONDS = 10

# =====================================================================


def log(msg):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{ts}] {msg}"
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
        # 로그 파일 크기 제한 (500KB 초과 시 최근 200줄만 유지)
        if os.path.getsize(LOG_FILE) > 500_000:
            with open(LOG_FILE, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            with open(LOG_FILE, 'w', encoding='utf-8') as f:
                f.writelines(lines[-200:])
    except Exception:
        pass


def load_config():
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            cfg = json.load(f)
        # 누락된 키는 기본값으로 채움
        for k, v in DEFAULT_CONFIG.items():
            cfg.setdefault(k, v)
        return cfg
    except FileNotFoundError:
        log(f"config.json not found at {CONFIG_PATH}. Using defaults.")
        return dict(DEFAULT_CONFIG)
    except json.JSONDecodeError as e:
        log(f"config.json parse error: {e}. Using defaults.")
        return dict(DEFAULT_CONFIG)


def calc_md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def upload_sftp(cfg, progress_cb):
    """Paramiko SFTP 업로드. progress_cb(transferred_bytes, total_bytes) 콜백."""
    import paramiko

    pem_path = cfg['pem_path']
    gdb_path = cfg['gdb_path']
    server_ip = cfg['server_ip']
    server_user = cfg['server_user']
    remote_dir = cfg['remote_dir']
    remote_path = f"{remote_dir}/TOTAL.GDB"

    key = paramiko.RSAKey.from_private_key_file(pem_path)
    transport = paramiko.Transport((server_ip, 22))
    transport.connect(username=server_user, pkey=key)
    sftp = paramiko.SFTPClient.from_transport(transport)

    total_size = os.path.getsize(gdb_path)

    sftp.put(gdb_path, remote_path, callback=progress_cb)

    sftp.close()
    transport.close()
    return total_size


def call_sync_api(cfg, timeout=300):
    """서버 동기화 API 호출. 응답 dict 반환."""
    import requests

    headers = {
        'X-Sync-Token': cfg['sync_token'],
        'Content-Type': 'application/json'
    }
    response = requests.post(
        cfg['api_url'],
        headers=headers,
        json={},
        timeout=timeout
    )
    response.raise_for_status()
    try:
        return response.json()
    except Exception:
        return {'status': 'ok', 'raw': response.text}


# =====================================================================
# GUI 클래스
# =====================================================================

class SyncApp:
    def __init__(self, root):
        self.root = root
        self.root.title("극동 마감 동기화")
        self.root.geometry("400x300")
        self.root.resizable(False, False)
        self.root.configure(bg='white')
        self.root.attributes('-topmost', True)  # 항상 위에 표시

        # 화면 중앙 배치
        self._center_window()

        # 닫기 버튼 동작
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

        # 상태 변수
        self._status_msg = tk.StringVar(value="준비 중...")
        self._sub_msg = tk.StringVar(value="")
        self._progress_var = tk.DoubleVar(value=0)
        self._auto_close_remaining = AUTO_CLOSE_SECONDS
        self._auto_close_job = None
        self._done = False
        self._success = False

        self._build_ui()

        # 작업 스레드 시작
        self._worker_thread = threading.Thread(target=self._run_sync, daemon=True)
        self._worker_thread.start()

    def _center_window(self):
        self.root.update_idletasks()
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        x = (sw - 400) // 2
        y = (sh - 300) // 2
        self.root.geometry(f"400x300+{x}+{y}")

    def _build_ui(self):
        # 제목 라벨
        title_lbl = tk.Label(
            self.root,
            text="극동 마감 동기화",
            font=("맑은 고딕", 16, "bold"),
            bg='white',
            fg='#333333'
        )
        title_lbl.pack(pady=(24, 4))

        # 구분선
        sep = ttk.Separator(self.root, orient='horizontal')
        sep.pack(fill='x', padx=20, pady=(0, 16))

        # 결과 아이콘/텍스트 영역 (큰 상태 표시)
        self._result_frame = tk.Frame(self.root, bg='white')
        self._result_frame.pack(fill='x', padx=20)

        self._result_lbl = tk.Label(
            self._result_frame,
            text="",
            font=("맑은 고딕", 26, "bold"),
            bg='white',
            fg='#333333'
        )
        self._result_lbl.pack()

        # 상태 메시지
        status_lbl = tk.Label(
            self.root,
            textvariable=self._status_msg,
            font=("맑은 고딕", 13),
            bg='white',
            fg='#555555',
            wraplength=360
        )
        status_lbl.pack(pady=(8, 4))

        # 부가 메시지 (작은 글씨)
        sub_lbl = tk.Label(
            self.root,
            textvariable=self._sub_msg,
            font=("맑은 고딕", 10),
            bg='white',
            fg='#888888',
            wraplength=360
        )
        sub_lbl.pack(pady=(0, 10))

        # 프로그레스 바
        self._progress = ttk.Progressbar(
            self.root,
            mode='indeterminate',
            length=360
        )
        self._progress.pack(padx=20, pady=(0, 8))
        self._progress.start(12)

        # 자동 종료 카운트다운 라벨 (완료/실패 후 표시)
        self._countdown_lbl = tk.Label(
            self.root,
            text="",
            font=("맑은 고딕", 9),
            bg='white',
            fg='#AAAAAA'
        )
        self._countdown_lbl.pack(pady=(2, 0))

    # ------------------------------------------------------------------
    # 스레드 안전 UI 업데이트 헬퍼
    # ------------------------------------------------------------------

    def _set_status(self, msg, sub=""):
        self.root.after(0, lambda: self._status_msg.set(msg))
        self.root.after(0, lambda: self._sub_msg.set(sub))

    def _show_success(self):
        def _do():
            self._progress.stop()
            self._progress.configure(mode='determinate')
            self._progress['value'] = 100
            self._result_lbl.configure(text="✅", fg='#22C55E')
            self._status_msg.set("✅ 동기화 완료!")
            self._sub_msg.set("마감 데이터가 성공적으로 서버에 반영되었습니다.")
            self._start_auto_close()
        self.root.after(0, _do)

    def _show_failure(self, message):
        def _do():
            self._progress.stop()
            self._progress.configure(mode='determinate')
            self._progress['value'] = 0
            self._result_lbl.configure(text="❌", fg='#EF4444')
            self._status_msg.set("❌ 동기화 실패")
            self._sub_msg.set(message)
            self._start_auto_close()
        self.root.after(0, _do)

    def _show_upload_ok_sync_fail(self):
        def _do():
            self._progress.stop()
            self._progress.configure(mode='determinate')
            self._progress['value'] = 60
            self._result_lbl.configure(text="⚠️", fg='#F59E0B')
            self._status_msg.set("⚠️ 업로드 성공, 동기화 요청 실패")
            self._sub_msg.set("파일은 전송됐습니다. 30분 내 자동 동기화될 예정입니다.")
            self._start_auto_close()
        self.root.after(0, _do)

    def _start_auto_close(self):
        self._done = True
        self._auto_close_remaining = AUTO_CLOSE_SECONDS
        self._tick_countdown()

    def _tick_countdown(self):
        remaining = self._auto_close_remaining
        self._countdown_lbl.configure(
            text=f"{remaining}초 후 자동으로 닫힙니다..."
        )
        if remaining <= 0:
            self.root.destroy()
            return
        self._auto_close_remaining -= 1
        self._auto_close_job = self.root.after(1000, self._tick_countdown)

    def _on_close(self):
        if self._auto_close_job:
            self.root.after_cancel(self._auto_close_job)
        self.root.destroy()

    # ------------------------------------------------------------------
    # 동기화 작업 (별도 스레드에서 실행)
    # ------------------------------------------------------------------

    def _run_sync(self):
        try:
            log("=" * 50)
            log("마감 동기화 시작")

            # 1. config 로드
            self._set_status("준비 중...", "설정 파일을 읽는 중입니다.")
            cfg = load_config()
            log(f"Config loaded. GDB: {cfg['gdb_path']}")

            # 2. GDB 파일 존재 확인
            gdb_path = cfg['gdb_path']
            if not os.path.exists(gdb_path):
                msg = f"GDB 파일을 찾을 수 없습니다.\n경로: {gdb_path}"
                log(f"ERROR: GDB not found: {gdb_path}")
                self._show_failure(msg)
                return

            # 3. PEM 키 존재 확인
            pem_path = cfg['pem_path']
            if not os.path.exists(pem_path):
                msg = f"PEM 키 파일을 찾을 수 없습니다.\n경로: {pem_path}"
                log(f"ERROR: PEM not found: {pem_path}")
                self._show_failure(msg)
                return

            # 4. MD5 계산
            self._set_status("파일 확인 중...", "MD5 해시를 계산하고 있습니다.")
            try:
                md5 = calc_md5(gdb_path)
                file_size_mb = os.path.getsize(gdb_path) / (1024 * 1024)
                log(f"GDB MD5: {md5}, Size: {file_size_mb:.1f}MB")
                self._set_status(
                    "파일 업로드 중...",
                    f"크기: {file_size_mb:.1f}MB · {md5[:8]}..."
                )
            except Exception as e:
                log(f"ERROR: MD5 calc failed: {e}")
                self._show_failure(f"파일 읽기 오류: {e}")
                return

            # 5. SFTP 업로드
            def _progress_cb(transferred, total):
                if total > 0:
                    pct = transferred / total * 100
                    mb_done = transferred / (1024 * 1024)
                    mb_total = total / (1024 * 1024)
                    self.root.after(0, lambda p=pct, d=mb_done, t=mb_total: (
                        self._sub_msg.set(f"{d:.1f}MB / {t:.1f}MB ({p:.0f}%)")
                    ))

            try:
                log("SFTP 업로드 시작...")
                upload_sftp(cfg, _progress_cb)
                log("SFTP 업로드 완료")
            except ImportError:
                log("ERROR: paramiko 모듈이 설치되지 않았습니다.")
                self._show_failure(
                    "paramiko 모듈이 없습니다.\n"
                    "C:\\gd-sync\\install.bat 을 실행하여 설치하세요."
                )
                return
            except FileNotFoundError as e:
                log(f"ERROR: 파일 없음: {e}")
                self._show_failure(f"파일 없음: {e}")
                return
            except Exception as e:
                log(f"ERROR: SFTP 업로드 실패: {e}")
                self._show_failure(f"파일 업로드 실패:\n{e}")
                return

            # 6. 서버 동기화 API 호출
            self._set_status("서버 동기화 요청...", "서버에 동기화를 요청하고 있습니다.")
            log("API 호출 시작...")
            try:
                result = call_sync_api(cfg, timeout=300)
                log(f"API 응답: {result}")

                # 7. 진행 중 메시지 (API가 즉시 응답한 경우)
                self._set_status("동기화 진행 중...", "서버에서 데이터를 처리하고 있습니다.")

                log("동기화 완료")
                self._success = True
                self._show_success()

            except Exception as e:
                log(f"ERROR: API 호출 실패: {e}")
                # 업로드는 성공했지만 API 실패
                self._show_upload_ok_sync_fail()

        except Exception as e:
            log(f"CRITICAL: 예상치 못한 오류: {e}")
            self._show_failure(f"예상치 못한 오류가 발생했습니다:\n{e}")


# =====================================================================

def main():
    root = tk.Tk()
    app = SyncApp(root)
    root.mainloop()


if __name__ == '__main__':
    main()
