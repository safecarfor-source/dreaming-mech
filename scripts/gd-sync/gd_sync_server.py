#!/usr/bin/env python3
"""극동 GDB → PostgreSQL 동기화 서버 데몬 (v1)

A/B 시소 + C 격리 패턴:
  - 활성 슬롯(A or B)은 서비스 중 — 건드리지 않음
  - 비활성 슬롯에 새 데이터를 통째로 덮어씀
  - 검증 통과 시 activeSlot 전환
  - C 슬롯: 원본 GDB 파일 타임스탬프 보관 (롤백용)

실행 방법:
  python3 gd_sync_server.py            # 데몬 모드
  python3 gd_sync_server.py --once     # 1회 실행 후 종료 (테스트)
  python3 gd_sync_server.py --trigger  # 즉시 동기화 후 종료 (API 호출용)
"""

import os
import sys
import json
import time
import signal
import shutil
import hashlib
import logging
import argparse
import traceback
from datetime import datetime, timezone, timedelta
from logging.handlers import RotatingFileHandler
from typing import Optional

import psycopg2
import psycopg2.extras

# fdb 임포트 — 없으면 경고만 출력하고 계속 (설치 안 된 환경 대비)
try:
    import fdb
    FDB_AVAILABLE = True
except ImportError:
    FDB_AVAILABLE = False

# Telegram 알림은 requests로 처리
try:
    import requests as _requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


# ──────────────────────────────────────────────
# 상수
# ──────────────────────────────────────────────
KST = timezone(timedelta(hours=9))
DEFAULT_CONFIG_PATH = "/home/ubuntu/gd-sync/config.json"
DEFAULT_LOG_PATH = "/home/ubuntu/gd-sync/logs/sync.log"
DEFAULT_GDB_PATH = "/home/ubuntu/gd-sync/incoming/TOTAL.GDB"
DEFAULT_SLOTS_DIR = "/home/ubuntu/gd-sync/slots"

# 슬롯 디렉토리별 보관 파일 수
SLOT_FILE_FIFO = 5

# 배치 INSERT 크기 (메모리 제어)
BATCH_SIZE = 500


# ──────────────────────────────────────────────
# 로깅 초기화
# ──────────────────────────────────────────────
def setup_logging(log_path: str) -> logging.Logger:
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    logger = logging.getLogger("gd_sync")
    logger.setLevel(logging.INFO)

    fmt = logging.Formatter(
        "[%(asctime)s] %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # 파일 핸들러 — 1MB 회전, 백업 1개
    fh = RotatingFileHandler(log_path, maxBytes=1_000_000, backupCount=1, encoding="utf-8")
    fh.setFormatter(fmt)

    # stdout 핸들러 (systemd journald 친화적)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)

    logger.addHandler(fh)
    logger.addHandler(sh)
    return logger


logger = setup_logging(DEFAULT_LOG_PATH)  # 설정 로드 전 임시 초기화


# ──────────────────────────────────────────────
# 설정 로드
# ──────────────────────────────────────────────
def load_config(path: str = DEFAULT_CONFIG_PATH) -> dict:
    defaults = {
        "db_host": "localhost",
        "db_port": 5432,
        "db_name": "mechanic_db",
        "db_user": "app_user",
        "db_password": "",
        "gdb_path": DEFAULT_GDB_PATH,
        "slots_dir": DEFAULT_SLOTS_DIR,
        "check_interval_business": 1800,
        "check_interval_off": 3600,
        "business_start": "08:30",
        "business_end": "19:00",
        "min_vehicles": 100,
        "min_products": 50,
        "min_sales": 1000,
        "telegram_bot_token": "",
        "telegram_chat_id": "",
    }

    # 환경변수 오버라이드
    env_map = {
        "DATABASE_URL": None,  # 별도 처리
        "DB_HOST": "db_host",
        "DB_PORT": "db_port",
        "DB_NAME": "db_name",
        "DB_USER": "db_user",
        "DB_PASSWORD": "db_password",
        "TELEGRAM_BOT_TOKEN": "telegram_bot_token",
        "TELEGRAM_CHAT_ID": "telegram_chat_id",
    }

    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                file_cfg = json.load(f)
            defaults.update(file_cfg)
        except Exception as e:
            logger.warning(f"config.json 로드 실패 ({e}), 기본값 사용")

    for env_key, cfg_key in env_map.items():
        val = os.environ.get(env_key)
        if val and cfg_key:
            if cfg_key == "db_port":
                try:
                    defaults[cfg_key] = int(val)
                except ValueError:
                    pass
            else:
                defaults[cfg_key] = val

    # DATABASE_URL 파싱 (postgresql://user:pass@host:port/db 형식)
    database_url = os.environ.get("DATABASE_URL", "")
    if database_url and database_url.startswith("postgresql"):
        try:
            from urllib.parse import urlparse
            parsed = urlparse(database_url)
            defaults["db_host"] = parsed.hostname or defaults["db_host"]
            defaults["db_port"] = parsed.port or defaults["db_port"]
            defaults["db_name"] = (parsed.path or "").lstrip("/") or defaults["db_name"]
            defaults["db_user"] = parsed.username or defaults["db_user"]
            defaults["db_password"] = parsed.password or defaults["db_password"]
        except Exception as e:
            logger.warning(f"DATABASE_URL 파싱 실패: {e}")

    return defaults


# ──────────────────────────────────────────────
# PostgreSQL 연결
# ──────────────────────────────────────────────
def get_pg_conn(cfg: dict):
    return psycopg2.connect(
        host=cfg["db_host"],
        port=cfg["db_port"],
        dbname=cfg["db_name"],
        user=cfg["db_user"],
        password=cfg["db_password"],
        connect_timeout=10,
    )


# ──────────────────────────────────────────────
# MD5 해시 계산
# ──────────────────────────────────────────────
def file_md5(path: str) -> Optional[str]:
    h = hashlib.md5()
    try:
        with open(path, "rb") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()
    except Exception as e:
        logger.error(f"파일 해시 계산 실패 ({path}): {e}")
        return None


# ──────────────────────────────────────────────
# 비즈니스 시간 판별
# ──────────────────────────────────────────────
def is_business_hours(cfg: dict) -> bool:
    now = datetime.now(KST).time()
    try:
        start_h, start_m = map(int, cfg["business_start"].split(":"))
        end_h, end_m = map(int, cfg["business_end"].split(":"))
        from datetime import time as dtime
        start = dtime(start_h, start_m)
        end = dtime(end_h, end_m)
        return start <= now <= end
    except Exception:
        return True  # 파싱 실패 시 업무 시간으로 간주


def get_check_interval(cfg: dict) -> int:
    if is_business_hours(cfg):
        return cfg["check_interval_business"]
    return cfg["check_interval_off"]


# ──────────────────────────────────────────────
# Telegram 알림
# ──────────────────────────────────────────────
def send_telegram(cfg: dict, message: str):
    token = cfg.get("telegram_bot_token", "")
    chat_id = cfg.get("telegram_chat_id", "")
    if not token or not chat_id:
        return
    if not REQUESTS_AVAILABLE:
        logger.warning("requests 미설치 — Telegram 알림 생략")
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
        resp = _requests.post(url, json=payload, timeout=10)
        if resp.status_code != 200:
            logger.warning(f"Telegram 전송 실패: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"Telegram 전송 예외: {e}")


# ──────────────────────────────────────────────
# 슬롯 파일 관리 (FIFO)
# ──────────────────────────────────────────────
def copy_to_slot_dir(src: str, slot: str, slots_dir: str, fifo: int = SLOT_FILE_FIFO):
    """GDB 파일을 슬롯 디렉토리에 타임스탬프 파일명으로 복사, FIFO 유지"""
    dst_dir = os.path.join(slots_dir, slot)
    os.makedirs(dst_dir, exist_ok=True)

    ts = datetime.now(KST).strftime("%Y%m%d_%H%M%S")
    dst = os.path.join(dst_dir, f"TOTAL_{ts}.GDB")
    try:
        shutil.copy2(src, dst)
        logger.info(f"슬롯 {slot} 복사 완료: {dst}")
    except Exception as e:
        logger.error(f"슬롯 {slot} 복사 실패: {e}")
        return

    # FIFO: 오래된 파일 제거
    try:
        files = sorted(
            [os.path.join(dst_dir, f) for f in os.listdir(dst_dir) if f.endswith(".GDB")],
            key=os.path.getmtime
        )
        while len(files) > fifo:
            old = files.pop(0)
            os.remove(old)
            logger.info(f"슬롯 {slot} 오래된 파일 삭제: {old}")
    except Exception as e:
        logger.warning(f"슬롯 {slot} FIFO 정리 실패: {e}")


# ──────────────────────────────────────────────
# Firebird GDB 파싱
# ──────────────────────────────────────────────
def parse_date(raw) -> Optional[str]:
    """극동 날짜 형식 → YYYY-MM-DD 문자열 변환"""
    if raw is None:
        return None
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw:
            return None
        # YYYYMMDD 형식
        if len(raw) == 8 and raw.isdigit():
            return f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"
        # YYYY-MM-DD 형식이면 그대로
        if len(raw) == 10 and raw[4] == "-":
            return raw
        return raw
    if isinstance(raw, (int, float)):
        s = str(int(raw))
        if len(s) == 8:
            return f"{s[:4]}-{s[4:6]}-{s[6:]}"
    return str(raw) if raw else None


def safe_float(val, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_str(val, default: str = "") -> str:
    if val is None:
        return default
    s = str(val).strip()
    # NULL 문자 제거
    return s.replace("\x00", "").strip()


def fetch_all_rows(cursor, table: str, columns: str, where: str = "") -> list:
    """Firebird 테이블 전체 조회, 에러 시 빈 리스트 반환"""
    try:
        sql = f"SELECT {columns} FROM {table}"
        if where:
            sql += f" WHERE {where}"
        cursor.execute(sql)
        return cursor.fetchall()
    except Exception as e:
        logger.error(f"Firebird {table} 조회 실패: {e}")
        return []


def parse_gdb(gdb_path: str) -> dict:
    """
    TOTAL.GDB 파싱 → {
        customers: [...],
        vehicles: [...],
        products: [...],
        sale_details: [...],
        repairs: [...],
    }
    """
    if not FDB_AVAILABLE:
        raise RuntimeError("fdb 라이브러리가 설치되지 않았습니다. pip install fdb 실행 필요.")

    logger.info(f"GDB 파싱 시작: {gdb_path}")

    conn = fdb.connect(
        database=gdb_path,
        user="SYSDBA",
        password="masterkey",
        charset="WIN949",  # 한글 인코딩
    )
    cur = conn.cursor()

    result = {
        "customers": [],
        "vehicles": [],
        "products": [],
        "sale_details": [],
        "repairs": [],
    }

    # CUSTOMS → GdCustomer
    logger.info("CUSTOMS 파싱 중...")
    rows = fetch_all_rows(
        cur, "CUSTOMS",
        "CUST, CNAME, CEO, TEL1, FAX, ADDR, BIGO, UPTE, JONGM"
    )
    for r in rows:
        code = safe_str(r[0])
        if not code:
            continue
        result["customers"].append({
            "code": code,
            "name": safe_str(r[1]) or code,
            "ceo": safe_str(r[2]) or None,
            "phone": safe_str(r[3]) or None,
            "fax": safe_str(r[4]) or None,
            "address": safe_str(r[5]) or None,
            "bizNumber": safe_str(r[6]) or None,
            "bizType": safe_str(r[7]) or None,
            "bizCategory": safe_str(r[8]) or None,
        })
    logger.info(f"  CUSTOMS: {len(result['customers'])}건")

    # ASCUST → GdVehicle
    logger.info("ASCUST 파싱 중...")
    rows = fetch_all_rows(
        cur, "ASCUST",
        "CODE, IDNO, CNAME, REP, TEL1, ADDR, CJONG, BJONG, COLOR, HAHA, YDAY, CDAY, BIGO"
    )
    for r in rows:
        code = safe_str(r[0])
        if not code:
            continue
        result["vehicles"].append({
            "code": code,
            "plateNumber": safe_str(r[1]) or None,
            "ownerName": safe_str(r[2]) or None,
            "rep": safe_str(r[3]) or None,
            "phone": safe_str(r[4]) or None,
            "address": safe_str(r[5]) or None,
            "carModel": safe_str(r[6]) or None,
            "carModel2": safe_str(r[7]) or None,
            "color": safe_str(r[8]) or None,
            "displacement": safe_str(r[9]) or None,
            "modelYear": safe_str(r[10]) or None,
            "purchaseDate": safe_str(r[11]) or None,
            "memo": safe_str(r[12]) or None,
        })
    logger.info(f"  ASCUST: {len(result['vehicles'])}건")

    # GOODS → GdProduct
    logger.info("GOODS 파싱 중...")
    rows = fetch_all_rows(
        cur, "GOODS",
        "CODE, GNAME, XNAME, UNIT, COST_B, PRI1, PRI2, PRI3, PRI4, PRI5, JAEGO, FIXP"
    )
    for r in rows:
        code = safe_str(r[0])
        if not code:
            continue
        result["products"].append({
            "code": code,
            "name": safe_str(r[1]) or code,
            "altName": safe_str(r[2]) or None,
            "unit": safe_str(r[3]) or None,
            "costPrice": safe_float(r[4]),
            "sellPrice1": safe_float(r[5]),
            "sellPrice2": safe_float(r[6]),
            "sellPrice3": safe_float(r[7]),
            "sellPrice4": safe_float(r[8]),
            "sellPrice5": safe_float(r[9]),
            "stock": safe_float(r[10]),
            "fixedPrice": safe_float(r[11]),
        })
    logger.info(f"  GOODS: {len(result['products'])}건")

    # DATAS → GdSaleDetail
    # 존재하는 거래처/상품 코드 집합 미리 빌드 (FK 무결성)
    customer_codes = {c["code"] for c in result["customers"]}
    product_codes = {p["code"] for p in result["products"]}

    logger.info("DATAS 파싱 중...")
    rows = fetch_all_rows(
        cur, "DATAS",
        "FNO, MDAY, IO, CUST, GODS, GNAME, SU, DAN, AMOUNT"
    )
    for r in rows:
        fno = safe_str(r[0])
        cust_code = safe_str(r[3])
        prod_code = safe_str(r[4])
        # FK 불충족 건 스킵
        if cust_code not in customer_codes or prod_code not in product_codes:
            continue
        result["sale_details"].append({
            "fno": fno,
            "saleDate": parse_date(r[1]) or "1970-01-01",
            "saleType": safe_str(r[2]) or None,
            "customerCode": cust_code,
            "productCode": prod_code,
            "productName": safe_str(r[5]) or None,
            "qty": safe_float(r[6]),
            "unitPrice": safe_float(r[7]),
            "amount": safe_float(r[8]),
        })
    logger.info(f"  DATAS: {len(result['sale_details'])}건")

    # ASDATA → GdRepair
    vehicle_codes = {v["code"] for v in result["vehicles"]}

    logger.info("ASDATA 파싱 중...")
    rows = fetch_all_rows(
        cur, "ASDATA",
        "FNO, CUST, MDAY, GODS, GNAME, SU, DAN, AMOUNT, KILLO, BIGO"
    )
    for r in rows:
        vehicle_code = safe_str(r[1])
        result["repairs"].append({
            "fno": safe_str(r[0]) or None,
            "vehicleCode": vehicle_code if vehicle_code in vehicle_codes else None,
            "customerCode": vehicle_code or None,
            "repairDate": parse_date(r[2]),
            "productCode": safe_str(r[3]) or None,
            "productName": safe_str(r[4]) or None,
            "qty": safe_float(r[5]),
            "unitPrice": safe_float(r[6]),
            "amount": safe_float(r[7]),
            "mileage": safe_float(r[8]) if r[8] else None,
            "memo": safe_str(r[9]) or None,
        })
    logger.info(f"  ASDATA: {len(result['repairs'])}건")

    cur.close()
    conn.close()
    logger.info("GDB 파싱 완료")
    return result


# ──────────────────────────────────────────────
# PostgreSQL 데이터 쓰기
# ──────────────────────────────────────────────
def clear_slot(pg_conn, slot: str):
    """비활성 슬롯 데이터 전체 삭제 (FK 순서 역순으로)"""
    tables = [
        "GdRepair",
        "GdSaleDetail",
        "GdProduct",
        "GdVehicle",
        "GdCustomer",
    ]
    with pg_conn.cursor() as cur:
        for t in tables:
            cur.execute(f'DELETE FROM "{t}" WHERE slot = %s', (slot,))
            deleted = cur.rowcount
            logger.info(f"  {t} 슬롯={slot} 삭제: {deleted}건")
    pg_conn.commit()


def insert_batch(pg_conn, sql: str, rows: list, table_name: str):
    """배치 INSERT (BATCH_SIZE 단위)"""
    total = 0
    with pg_conn.cursor() as cur:
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            psycopg2.extras.execute_batch(cur, sql, batch)
            total += len(batch)
    pg_conn.commit()
    logger.info(f"  {table_name}: {total}건 INSERT 완료")
    return total


def write_slot_data(pg_conn, data: dict, slot: str) -> int:
    """파싱된 데이터를 지정 슬롯에 INSERT. 총 INSERT 건수 반환."""
    total_rows = 0
    now = datetime.now(timezone.utc).isoformat()

    # GdCustomer
    sql = """
        INSERT INTO "GdCustomer"
            (code, slot, name, ceo, phone, fax, address, "bizNumber", "bizType", "bizCategory",
             "createdAt", "updatedAt")
        VALUES (%(code)s, %(slot)s, %(name)s, %(ceo)s, %(phone)s, %(fax)s, %(address)s,
                %(bizNumber)s, %(bizType)s, %(bizCategory)s, %(now)s, %(now)s)
        ON CONFLICT (code, slot) DO UPDATE SET
            name = EXCLUDED.name, ceo = EXCLUDED.ceo, phone = EXCLUDED.phone,
            fax = EXCLUDED.fax, address = EXCLUDED.address, "bizNumber" = EXCLUDED."bizNumber",
            "bizType" = EXCLUDED."bizType", "bizCategory" = EXCLUDED."bizCategory",
            "updatedAt" = EXCLUDED."updatedAt"
    """
    rows = [{**r, "slot": slot, "now": now} for r in data["customers"]]
    total_rows += insert_batch(pg_conn, sql, rows, "GdCustomer")

    # GdVehicle
    sql = """
        INSERT INTO "GdVehicle"
            (code, slot, "plateNumber", "ownerName", rep, phone, address,
             "carModel", "carModel2", color, displacement, "modelYear", "purchaseDate", memo,
             "createdAt", "updatedAt")
        VALUES (%(code)s, %(slot)s, %(plateNumber)s, %(ownerName)s, %(rep)s, %(phone)s, %(address)s,
                %(carModel)s, %(carModel2)s, %(color)s, %(displacement)s, %(modelYear)s,
                %(purchaseDate)s, %(memo)s, %(now)s, %(now)s)
        ON CONFLICT (code, slot) DO UPDATE SET
            "plateNumber" = EXCLUDED."plateNumber", "ownerName" = EXCLUDED."ownerName",
            rep = EXCLUDED.rep, phone = EXCLUDED.phone, address = EXCLUDED.address,
            "carModel" = EXCLUDED."carModel", "carModel2" = EXCLUDED."carModel2",
            color = EXCLUDED.color, displacement = EXCLUDED.displacement,
            "modelYear" = EXCLUDED."modelYear", "purchaseDate" = EXCLUDED."purchaseDate",
            memo = EXCLUDED.memo, "updatedAt" = EXCLUDED."updatedAt"
    """
    rows = [{**r, "slot": slot, "now": now} for r in data["vehicles"]]
    total_rows += insert_batch(pg_conn, sql, rows, "GdVehicle")

    # GdProduct
    sql = """
        INSERT INTO "GdProduct"
            (code, slot, name, "altName", unit, "costPrice",
             "sellPrice1", "sellPrice2", "sellPrice3", "sellPrice4", "sellPrice5",
             "fixedPrice", stock, "createdAt", "updatedAt")
        VALUES (%(code)s, %(slot)s, %(name)s, %(altName)s, %(unit)s, %(costPrice)s,
                %(sellPrice1)s, %(sellPrice2)s, %(sellPrice3)s, %(sellPrice4)s, %(sellPrice5)s,
                %(fixedPrice)s, %(stock)s, %(now)s, %(now)s)
        ON CONFLICT (code, slot) DO UPDATE SET
            name = EXCLUDED.name, "altName" = EXCLUDED."altName", unit = EXCLUDED.unit,
            "costPrice" = EXCLUDED."costPrice", "sellPrice1" = EXCLUDED."sellPrice1",
            "sellPrice2" = EXCLUDED."sellPrice2", "sellPrice3" = EXCLUDED."sellPrice3",
            "sellPrice4" = EXCLUDED."sellPrice4", "sellPrice5" = EXCLUDED."sellPrice5",
            "fixedPrice" = EXCLUDED."fixedPrice", stock = EXCLUDED.stock,
            "updatedAt" = EXCLUDED."updatedAt"
    """
    rows = [{**r, "slot": slot, "now": now} for r in data["products"]]
    total_rows += insert_batch(pg_conn, sql, rows, "GdProduct")

    # GdSaleDetail (FK: customerCode, productCode)
    sql = """
        INSERT INTO "GdSaleDetail"
            (fno, slot, "saleDate", "saleType", "customerCode", "productCode", "productName",
             qty, "unitPrice", amount, "createdAt")
        VALUES (%(fno)s, %(slot)s, %(saleDate)s, %(saleType)s, %(customerCode)s,
                %(productCode)s, %(productName)s, %(qty)s, %(unitPrice)s, %(amount)s, %(now)s)
    """
    rows = [{**r, "slot": slot, "now": now} for r in data["sale_details"]]
    total_rows += insert_batch(pg_conn, sql, rows, "GdSaleDetail")

    # GdRepair (FK: vehicleCode — nullable)
    sql = """
        INSERT INTO "GdRepair"
            (fno, slot, "vehicleCode", "customerCode", "repairDate", "productCode",
             "productName", unit, qty, "unitPrice", amount, mileage, memo, "createdAt")
        VALUES (%(fno)s, %(slot)s, %(vehicleCode)s, %(customerCode)s, %(repairDate)s,
                %(productCode)s, %(productName)s, %(unit)s, %(qty)s, %(unitPrice)s,
                %(amount)s, %(mileage)s, %(memo)s, %(now)s)
    """
    # GdRepair.unit 필드가 파싱 dict에 없으므로 기본값 추가
    rows = [{**r, "slot": slot, "now": now, "unit": r.get("unit")} for r in data["repairs"]]
    total_rows += insert_batch(pg_conn, sql, rows, "GdRepair")

    return total_rows


# ──────────────────────────────────────────────
# 검증
# ──────────────────────────────────────────────
def validate_slot(pg_conn, slot: str, cfg: dict) -> tuple[bool, str]:
    """슬롯 데이터 최소 건수 검증. (valid, reason)"""
    checks = [
        ("GdVehicle", cfg["min_vehicles"]),
        ("GdProduct", cfg["min_products"]),
        ("GdSaleDetail", cfg["min_sales"]),
    ]
    with pg_conn.cursor() as cur:
        for table, minimum in checks:
            cur.execute(f'SELECT COUNT(*) FROM "{table}" WHERE slot = %s', (slot,))
            count = cur.fetchone()[0]
            if count < minimum:
                return False, f"{table} 건수 부족: {count} < {minimum}"
    return True, "OK"


# ──────────────────────────────────────────────
# 동기화 로그 관리
# ──────────────────────────────────────────────
def create_sync_log(pg_conn, sync_type: str, slot: str, source_hash: str) -> int:
    with pg_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "GdSyncLog"
                ("syncType", "tableName", slot, "rowCount", status, "sourceHash", "startedAt")
            VALUES (%s, %s, %s, 0, 'running', %s, NOW())
            RETURNING id
            """,
            (sync_type, "all", slot, source_hash)
        )
        log_id = cur.fetchone()[0]
    pg_conn.commit()
    return log_id


def complete_sync_log(pg_conn, log_id: int, status: str, row_count: int, error_msg: str = None):
    with pg_conn.cursor() as cur:
        cur.execute(
            """
            UPDATE "GdSyncLog"
            SET status = %s, "rowCount" = %s, "errorMessage" = %s, "completedAt" = NOW()
            WHERE id = %s
            """,
            (status, row_count, error_msg, log_id)
        )
    pg_conn.commit()


def get_active_slot(pg_conn) -> str:
    """GdSlotConfig 에서 현재 활성 슬롯 조회. 없으면 'A' 반환."""
    with pg_conn.cursor() as cur:
        cur.execute('SELECT "activeSlot" FROM "GdSlotConfig" WHERE id = 1')
        row = cur.fetchone()
    return row[0] if row else "A"


def switch_active_slot(pg_conn, new_slot: str):
    """GdSlotConfig 업데이트: activeSlot 전환, switchCount 증가"""
    with pg_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "GdSlotConfig" (id, "activeSlot", "lastSyncAt", "lastSyncSlot",
                                        "switchCount", "updatedAt")
            VALUES (1, %s, NOW(), %s, 1, NOW())
            ON CONFLICT (id) DO UPDATE SET
                "activeSlot" = EXCLUDED."activeSlot",
                "lastSyncAt" = NOW(),
                "lastSyncSlot" = EXCLUDED."lastSyncSlot",
                "switchCount" = "GdSlotConfig"."switchCount" + 1,
                "updatedAt" = NOW()
            """,
            (new_slot, new_slot)
        )
    pg_conn.commit()


def get_last_synced_hash(pg_conn) -> Optional[str]:
    """마지막 성공 동기화의 GDB 해시 반환"""
    with pg_conn.cursor() as cur:
        cur.execute(
            """
            SELECT "sourceHash" FROM "GdSyncLog"
            WHERE status = 'completed' AND "sourceHash" IS NOT NULL
            ORDER BY "completedAt" DESC
            LIMIT 1
            """
        )
        row = cur.fetchone()
    return row[0] if row else None


# ──────────────────────────────────────────────
# 핵심 동기화 로직
# ──────────────────────────────────────────────
def run_sync(cfg: dict, force: bool = False) -> bool:
    """
    GDB 파일을 읽어 비활성 슬롯에 쓰고 슬롯 전환.
    성공 시 True, 실패/스킵 시 False 반환.
    """
    gdb_path = cfg["gdb_path"]
    slots_dir = cfg["slots_dir"]

    # GDB 파일 존재 확인
    if not os.path.exists(gdb_path):
        logger.warning(f"GDB 파일 없음: {gdb_path}")
        return False

    # MD5 해시로 변경 감지
    current_hash = file_md5(gdb_path)
    if current_hash is None:
        logger.error("GDB 해시 계산 실패")
        return False

    pg_conn = None
    log_id = None
    try:
        pg_conn = get_pg_conn(cfg)

        if not force:
            last_hash = get_last_synced_hash(pg_conn)
            if current_hash == last_hash:
                logger.info(f"GDB 변경 없음 (hash={current_hash[:8]}...) — 스킵")
                return False

        file_size = os.path.getsize(gdb_path) / (1024 * 1024)
        logger.info(f"GDB 변경 감지! Size={file_size:.1f}MB, hash={current_hash[:8]}...")

        # 활성/비활성 슬롯 결정
        active_slot = get_active_slot(pg_conn)
        inactive_slot = "B" if active_slot == "A" else "A"
        logger.info(f"활성 슬롯: {active_slot} → 비활성(쓰기 대상): {inactive_slot}")

        # 동기화 로그 생성
        log_id = create_sync_log(pg_conn, "full", inactive_slot, current_hash)

        # C 슬롯 + 비활성 슬롯에 GDB 파일 복사
        copy_to_slot_dir(gdb_path, "C", slots_dir)
        copy_to_slot_dir(gdb_path, inactive_slot, slots_dir)

        # GDB 파싱
        start_ts = time.time()
        data = parse_gdb(gdb_path)
        parse_elapsed = time.time() - start_ts
        logger.info(f"파싱 완료 ({parse_elapsed:.1f}s): "
                    f"거래처={len(data['customers'])}, "
                    f"차량={len(data['vehicles'])}, "
                    f"상품={len(data['products'])}, "
                    f"전표={len(data['sale_details'])}, "
                    f"정비={len(data['repairs'])}")

        # 비활성 슬롯 데이터 삭제
        logger.info(f"슬롯 {inactive_slot} 기존 데이터 삭제 중...")
        clear_slot(pg_conn, inactive_slot)

        # 새 데이터 INSERT
        logger.info(f"슬롯 {inactive_slot} 데이터 INSERT 중...")
        write_ts = time.time()
        total_rows = write_slot_data(pg_conn, data, inactive_slot)
        write_elapsed = time.time() - write_ts
        logger.info(f"INSERT 완료 ({write_elapsed:.1f}s): 총 {total_rows}건")

        # 검증
        valid, reason = validate_slot(pg_conn, inactive_slot, cfg)
        if not valid:
            msg = f"검증 실패 ({reason}): 슬롯 전환 안 함, 현재 슬롯({active_slot}) 유지"
            logger.error(msg)
            complete_sync_log(pg_conn, log_id, "failed", total_rows, reason)
            send_telegram(cfg,
                f"[꿈꾸는정비사] GD 동기화 검증 실패\n"
                f"슬롯: {inactive_slot}\n"
                f"원인: {reason}\n"
                f"현재 서비스 슬롯: {active_slot} (유지)"
            )
            return False

        # 슬롯 전환
        switch_active_slot(pg_conn, inactive_slot)
        total_elapsed = time.time() - start_ts
        logger.info(
            f"동기화 성공! 슬롯 {active_slot} → {inactive_slot} 전환 완료 "
            f"(총 소요: {total_elapsed:.1f}s)"
        )
        complete_sync_log(pg_conn, log_id, "completed", total_rows)
        return True

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"동기화 예외 발생:\n{tb}")
        if pg_conn and log_id:
            try:
                pg_conn.rollback()
                complete_sync_log(pg_conn, log_id, "failed", 0, str(e)[:1000])
            except Exception:
                pass
        send_telegram(cfg,
            f"[꿈꾸는정비사] GD 동기화 실패\n"
            f"오류: {str(e)[:300]}\n"
            f"시각: {datetime.now(KST).strftime('%Y-%m-%d %H:%M:%S')}"
        )
        return False

    finally:
        if pg_conn:
            try:
                pg_conn.close()
            except Exception:
                pass


# ──────────────────────────────────────────────
# 데몬 루프
# ──────────────────────────────────────────────
class GdSyncDaemon:
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.running = True
        self._alive_count = 0
        signal.signal(signal.SIGTERM, self._handle_sigterm)
        signal.signal(signal.SIGINT, self._handle_sigterm)

    def _handle_sigterm(self, signum, frame):
        logger.info(f"시그널 {signum} 수신 — 안전하게 종료 중...")
        self.running = False

    def run(self):
        logger.info("=" * 60)
        logger.info("GD Sync Server 시작 (A/B 시소 + C 격리 패턴)")
        logger.info(f"GDB 경로: {self.cfg['gdb_path']}")
        logger.info(f"업무시간: {self.cfg['business_start']} ~ {self.cfg['business_end']}")
        logger.info(f"업무시간 체크 간격: {self.cfg['check_interval_business']}초")
        logger.info(f"비업무시간 체크 간격: {self.cfg['check_interval_off']}초")
        logger.info("=" * 60)

        while self.running:
            try:
                run_sync(self.cfg)
            except Exception as e:
                logger.error(f"데몬 루프 예외 (계속 진행): {e}")

            if not self.running:
                break

            interval = get_check_interval(self.cfg)
            logger.info(
                f"다음 체크까지 {interval}초 대기 "
                f"({'업무시간' if is_business_hours(self.cfg) else '비업무시간'})"
            )

            # interval 동안 1초씩 잠자며 SIGTERM 즉시 반응
            for _ in range(interval):
                if not self.running:
                    break
                time.sleep(1)

            # 매 시간 생존 로그 (interval이 최대 3600초 = 1시간이므로 루프마다 출력)
            self._alive_count += 1
            logger.info(f"[ALIVE] 체크 #{self._alive_count} 완료. 데몬 정상 작동 중.")

        logger.info("GD Sync Server 종료.")


# ──────────────────────────────────────────────
# 진입점
# ──────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="극동 GDB → PostgreSQL 동기화 서버 데몬"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="1회 동기화 후 종료 (테스트용)"
    )
    parser.add_argument(
        "--trigger",
        action="store_true",
        help="즉시 동기화 후 종료 (API 트리거용, hash 스킵 없음)"
    )
    parser.add_argument(
        "--config",
        default=DEFAULT_CONFIG_PATH,
        help=f"설정 파일 경로 (기본: {DEFAULT_CONFIG_PATH})"
    )
    args = parser.parse_args()

    # 설정 로드 후 로거 재초기화
    cfg = load_config(args.config)
    global logger
    log_path = cfg.get("log_path", DEFAULT_LOG_PATH)
    logger = setup_logging(log_path)

    if args.trigger:
        logger.info("=== 즉시 동기화 트리거 (--trigger) ===")
        success = run_sync(cfg, force=True)
        sys.exit(0 if success else 1)

    if args.once:
        logger.info("=== 1회 동기화 (--once) ===")
        success = run_sync(cfg)
        if success:
            logger.info("=== 동기화 성공 ===")
            sys.exit(0)
        else:
            logger.info("=== 동기화 실패 또는 변경 없음 ===")
            sys.exit(0)  # 변경 없음도 정상이므로 exit 0

    # 데몬 모드
    daemon = GdSyncDaemon(cfg)
    daemon.run()


if __name__ == "__main__":
    main()
