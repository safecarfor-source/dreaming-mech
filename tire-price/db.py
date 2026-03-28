"""
타이어 가격 비교 시스템 — DB 모듈
PostgreSQL(GdProduct)에서 타이어 상품+판매가 조회
"""
import subprocess
import os
import psycopg2
import re
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# 타이어 상품코드 프리픽스
TIRE_PREFIXES = ['TA', 'TH', 'TK', 'TM', 'TC', 'TP', 'TB', 'TL', 'TG', 'TZ']

# DB 설정 (.env에서 로드)
DB_NAME = os.getenv('TIRE_DB_NAME', 'mechanic_db')
DB_USER = os.getenv('TIRE_DB_USER', 'app_user')
DB_PASSWORD = os.getenv('TIRE_DB_PASSWORD', '')
DB_PORT = int(os.getenv('TIRE_DB_PORT', '5432'))
DB_HOST = os.getenv('TIRE_DB_HOST', 'auto')


def get_pg_ip():
    """PostgreSQL Docker 컨테이너 IP 자동 탐지"""
    if DB_HOST != 'auto':
        return DB_HOST

    try:
        result = subprocess.run(
            ['docker', 'inspect', '-f',
             '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}',
             'dreaming-mech-postgres'],
            capture_output=True, text=True, timeout=5
        )
        ip = result.stdout.strip()
        if ip:
            logger.info(f"PostgreSQL IP: {ip}")
            return ip
    except Exception as e:
        logger.warning(f"Docker inspect 실패: {e}")

    # 기본값
    return '172.18.0.4'


def get_connection():
    """PostgreSQL 연결"""
    pg_ip = get_pg_ip()
    return psycopg2.connect(
        host=pg_ip, port=DB_PORT,
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )


def extract_size_from_name(name):
    """상품명에서 타이어 사이즈 추출: '235/55R19 벤투스' -> '235/55R19'"""
    match = re.search(r'(\d{3}/\d{2}R\d{2})', name)
    return match.group(1) if match else None


def get_tire_products(sizes):
    """
    주어진 사이즈 목록에 해당하는 타이어 상품 조회

    Args:
        sizes: ['205/55R16', '235/55R19', ...]

    Returns:
        {
            '235/55R19': [
                {'code': 'TA23555190002', 'name': '235/55R19V RA43 다이나프로HPX', 'price': 175000},
                ...
            ]
        }
    """
    conn = get_connection()
    cur = conn.cursor()

    # 타이어 코드 프리픽스 정규식
    prefix_regex = '^(' + '|'.join(TIRE_PREFIXES) + ')'

    result = {}
    for size in sizes:
        # 사이즈에서 슬래시 제거하여 검색 (235/55R19 → 235/55%19 또는 235%55%19)
        like_pattern = f'%{size}%'

        cur.execute('''
            SELECT code, name, "sellPrice1"
            FROM "GdProduct"
            WHERE slot = 'A'
              AND code ~ %s
              AND name LIKE %s
              AND "sellPrice1" > 0
            ORDER BY name
        ''', (prefix_regex, like_pattern))

        rows = cur.fetchall()
        result[size] = [
            {
                'code': row[0],
                'name': row[1].strip() if row[1] else '',
                'price': int(row[2]) if row[2] else 0
            }
            for row in rows
        ]
        logger.info(f"  {size}: {len(rows)}개 상품 (sellPrice1 > 0)")

    cur.close()
    conn.close()
    return result


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    # 테스트
    products = get_tire_products(['235/55R19', '205/55R16'])
    for size, items in products.items():
        print(f"\n=== {size} ({len(items)}개) ===")
        for item in items:
            print(f"  {item['name']} → {item['price']:,}원")
