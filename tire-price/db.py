"""
타이어 가격 비교 시스템 — DB 모듈
PostgreSQL(GdProduct)에서 한국타이어 상품+판매가 조회
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

# 한국타이어 제품 키워드 (상품명 ILIKE 필터)
HANKOOK_KEYWORDS = ['한국', 'hankook', 'ventus', 'kinergy', 'dynapro']

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
            logger.info(f'PostgreSQL IP: {ip}')
            return ip
    except Exception as e:
        logger.warning(f'Docker inspect 실패: {e}')

    return '172.18.0.4'


def get_connection():
    """PostgreSQL 연결"""
    pg_ip = get_pg_ip()
    return psycopg2.connect(
        host=pg_ip, port=DB_PORT,
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )


def extract_size_from_name(name):
    """상품명에서 타이어 사이즈 추출"""
    match = re.search(r'(\d{3}/\d{2}R\d{2})', name)
    return match.group(1) if match else None


def get_tire_products(sizes):
    """
    주어진 사이즈 목록에서 한국타이어 상품 조회 (우리 매장 보유 제품만)
    """
    conn = get_connection()
    cur = conn.cursor()

    prefix_regex = '^(' + '|'.join(TIRE_PREFIXES) + ')'
    # 한국타이어 필터 — %% 는 psycopg2에서 리터럴 %로 처리됨
    hankook_parts = ["name ILIKE '%%" + kw + "%%'" for kw in HANKOOK_KEYWORDS]
    hankook_condition = ' OR '.join(hankook_parts)

    result = {}
    for size in sizes:
        like_pattern = '%' + size + '%'

        sql = (
            'SELECT code, name, "sellPrice1" '
            'FROM "GdProduct" '
            "WHERE slot = 'A' "
            'AND code ~ %s '
            'AND name LIKE %s '
            'AND "sellPrice1" > 0 '
            'AND (' + hankook_condition + ') '
            'ORDER BY name'
        )
        cur.execute(sql, (prefix_regex, like_pattern))

        rows = cur.fetchall()
        result[size] = [
            {
                'code': row[0],
                'name': row[1].strip() if row[1] else '',
                'price': int(row[2]) if row[2] else 0
            }
            for row in rows
        ]
        logger.info(f'  {size}: {len(rows)}개 상품 (한국타이어, sellPrice1 > 0)')

    cur.close()
    conn.close()
    return result


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    products = get_tire_products(['235/55R19', '205/55R16'])
    for size, items in products.items():
        print(f'\n=== {size} ({len(items)}개) ===')
        for item in items:
            print(f"  {item['name']} → {item['price']:,}원")
