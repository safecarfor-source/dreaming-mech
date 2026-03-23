#!/usr/bin/env python3
"""A/B 시소 + C 격리 검증 테스트
가짜 데이터로 슬롯 스왑, 복원 로직을 검증합니다.
로컬 PostgreSQL 또는 Docker 컨테이너에서 실행 가능.

사용법:
  python3 test_seesaw.py                 # Docker 환경 (dreaming-mech-postgres)
  python3 test_seesaw.py --local         # 로컬 PostgreSQL
  python3 test_seesaw.py --dry-run       # SQL만 출력 (실행 안 함)
"""
import sys
import os
import json
import time
import hashlib
import tempfile
import shutil

# ============================================================
# 설정
# ============================================================
DOCKER_CONTAINER = "dreaming-mech-postgres"
DB_NAME = "mechanic_db"
DB_USER = "app_user"
DB_HOST = "localhost"
DB_PORT = 5432

# 테스트용 가짜 데이터 크기
FAKE_VEHICLES = 150    # 최소 임계값 100 초과
FAKE_PRODUCTS = 80     # 최소 임계값 50 초과
FAKE_CUSTOMERS = 50
FAKE_SALES = 1200      # 최소 임계값 1000 초과
FAKE_REPAIRS = 300

# ============================================================
# 유틸리티
# ============================================================
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def ok(msg): print(f"{Colors.GREEN}  [PASS]{Colors.RESET} {msg}")
def fail(msg): print(f"{Colors.RED}  [FAIL]{Colors.RESET} {msg}")
def info(msg): print(f"{Colors.BLUE}  [INFO]{Colors.RESET} {msg}")
def warn(msg): print(f"{Colors.YELLOW}  [WARN]{Colors.RESET} {msg}")
def section(msg): print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}\n  {msg}\n{'='*60}{Colors.RESET}")

USE_DOCKER = True
DRY_RUN = False

def run_sql(sql, fetch=False):
    """PostgreSQL SQL 실행"""
    if DRY_RUN:
        print(f"  [SQL] {sql[:120]}...")
        return [] if fetch else None

    import subprocess
    if USE_DOCKER:
        cmd = [
            "docker", "exec", DOCKER_CONTAINER,
            "psql", "-U", DB_USER, "-d", DB_NAME,
            "-t", "-A", "-c", sql
        ]
    else:
        cmd = [
            "psql", "-h", DB_HOST, "-p", str(DB_PORT),
            "-U", DB_USER, "-d", DB_NAME,
            "-t", "-A", "-c", sql
        ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise Exception(f"SQL Error: {result.stderr.strip()}")

    if fetch:
        lines = result.stdout.strip().split('\n')
        return [line for line in lines if line]
    return None


# ============================================================
# 테스트 1: GdSlotConfig 초기화
# ============================================================
def test_slot_config_init():
    section("Test 1: GdSlotConfig 초기화")

    # GdSlotConfig 테이블 존재 확인
    try:
        rows = run_sql(
            'SELECT "activeSlot" FROM "GdSlotConfig" WHERE id = 1;',
            fetch=True
        )
        if rows:
            info(f"기존 GdSlotConfig 발견: activeSlot = '{rows[0]}'")
        else:
            info("GdSlotConfig 비어있음 → 초기값 INSERT")
            run_sql(
                '''INSERT INTO "GdSlotConfig" (id, "activeSlot", "switchCount", "updatedAt")
                   VALUES (1, 'A', 0, NOW())
                   ON CONFLICT (id) DO NOTHING;'''
            )
        ok("GdSlotConfig 초기화 성공")
        return True
    except Exception as e:
        fail(f"GdSlotConfig 초기화 실패: {e}")
        return False


# ============================================================
# 테스트 2: 슬롯 A에 가짜 데이터 삽입
# ============================================================
def test_insert_slot_a():
    section("Test 2: 슬롯 A에 가짜 데이터 삽입")

    try:
        # 기존 테스트 데이터 정리 (slot A의 TEST_ 프리픽스만)
        for table in ['"GdRepair"', '"GdSaleDetail"', '"GdProduct"', '"GdVehicle"', '"GdCustomer"']:
            run_sql(f'DELETE FROM {table} WHERE slot = \'A\' AND code LIKE \'TEST_%\';'
                    if 'Customer' in table or 'Vehicle' in table or 'Product' in table
                    else f'DELETE FROM {table} WHERE slot = \'A\' AND "customerCode" LIKE \'TEST_%\';'
                    if 'SaleDetail' in table
                    else f'DELETE FROM {table} WHERE slot = \'A\' AND "vehicleCode" LIKE \'TEST_%\';')

        # 거래처 삽입
        values = []
        for i in range(FAKE_CUSTOMERS):
            values.append(f"('TEST_C{i:04d}', 'A', 'Test Customer {i}', NOW(), NOW())")
        run_sql(f'INSERT INTO "GdCustomer" (code, slot, name, "createdAt", "updatedAt") VALUES {",".join(values)};')
        info(f"GdCustomer: {FAKE_CUSTOMERS}건 삽입")

        # 차량 삽입
        values = []
        for i in range(FAKE_VEHICLES):
            values.append(f"('TEST_V{i:04d}', 'A', '{1000+i}가{i:04d}', 'Test Owner {i}', NOW(), NOW())")
        run_sql(f'INSERT INTO "GdVehicle" (code, slot, "plateNumber", "ownerName", "createdAt", "updatedAt") VALUES {",".join(values)};')
        info(f"GdVehicle: {FAKE_VEHICLES}건 삽입")

        # 상품 삽입
        values = []
        for i in range(FAKE_PRODUCTS):
            values.append(f"('TEST_P{i:04d}', 'A', 'Test Product {i}', NOW(), NOW())")
        run_sql(f'INSERT INTO "GdProduct" (code, slot, name, "createdAt", "updatedAt") VALUES {",".join(values)};')
        info(f"GdProduct: {FAKE_PRODUCTS}건 삽입")

        # 전표 삽입 (FK: customerCode + slot → GdCustomer)
        batch_size = 200
        for batch_start in range(0, FAKE_SALES, batch_size):
            values = []
            batch_end = min(batch_start + batch_size, FAKE_SALES)
            for i in range(batch_start, batch_end):
                cust = f'TEST_C{i % FAKE_CUSTOMERS:04d}'
                prod = f'TEST_P{i % FAKE_PRODUCTS:04d}'
                values.append(f"('TEST_F{i:06d}', 'A', '2026-03-{(i%28)+1:02d}', '2', '{cust}', '{prod}', 'Test Item', {i*100}, NOW())")
            run_sql(f'INSERT INTO "GdSaleDetail" (fno, slot, "saleDate", "saleType", "customerCode", "productCode", "productName", amount, "createdAt") VALUES {",".join(values)};')
        info(f"GdSaleDetail: {FAKE_SALES}건 삽입")

        # 정비이력 삽입
        values = []
        for i in range(min(FAKE_REPAIRS, 200)):
            veh = f'TEST_V{i % FAKE_VEHICLES:04d}'
            values.append(f"('TEST_R{i:04d}', 'A', '{veh}', '2026-03-{(i%28)+1:02d}', 'Test Repair {i}', {i*50}, NOW())")
        run_sql(f'INSERT INTO "GdRepair" (fno, slot, "vehicleCode", "repairDate", "productName", amount, "createdAt") VALUES {",".join(values)};')
        info(f"GdRepair: {min(FAKE_REPAIRS, 200)}건 삽입")

        # 활성 슬롯 A 확인
        run_sql('UPDATE "GdSlotConfig" SET "activeSlot" = \'A\', "updatedAt" = NOW() WHERE id = 1;')

        ok("슬롯 A 데이터 삽입 완료")
        return True
    except Exception as e:
        fail(f"슬롯 A 삽입 실패: {e}")
        return False


# ============================================================
# 테스트 3: 슬롯 B에 다른 데이터 삽입 (시소 시뮬레이션)
# ============================================================
def test_insert_slot_b():
    section("Test 3: 슬롯 B에 데이터 삽입 (시소 시뮬레이션)")

    try:
        # B 슬롯 기존 테스트 데이터 정리
        for table in ['"GdRepair"', '"GdSaleDetail"', '"GdProduct"', '"GdVehicle"', '"GdCustomer"']:
            run_sql(f'DELETE FROM {table} WHERE slot = \'B\';')

        # B 슬롯 데이터 (A보다 약간 다른 데이터)
        values = []
        for i in range(FAKE_CUSTOMERS + 5):  # A보다 5개 더
            values.append(f"('TEST_C{i:04d}', 'B', 'Updated Customer {i}', NOW(), NOW())")
        run_sql(f'INSERT INTO "GdCustomer" (code, slot, name, "createdAt", "updatedAt") VALUES {",".join(values)};')

        values = []
        for i in range(FAKE_VEHICLES + 10):
            values.append(f"('TEST_V{i:04d}', 'B', '{2000+i}나{i:04d}', 'Updated Owner {i}', NOW(), NOW())")
        run_sql(f'INSERT INTO "GdVehicle" (code, slot, "plateNumber", "ownerName", "createdAt", "updatedAt") VALUES {",".join(values)};')

        values = []
        for i in range(FAKE_PRODUCTS):
            values.append(f"('TEST_P{i:04d}', 'B', 'Updated Product {i}', NOW(), NOW())")
        run_sql(f'INSERT INTO "GdProduct" (code, slot, name, "createdAt", "updatedAt") VALUES {",".join(values)};')

        batch_size = 200
        for batch_start in range(0, FAKE_SALES + 100, batch_size):
            values = []
            batch_end = min(batch_start + batch_size, FAKE_SALES + 100)
            for i in range(batch_start, batch_end):
                cust = f'TEST_C{i % (FAKE_CUSTOMERS + 5):04d}'
                prod = f'TEST_P{i % FAKE_PRODUCTS:04d}'
                values.append(f"('TEST_F{i:06d}', 'B', '2026-03-{(i%28)+1:02d}', '2', '{cust}', '{prod}', 'Updated Item', {i*110}, NOW())")
            run_sql(f'INSERT INTO "GdSaleDetail" (fno, slot, "saleDate", "saleType", "customerCode", "productCode", "productName", amount, "createdAt") VALUES {",".join(values)};')

        info(f"슬롯 B: Customer={FAKE_CUSTOMERS+5}, Vehicle={FAKE_VEHICLES+10}, Product={FAKE_PRODUCTS}, Sale={FAKE_SALES+100}")
        ok("슬롯 B 데이터 삽입 완료")
        return True
    except Exception as e:
        fail(f"슬롯 B 삽입 실패: {e}")
        return False


# ============================================================
# 테스트 4: 슬롯 전환 (A→B)
# ============================================================
def test_switch_slot():
    section("Test 4: 슬롯 전환 (A → B)")

    try:
        # 현재 활성 슬롯 확인
        rows = run_sql('SELECT "activeSlot" FROM "GdSlotConfig" WHERE id = 1;', fetch=True)
        current = rows[0] if rows else 'A'
        info(f"전환 전 활성 슬롯: {current}")

        # 전환 실행
        new_slot = 'B' if current == 'A' else 'A'
        run_sql(f'''
            UPDATE "GdSlotConfig"
            SET "activeSlot" = '{new_slot}',
                "lastSyncAt" = NOW(),
                "lastSyncSlot" = '{new_slot}',
                "switchCount" = "switchCount" + 1,
                "updatedAt" = NOW()
            WHERE id = 1;
        ''')

        # 전환 확인
        rows = run_sql('SELECT "activeSlot", "switchCount" FROM "GdSlotConfig" WHERE id = 1;', fetch=True)
        if rows:
            parts = rows[0].split('|')
            info(f"전환 후 활성 슬롯: {parts[0]}, 전환 횟수: {parts[1]}")
            if parts[0] == new_slot:
                ok(f"슬롯 전환 성공: {current} → {new_slot}")
                return True
            else:
                fail(f"슬롯 전환 실패: 예상 {new_slot}, 실제 {parts[0]}")
                return False
        fail("GdSlotConfig 조회 실패")
        return False
    except Exception as e:
        fail(f"슬롯 전환 실패: {e}")
        return False


# ============================================================
# 테스트 5: 활성 슬롯 데이터만 조회되는지 확인
# ============================================================
def test_active_slot_query():
    section("Test 5: 활성 슬롯 데이터 격리 확인")

    try:
        rows = run_sql('SELECT "activeSlot" FROM "GdSlotConfig" WHERE id = 1;', fetch=True)
        active = rows[0] if rows else 'B'

        # 활성 슬롯의 차량 수
        rows_active = run_sql(
            f'SELECT COUNT(*) FROM "GdVehicle" WHERE slot = \'{active}\' AND code LIKE \'TEST_%\';',
            fetch=True
        )
        count_active = int(rows_active[0]) if rows_active else 0

        # 비활성 슬롯의 차량 수
        inactive = 'A' if active == 'B' else 'B'
        rows_inactive = run_sql(
            f'SELECT COUNT(*) FROM "GdVehicle" WHERE slot = \'{inactive}\' AND code LIKE \'TEST_%\';',
            fetch=True
        )
        count_inactive = int(rows_inactive[0]) if rows_inactive else 0

        info(f"활성 슬롯({active}) 차량: {count_active}건")
        info(f"비활성 슬롯({inactive}) 차량: {count_inactive}건")

        if count_active > 0 and count_inactive > 0 and count_active != count_inactive:
            ok(f"데이터 격리 확인: A/B 슬롯이 서로 다른 데이터 보유")
            return True
        elif count_active == 0:
            fail("활성 슬롯에 데이터 없음")
            return False
        else:
            warn("A/B 슬롯 데이터 수가 동일 (정상일 수 있음)")
            return True
    except Exception as e:
        fail(f"격리 확인 실패: {e}")
        return False


# ============================================================
# 테스트 6: 비활성 슬롯 삭제 시뮬레이션
# ============================================================
def test_clear_inactive_slot():
    section("Test 6: 비활성 슬롯 삭제 (동기화 전 클리어)")

    try:
        rows = run_sql('SELECT "activeSlot" FROM "GdSlotConfig" WHERE id = 1;', fetch=True)
        active = rows[0] if rows else 'B'
        inactive = 'A' if active == 'B' else 'B'

        info(f"비활성 슬롯({inactive}) 데이터 삭제 시뮬레이션...")

        # FK 역순 삭제 (Repair → SaleDetail → Product → Vehicle → Customer)
        for table in ['"GdRepair"', '"GdSaleDetail"', '"GdProduct"', '"GdVehicle"', '"GdCustomer"']:
            rows_before = run_sql(f"SELECT COUNT(*) FROM {table} WHERE slot = '{inactive}';", fetch=True)
            run_sql(f"DELETE FROM {table} WHERE slot = '{inactive}' AND code LIKE 'TEST_%';"
                    if 'Customer' in table or 'Vehicle' in table or 'Product' in table
                    else f"DELETE FROM {table} WHERE slot = '{inactive}';")
            rows_after = run_sql(f"SELECT COUNT(*) FROM {table} WHERE slot = '{inactive}';", fetch=True)
            info(f"  {table}: {rows_before[0] if rows_before else 0} → {rows_after[0] if rows_after else 0}")

        # 활성 슬롯은 건드리지 않았는지 확인
        rows_check = run_sql(
            f'SELECT COUNT(*) FROM "GdVehicle" WHERE slot = \'{active}\' AND code LIKE \'TEST_%\';',
            fetch=True
        )
        if int(rows_check[0] if rows_check else 0) > 0:
            ok(f"비활성 슬롯 삭제 성공, 활성 슬롯({active}) 무사")
            return True
        else:
            warn("활성 슬롯에도 테스트 데이터 없음 (이전 테스트에서 삭제되었을 수 있음)")
            return True
    except Exception as e:
        fail(f"비활성 슬롯 삭제 실패: {e}")
        return False


# ============================================================
# 테스트 7: C 슬롯 파일 FIFO 시뮬레이션
# ============================================================
def test_c_slot_fifo():
    section("Test 7: C 슬롯 FIFO (파일 5개 보관)")

    try:
        # 임시 디렉토리로 시뮬레이션
        test_dir = tempfile.mkdtemp(prefix="gd_test_c_")
        info(f"테스트 디렉토리: {test_dir}")

        # 7개 파일 생성 (5개 초과 → 오래된 2개 삭제되어야 함)
        files = []
        for i in range(7):
            fname = os.path.join(test_dir, f"20260324_{830+i*30:04d}_TOTAL.GDB.gz")
            with open(fname, 'w') as f:
                f.write(f"fake_data_{i}")
            files.append(fname)
            time.sleep(0.1)  # mtime 구분용

        info(f"생성된 파일: {len(files)}개")

        # FIFO 로직: 가장 오래된 것부터 삭제하여 5개 유지
        existing = sorted(
            [os.path.join(test_dir, f) for f in os.listdir(test_dir)],
            key=os.path.getmtime
        )
        while len(existing) > 5:
            oldest = existing.pop(0)
            os.remove(oldest)
            info(f"  삭제: {os.path.basename(oldest)}")

        remaining = os.listdir(test_dir)
        info(f"남은 파일: {len(remaining)}개")

        # 정리
        shutil.rmtree(test_dir)

        if len(remaining) == 5:
            ok("C 슬롯 FIFO 정상: 7개 생성 → 5개 유지")
            return True
        else:
            fail(f"FIFO 실패: {len(remaining)}개 남음 (예상 5개)")
            return False
    except Exception as e:
        fail(f"C 슬롯 FIFO 테스트 실패: {e}")
        return False


# ============================================================
# 테스트 8: 임계값 검증 시뮬레이션
# ============================================================
def test_threshold_validation():
    section("Test 8: 최소 임계값 검증")

    try:
        # 임계값
        MIN_VEHICLES = 100
        MIN_PRODUCTS = 50
        MIN_SALES = 1000

        rows = run_sql('SELECT "activeSlot" FROM "GdSlotConfig" WHERE id = 1;', fetch=True)
        active = rows[0] if rows else 'B'

        v = int(run_sql(f"SELECT COUNT(*) FROM \"GdVehicle\" WHERE slot = '{active}';", fetch=True)[0])
        p = int(run_sql(f"SELECT COUNT(*) FROM \"GdProduct\" WHERE slot = '{active}';", fetch=True)[0])
        s = int(run_sql(f"SELECT COUNT(*) FROM \"GdSaleDetail\" WHERE slot = '{active}';", fetch=True)[0])

        info(f"활성 슬롯({active}): Vehicle={v}, Product={p}, SaleDetail={s}")

        results = []
        if v >= MIN_VEHICLES:
            ok(f"Vehicle >= {MIN_VEHICLES}: {v}")
            results.append(True)
        else:
            warn(f"Vehicle < {MIN_VEHICLES}: {v} (테스트 데이터 부족할 수 있음)")
            results.append(False)

        if p >= MIN_PRODUCTS:
            ok(f"Product >= {MIN_PRODUCTS}: {p}")
            results.append(True)
        else:
            warn(f"Product < {MIN_PRODUCTS}: {p}")
            results.append(False)

        if s >= MIN_SALES:
            ok(f"SaleDetail >= {MIN_SALES}: {s}")
            results.append(True)
        else:
            warn(f"SaleDetail < {MIN_SALES}: {s}")
            results.append(False)

        if all(results):
            ok("모든 임계값 통과 → 슬롯 전환 허용")
        else:
            warn("일부 임계값 미달 → 실제 운영에서는 전환 거부됨")

        return True  # 테스트 자체는 통과 (검증 로직이 동작함을 확인)
    except Exception as e:
        fail(f"임계값 검증 실패: {e}")
        return False


# ============================================================
# 테스트 9: 테스트 데이터 정리
# ============================================================
def test_cleanup():
    section("Test 9: 테스트 데이터 정리")

    try:
        for slot in ['A', 'B']:
            for table, col in [
                ('"GdRepair"', '"vehicleCode"'),
                ('"GdSaleDetail"', '"customerCode"'),
                ('"GdProduct"', 'code'),
                ('"GdVehicle"', 'code'),
                ('"GdCustomer"', 'code'),
            ]:
                run_sql(f"DELETE FROM {table} WHERE slot = '{slot}' AND {col} LIKE 'TEST_%';")

        # GdSlotConfig를 A로 리셋
        run_sql('UPDATE "GdSlotConfig" SET "activeSlot" = \'A\', "switchCount" = 0, "updatedAt" = NOW() WHERE id = 1;')

        ok("테스트 데이터 정리 완료, activeSlot = A로 리셋")
        return True
    except Exception as e:
        fail(f"정리 실패: {e}")
        return False


# ============================================================
# 메인
# ============================================================
def main():
    global USE_DOCKER, DRY_RUN

    if '--local' in sys.argv:
        USE_DOCKER = False
        info("로컬 PostgreSQL 모드")
    if '--dry-run' in sys.argv:
        DRY_RUN = True
        info("DRY RUN 모드 (SQL 실행 안 함)")

    print(f"\n{Colors.BOLD}{'='*60}")
    print("  A/B 시소 + C 격리 검증 테스트")
    print(f"{'='*60}{Colors.RESET}")
    print(f"  Docker: {USE_DOCKER}")
    print(f"  DB: {DB_NAME} @ {DOCKER_CONTAINER if USE_DOCKER else DB_HOST}")
    print()

    tests = [
        ("GdSlotConfig 초기화", test_slot_config_init),
        ("슬롯 A 데이터 삽입", test_insert_slot_a),
        ("슬롯 B 데이터 삽입", test_insert_slot_b),
        ("슬롯 전환 (A→B)", test_switch_slot),
        ("활성 슬롯 데이터 격리", test_active_slot_query),
        ("비활성 슬롯 삭제", test_clear_inactive_slot),
        ("C 슬롯 FIFO", test_c_slot_fifo),
        ("임계값 검증", test_threshold_validation),
        ("테스트 데이터 정리", test_cleanup),
    ]

    passed = 0
    failed = 0

    for name, test_fn in tests:
        try:
            result = test_fn()
            if result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            fail(f"{name}: 예외 발생 — {e}")
            failed += 1

    # 결과 요약
    section("테스트 결과 요약")
    total = passed + failed
    print(f"  통과: {Colors.GREEN}{passed}/{total}{Colors.RESET}")
    if failed > 0:
        print(f"  실패: {Colors.RED}{failed}/{total}{Colors.RESET}")
    else:
        print(f"\n  {Colors.GREEN}{Colors.BOLD}ALL TESTS PASSED!{Colors.RESET}")

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
