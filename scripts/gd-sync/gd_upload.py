#!/usr/bin/env python3
"""극동 GDB 자동 업로드 — 상주형 (v2)
PC 시작 시 1번 실행하면 영구적으로 3분마다 반복.
작업 스케줄러 불필요. 에러 나도 절대 죽지 않음.
"""
import os
import sys
import time
import hashlib
import subprocess
from datetime import datetime

# ========== CONFIG ==========
GDB_PATH = r"C:\Program Files\PsimCarS\Data\DM\TOTAL.GDB"
SYNC_DIR = r"C:\gd-sync"
LOG_FILE = os.path.join(SYNC_DIR, "upload.log")
HASH_FILE = os.path.join(SYNC_DIR, "last_hash.txt")
PEM_PATH = os.path.join(SYNC_DIR, "dreaming-mech-key.pem")
SERVER_IP = "13.209.143.155"
SERVER_USER = "ubuntu"
REMOTE_DIR = "/home/ubuntu/gd-sync/incoming"
INTERVAL = 180  # 3분 (초)
# =============================


def log(msg):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{ts}] {msg}"
    print(line)
    try:
        os.makedirs(SYNC_DIR, exist_ok=True)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
        # 로그 파일 크기 제한 (1MB 초과 시 잘라내기)
        if os.path.getsize(LOG_FILE) > 1_000_000:
            with open(LOG_FILE, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            with open(LOG_FILE, 'w', encoding='utf-8') as f:
                f.writelines(lines[-500:])  # 최근 500줄만 유지
    except Exception:
        pass


def file_hash(path):
    h = hashlib.md5()
    try:
        with open(path, 'rb') as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()
    except Exception as e:
        log(f"Hash error: {e}")
        return None


def last_hash():
    try:
        with open(HASH_FILE, 'r') as f:
            return f.read().strip()
    except Exception:
        return None


def save_hash(h):
    try:
        with open(HASH_FILE, 'w') as f:
            f.write(h)
    except Exception:
        pass


def upload_paramiko():
    import paramiko
    key = paramiko.RSAKey.from_private_key_file(PEM_PATH)
    transport = paramiko.Transport((SERVER_IP, 22))
    transport.connect(username=SERVER_USER, pkey=key)
    sftp = paramiko.SFTPClient.from_transport(transport)
    remote_path = f"{REMOTE_DIR}/TOTAL.GDB"
    sftp.put(GDB_PATH, remote_path)
    sftp.close()
    transport.close()
    return "SFTP"


def upload_scp():
    remote_path = f"{SERVER_USER}@{SERVER_IP}:{REMOTE_DIR}/TOTAL.GDB"
    cmd = [
        "scp", "-i", PEM_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=NUL",
        GDB_PATH, remote_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise Exception(f"SCP error: {result.stderr}")
    return "SCP"


def try_upload():
    """1회 업로드 시도. 성공=True, 실패=False, 변경없음=None"""
    if not os.path.exists(GDB_PATH):
        log(f"GDB not found: {GDB_PATH}")
        return False

    if not os.path.exists(PEM_PATH):
        log(f"PEM key not found: {PEM_PATH}")
        return False

    current = file_hash(GDB_PATH)
    if current is None:
        return False

    if current == last_hash():
        return None  # 변경 없음 — 정상

    file_size = os.path.getsize(GDB_PATH) / (1024 * 1024)
    log(f"Change detected! Size: {file_size:.1f}MB. Uploading...")

    start = time.time()
    try:
        try:
            method = upload_paramiko()
        except (ImportError, Exception):
            method = upload_scp()

        elapsed = time.time() - start
        save_hash(current)
        speed = file_size / elapsed if elapsed > 0 else 0
        log(f"Upload OK! ({method}, {elapsed:.1f}s, {speed:.1f}MB/s)")
        return True

    except Exception as e:
        log(f"Upload FAILED: {e}")
        return False


def main_loop():
    """영구 반복 루프. 절대 죽지 않음."""
    log("=" * 50)
    log("GD Auto Sync v2 시작 (상주형)")
    log(f"GDB: {GDB_PATH}")
    log(f"서버: {SERVER_USER}@{SERVER_IP}")
    log(f"간격: {INTERVAL}초 ({INTERVAL//60}분)")
    log("=" * 50)

    fail_count = 0
    cycle = 0

    while True:
        try:
            cycle += 1
            result = try_upload()

            if result is True:
                fail_count = 0  # 성공하면 리셋
            elif result is False:
                fail_count += 1
                if fail_count >= 5:
                    log(f"연속 {fail_count}회 실패. 10분 대기 후 재시도...")
                    time.sleep(600)  # 10분 대기
                    fail_count = 0
                    continue
            # result is None → 변경 없음, 조용히 넘어감

            # 1시간마다 생존 로그 (20사이클 = 60분)
            if cycle % 20 == 0:
                log(f"[ALIVE] {cycle}회 체크 완료. 정상 작동 중.")

        except Exception as e:
            log(f"[CRITICAL] 예상치 못한 에러: {e}")
            # 죽지 않고 계속 진행

        time.sleep(INTERVAL)


if __name__ == '__main__':
    # --once 옵션: 1회만 실행 (테스트용)
    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        log("=== 1회 테스트 실행 ===")
        result = try_upload()
        if result is True:
            log("=== 성공 ===")
        elif result is None:
            log("=== 변경 없음 ===")
        else:
            log("=== 실패 ===")
            sys.exit(1)
    else:
        main_loop()
