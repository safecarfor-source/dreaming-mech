#!/usr/bin/env python3
"""극동 GDB → PostgreSQL 자동 동기화 서버 스크립트
/home/ubuntu/gd-sync/ 에 설치하여 사용.

사용법:
  1. PC에서 SCP로 GDB 파일 업로드: scp Total.gdb ubuntu@서버:/home/ubuntu/gd-sync/incoming/
  2. 이 스크립트가 자동으로 감지하여 임포트 실행
  3. cron으로 5분마다 실행하거나, inotifywait로 실시간 감지

cron 설정:
  */5 * * * * /usr/bin/python3 /home/ubuntu/gd-sync/gd_sync_server.py >> /home/ubuntu/gd-sync/sync.log 2>&1
"""
import subprocess
import psycopg2
import re
import os
import sys
import time
import shutil
from datetime import datetime

SYNC_DIR = '/home/ubuntu/gd-sync'
INCOMING_DIR = os.path.join(SYNC_DIR, 'incoming')
ARCHIVE_DIR = os.path.join(SYNC_DIR, 'archive')
LOCK_FILE = os.path.join(SYNC_DIR, 'sync.lock')
LOG_FILE = os.path.join(SYNC_DIR, 'sync.log')

# Firebird Docker 설정
FB_IMAGE = 'jacobalberty/firebird:2.5-ss'
FB_CONTAINER = 'gd-sync-firebird'
FB_NETWORK = 'dreaming-mech_app-network'

# 안전장치: 최소 데이터 건수 (이보다 적으면 덮어쓰기 방지)
MIN_RECORDS_THRESHOLD = 100

def log(msg):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{ts}] {msg}")

def check_lock():
    """다른 임포트가 실행 중인지 확인"""
    if os.path.exists(LOCK_FILE):
        # 30분 이상 된 lock은 무시 (비정상 종료)
        age = time.time() - os.path.getmtime(LOCK_FILE)
        if age < 1800:
            log("다른 임포트가 실행 중. 스킵.")
            return False
        log("오래된 lock 파일 발견. 제거하고 진행.")
    with open(LOCK_FILE, 'w') as f:
        f.write(str(os.getpid()))
    return True

def release_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)

def find_gdb():
    """incoming 폴더에서 GDB 파일 찾기"""
    for f in os.listdir(INCOMING_DIR):
        if f.upper().endswith('.GDB'):
            return os.path.join(INCOMING_DIR, f)
    return None

def start_firebird(gdb_path):
    """Firebird Docker 임시 실행"""
    subprocess.run(['docker', 'rm', '-f', FB_CONTAINER], capture_output=True)
    result = subprocess.run([
        'docker', 'run', '-d', '--name', FB_CONTAINER,
        '--network', FB_NETWORK,
        '-v', f'{gdb_path}:/data/TOTAL.GDB',
        FB_IMAGE
    ], capture_output=True, text=True)
    if result.returncode != 0:
        log(f"Firebird 시작 실패: {result.stderr}")
        return None
    time.sleep(5)  # Firebird 시작 대기
    # 비밀번호 확인
    logs = subprocess.run(['docker', 'logs', FB_CONTAINER], capture_output=True, text=True)
    pw_match = re.search(r"setting 'SYSDBA' password to '([^']+)'", logs.stdout + logs.stderr)
    return pw_match.group(1) if pw_match else 'masterkey'

def stop_firebird():
    subprocess.run(['docker', 'rm', '-f', FB_CONTAINER], capture_output=True)

def fb_list_query(password, sql):
    """Firebird SET LIST ON 쿼리 → dict 리스트"""
    full_sql = "SET LIST ON;\nSET COUNT OFF;\n" + sql
    cmd = ['docker', 'exec', '-i', FB_CONTAINER, '/usr/local/firebird/bin/isql',
           '/data/TOTAL.GDB', '-user', 'SYSDBA', '-password', password]
    result = subprocess.run(cmd, input=full_sql.encode('ascii'), capture_output=True)
    text = result.stdout.decode('euc-kr', errors='replace')

    records = []
    current = {}
    for line in text.split('\n'):
        line = line.rstrip()
        if not line and current:
            records.append(current)
            current = {}
            continue
        m = re.match(r'^(\w+)\s{2,}(.*)$', line)
        if m:
            key = m.group(1).strip()
            val = m.group(2).strip()
            current[key] = val if val != '<null>' else None
    if current:
        records.append(current)
    return records

def to_float(v):
    try:
        return float(v) if v else 0
    except:
        return 0

def get_pg_ip():
    """PostgreSQL Docker IP 확인"""
    result = subprocess.run(
        ['docker', 'inspect', '-f', '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}', 'dreaming-mech-postgres'],
        capture_output=True, text=True
    )
    return result.stdout.strip() or '172.18.0.4'

def run_import(password):
    """메인 임포트 로직"""
    pg_ip = get_pg_ip()
    pg = psycopg2.connect(
        host=pg_ip, port=5432,
        dbname='mechanic_db', user='migration_user', password='MigUser2026secure'
    )
    pg.autocommit = False
    cur = pg.cursor()

    log("=== 극동 데이터 동기화 시작 ===")
    count = 0  # 전체 카운트 초기화

    # 1. CUSTOMS (거래처)
    log("[1/4] CUSTOMS...")
    records = fb_list_query(password, "SELECT CODE, NAME, REP, TEL1, ADDRESS1, ENNO, UPTE, JONG FROM CUSTOMS;")
    log(f"  추출: {len(records)}건")
    if len(records) < MIN_RECORDS_THRESHOLD:
        log(f"  ⚠️ 거래처 {len(records)}건 — 최소 기준({MIN_RECORDS_THRESHOLD}건) 미달. 기존 데이터 유지.")
    else:
        cur.execute('DELETE FROM "GdSaleDetail";')
        cur.execute('DELETE FROM "GdCustomer";')
        count = 0
        for r in records:
            code = r.get('CODE', '').strip()
            if not code: continue
            cur.execute("""
                INSERT INTO "GdCustomer" (code, name, ceo, phone, address, "bizNumber", "bizType", "bizCategory", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, (
                code[:8],
                (r.get('NAME') or 'unknown')[:100].strip(),
                (r.get('REP') or '')[:50].strip() or None,
                (r.get('TEL1') or '')[:30].strip() or None,
                (r.get('ADDRESS1') or '')[:200].strip() or None,
                (r.get('ENNO') or '')[:20].strip() or None,
                (r.get('UPTE') or '')[:50].strip() or None,
                (r.get('JONG') or '')[:50].strip() or None,
            ))
            count += 1
        pg.commit()
        log(f"  입력: {count}건")

    # 2. ASCUST (차량/고객)
    log("[2/4] ASCUST...")
    records = fb_list_query(password, "SELECT CODE, NAME, REP, TEL1, ADDRESS1, CJONG, BJONG, COLOR, BAEGI, YDAY, CDAY FROM ASCUST;")
    log(f"  추출: {len(records)}건")
    if len(records) < MIN_RECORDS_THRESHOLD:
        log(f"  ⚠️ 차량 {len(records)}건 — 최소 기준({MIN_RECORDS_THRESHOLD}건) 미달. 기존 데이터 유지.")
    else:
        cur.execute('DELETE FROM "CustomerReminder";')
        cur.execute('DELETE FROM "GdRepair";')
        cur.execute('DELETE FROM "GdVehicle";')
        count = 0
        for r in records:
            code = r.get('CODE', '').strip()
            if not code: continue
            name_val = (r.get('NAME') or '').strip()
            rep_val = (r.get('REP') or '').strip()
            cur.execute("""
                INSERT INTO "GdVehicle" (code, "plateNumber", "ownerName", rep, phone, address, "carModel", "carModel2", color, displacement, "modelYear", "purchaseDate", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, (
                code[:8],
                name_val[:20] or None,
                rep_val[:100] or None,
                rep_val[:50] or None,
                (r.get('TEL1') or '')[:30].strip() or None,
                (r.get('ADDRESS1') or '')[:200].strip() or None,
                (r.get('CJONG') or '')[:50].strip() or None,
                (r.get('BJONG') or '')[:50].strip() or None,
                (r.get('COLOR') or '')[:20].strip() or None,
                (r.get('BAEGI') or '')[:20].strip() or None,
                (r.get('YDAY') or '')[:10].strip() or None,
                (r.get('CDAY') or '')[:10].strip() or None,
            ))
            count += 1
        pg.commit()
        log(f"  입력: {count}건")

    # 3. GOODS (상품)
    log("[3/4] GOODS...")
    records = fb_list_query(password, "SELECT CODE, NAME, XNAME, UNIT, COST_B, COST_S1, COST_S2, COST_S3, COST_S4, COST_S5, FIXP, JAEGO FROM GOODS;")
    log(f"  추출: {len(records)}건")
    if len(records) < MIN_RECORDS_THRESHOLD:
        log(f"  ⚠️ 상품 {len(records)}건 — 최소 기준({MIN_RECORDS_THRESHOLD}건) 미달. 기존 데이터 유지.")
    else:
        cur.execute('DELETE FROM "GdProduct";')
        count = 0
        for r in records:
            code = r.get('CODE', '').strip()
            if not code: continue
            cur.execute("""
                INSERT INTO "GdProduct" (code, name, "altName", unit, "costPrice", "sellPrice1", "sellPrice2", "sellPrice3", "sellPrice4", "sellPrice5", "fixedPrice", stock, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, (
                code[:13],
                (r.get('NAME') or 'unknown')[:100].strip(),
                (r.get('XNAME') or '')[:100].strip() or None,
                (r.get('UNIT') or '')[:10].strip() or None,
                to_float(r.get('COST_B')),
                to_float(r.get('COST_S1')),
                to_float(r.get('COST_S2')),
                to_float(r.get('COST_S3')),
                to_float(r.get('COST_S4')),
                to_float(r.get('COST_S5')),
                to_float(r.get('FIXP')),
                to_float(r.get('JAEGO')),
            ))
            count += 1
        pg.commit()
        log(f"  입력: {count}건")

    # 4. DATAS (매출전표/매입/수금) → GdSaleDetail에 저장
    # - IO=2 (출고/매출): 인센티브 자동계산 소스
    # - IO=1 (매입), productCode=]100000000001 (현금결제): 시재관리 출금 소스
    # - IO=3 (수금), CUST=Z7%(경비)/Z1000011~12(은행): 시재관리 출금 소스
    log("[4/5] DATAS (매출전표+현금매입+현금수금) → GdSaleDetail...")
    records = fb_list_query(password, "SELECT D.FNO, D.CUST, L.FDATE, D.GOOD, D.GOODNAME, D.UNIT, D.QTY, D.COST, D.AMOU, L.IO FROM DATAS D JOIN DATALIST L ON D.FNO = L.FNO WHERE L.IO = '2' OR (L.IO = '1' AND D.GOOD = ']100000000001') OR (L.IO = '3' AND (D.CUST LIKE 'Z7%' OR D.CUST IN ('Z1000011','Z1000012')));")
    log(f"  추출: {len(records)}건")
    if len(records) < MIN_RECORDS_THRESHOLD:
        log(f"  ⚠️ 매출전표 {len(records)}건 — 최소 기준({MIN_RECORDS_THRESHOLD}건) 미달. 기존 데이터 유지.")
    else:
        # GdCustomer 코드 조회 (FK 매칭용)
        cur.execute('SELECT code FROM "GdCustomer"')
        customer_codes = set(row[0] for row in cur.fetchall())
        # GdProduct 코드 조회 (FK 매칭용)
        cur.execute('SELECT code FROM "GdProduct"')
        product_codes = set(row[0] for row in cur.fetchall())

        # 회계 코드를 GdProduct에 추가 (없으면 INSERT)
        for acc_code, acc_name in [
            (']310000000001', '(회계)현금입금'),
            (']320000000001', '(회계)현금출금'),
        ]:
            if acc_code not in product_codes:
                cur.execute("""
                    INSERT INTO "GdProduct" (code, name, "costPrice", "sellPrice1", stock, "createdAt", "updatedAt")
                    VALUES (%s, %s, 0, 0, 0, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, (acc_code, acc_name))
                product_codes.add(acc_code)
                pg.commit()

        # 회계 코드를 GdProduct에 추가 (IO=3의 ]31/]32 코드)
        for acc_code, acc_name in [
            (']310000000001', '(회계)현금입금'),
            (']320000000001', '(회계)현금출금'),
        ]:
            if acc_code not in product_codes:
                cur.execute("""
                    INSERT INTO "GdProduct" (code, name, "costPrice", "sellPrice1", stock, "createdAt", "updatedAt")
                    VALUES (%s, %s, 0, 0, 0, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, (acc_code, acc_name))
                product_codes.add(acc_code)
                pg.commit()

        cur.execute('DELETE FROM "GdSaleDetail";')
        count = 0
        skip = 0
        batch = []
        for r in records:
            cust = (r.get('CUST') or '').strip()[:8]
            good = (r.get('GOOD') or '').strip()[:13]
            if not cust or not good:
                skip += 1
                continue
            # FK 없으면 스킵 (FK 제약 위반 방지)
            if cust not in customer_codes or good not in product_codes:
                skip += 1
                continue
            batch.append((
                (r.get('FNO') or '')[:10].strip() or None,
                (r.get('FDATE') or '')[:10].strip() or None,
                str(int(r.get('IO') or 2)),  # saleType: IO 값 (1=매입, 2=매출)
                cust,
                good,
                (r.get('GOODNAME') or '')[:100].strip() or None,
                to_float(r.get('QTY')),
                to_float(r.get('COST')),
                to_float(r.get('AMOU')),
            ))
            count += 1
            if len(batch) >= 1000:
                cur.executemany("""
                    INSERT INTO "GdSaleDetail" (fno, "saleDate", "saleType", "customerCode", "productCode", "productName", qty, "unitPrice", amount, "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, batch)
                pg.commit()
                batch = []
        if batch:
            cur.executemany("""
                INSERT INTO "GdSaleDetail" (fno, "saleDate", "saleType", "customerCode", "productCode", "productName", qty, "unitPrice", amount, "createdAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, batch)
            pg.commit()
        log(f"  입력: {count}건 (스킵: {skip}건)")

    # 5. ASDATA (작업일지) → GdRepair에 저장 (차량별 정비이력 소스)
    # ASDATA.CUST = ASCUST.CODE = GdVehicle.code → vehicleCode 정상 매칭
    log("[5/5] ASDATA (작업일지) → GdRepair...")
    records = fb_list_query(password, "SELECT FNO, CUST, FDATE, GOOD, GOODNAME, UNIT, QTY, COST, AMOU, KM FROM ASDATA;")
    log(f"  추출: {len(records)}건")
    if len(records) < MIN_RECORDS_THRESHOLD:
        log(f"  ⚠️ 작업일지 {len(records)}건 — 최소 기준({MIN_RECORDS_THRESHOLD}건) 미달. 기존 데이터 유지.")
    else:
        # GdVehicle 코드 조회 (ASDATA.CUST = ASCUST.CODE = GdVehicle.code)
        cur.execute('SELECT code FROM "GdVehicle"')
        vehicle_codes = set(row[0] for row in cur.fetchall())

        cur.execute('DELETE FROM "GdRepair";')
        count = 0
        skip = 0
        matched = 0
        batch = []
        for r in records:
            cust = (r.get('CUST') or '').strip()
            if not cust:
                skip += 1
                continue
            cust8 = cust[:8]
            # ASDATA.CUST는 ASCUST(GdVehicle) 코드 — 직접 매칭
            vehicle_code = cust8 if cust8 in vehicle_codes else None
            if vehicle_code:
                matched += 1
            batch.append((
                (r.get('FNO') or '')[:10].strip() or None,
                vehicle_code,         # vehicleCode (FK) — ASCUST 코드라 정상 매칭
                cust8,                # customerCode (원본 CUST)
                (r.get('FDATE') or '')[:10].strip() or None,
                (r.get('GOOD') or '')[:13].strip() or None,
                (r.get('GOODNAME') or '')[:100].strip() or None,
                (r.get('UNIT') or '')[:10].strip() or None,
                to_float(r.get('QTY')),
                to_float(r.get('COST')),
                to_float(r.get('AMOU')),
                to_float(r.get('KM')) if r.get('KM') else None,  # 주행거리 (KM)
            ))
            count += 1
            if len(batch) >= 1000:
                cur.executemany("""
                    INSERT INTO "GdRepair" (fno, "vehicleCode", "customerCode", "repairDate", "productCode", "productName", unit, qty, "unitPrice", amount, mileage, "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, batch)
                pg.commit()
                batch = []
        if batch:
            cur.executemany("""
                INSERT INTO "GdRepair" (fno, "vehicleCode", "customerCode", "repairDate", "productCode", "productName", unit, qty, "unitPrice", amount, mileage, "createdAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, batch)
            pg.commit()
        log(f"  입력: {count}건 (스킵: {skip}건, vehicleCode 매칭: {matched}건)")

    # SyncLog
    total_count = count if 'count' in dir() else 0
    cur.execute("""
        INSERT INTO "GdSyncLog" ("syncType", "tableName", "rowCount", status, "startedAt", "completedAt")
        VALUES ('auto_sync', 'ALL', %s, 'completed', NOW(), NOW())
    """, (total_count,))
    pg.commit()
    cur.close()
    pg.close()
    log("=== 동기화 완료 ===")
    return total_count

# ===== 인센티브 자동 계산 트리거 =====
def trigger_auto_calc():
    """GDB 동기화 완료 후 인센티브 자동 계산 API 호출"""
    import urllib.request
    import json
    try:
        url = 'http://localhost:3001/incentive/auto-calc/trigger'
        data = json.dumps({}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read().decode())
        log(f'인센티브 자동 계산 완료: 정비 {result.get("repairCount", 0)}건, 총매출 {result.get("totalRevenue", 0):,}원')
    except Exception as e:
        log(f'인센티브 자동 계산 트리거 실패 (무시): {e}')

def main():
    os.makedirs(INCOMING_DIR, exist_ok=True)
    os.makedirs(ARCHIVE_DIR, exist_ok=True)

    gdb_path = find_gdb()
    if not gdb_path:
        return  # 새 파일 없음 → 조용히 종료

    log(f"새 GDB 파일 발견: {gdb_path}")

    if not check_lock():
        return

    try:
        # Firebird 시작
        password = start_firebird(gdb_path)
        if not password:
            log("Firebird 시작 실패!")
            return

        # 임포트 실행
        count = run_import(password)

        # 완료 후 정리
        stop_firebird()

        if count > 0:
            archive_name = f"TOTAL_{datetime.now().strftime('%Y%m%d_%H%M%S')}.GDB"
            shutil.move(gdb_path, os.path.join(ARCHIVE_DIR, archive_name))
            log(f"GDB 보관: {archive_name}")
            trigger_auto_calc()
        else:
            log("⚠️ 데이터 0건 — GDB를 incoming에 유지 (다음 시도에서 재처리)")

        # 오래된 아카이브 정리 (7일)
        for f in os.listdir(ARCHIVE_DIR):
            fp = os.path.join(ARCHIVE_DIR, f)
            if os.path.isfile(fp) and time.time() - os.path.getmtime(fp) > 7 * 86400:
                os.remove(fp)
                log(f"오래된 아카이브 삭제: {f}")

    except Exception as e:
        log(f"오류 발생: {e}")
        stop_firebird()
    finally:
        release_lock()

if __name__ == '__main__':
    main()
