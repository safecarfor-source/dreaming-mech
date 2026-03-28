#!/usr/bin/env python3
"""
타이어 가격 비교 시스템 — 메인 실행 파일
EC2 서버에서 cron으로 매일 실행
"""
import logging
import sys
import json
import os
from datetime import datetime

# 로깅 설정
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, 'tire-price.log'), encoding='utf-8'),
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger(__name__)


DEFAULT_SIZES = [
    '205/55R16',
    '235/55R19',
    '235/60R18',
    '245/40R19',
    '275/35R19',
    '245/45R19',
    '270/40R19',
    '245/45R18',
    '215/55R17',
    '225/55R17',
    '195/65R15',
]


def load_sizes():
    """
    크롤링할 사이즈 목록 로드
    1순위: Google Sheets [설정] 탭 → 2순위: 하드코딩 기본 목록
    """
    try:
        from sheets import read_sizes
        sheet_sizes = read_sizes()
        if sheet_sizes:
            logger.info(f"Google Sheets에서 사이즈 {len(sheet_sizes)}개 로드")
            return sheet_sizes
    except Exception as e:
        logger.warning(f"Google Sheets 사이즈 로드 실패 (기본 목록 사용): {e}")

    return DEFAULT_SIZES


def run():
    """메인 실행"""
    start = datetime.now()
    logger.info("=" * 60)
    logger.info(f"타이어 가격 비교 시작: {start.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)

    # 1. 사이즈 목록
    sizes = load_sizes()
    logger.info(f"대상 사이즈: {sizes}")

    # 2. 우리 DB 조회
    logger.info("\n[1/4] 우리 DB 조회 중...")
    from db import get_tire_products
    our_products = get_tire_products(sizes)
    total_our = sum(len(v) for v in our_products.values())
    logger.info(f"  우리 상품: {total_our}개")

    # 3. 크롤링
    from crawlers.tsautovalley import TsAutoValleyCrawler
    from crawlers.tstation import TStationCrawler
    from crawlers.tirelove import TireLoveCrawler
    from crawlers.tirezzang import TireZzangCrawler

    crawlers = [
        TsAutoValleyCrawler(),
        TStationCrawler(),
        TireLoveCrawler(),
        TireZzangCrawler(),
    ]

    all_competitors = {}
    for crawler in crawlers:
        logger.info(f"\n[크롤링] {crawler.name}...")
        try:
            results = crawler.crawl_all(sizes)
            all_competitors[crawler.name] = results
            total = sum(len(v) for v in results.values())
            logger.info(f"  {crawler.name}: 총 {total}개 상품")
        except Exception as e:
            logger.error(f"  {crawler.name} 전체 실패: {e}")
            all_competitors[crawler.name] = {s: [] for s in sizes}

    # 4. 매칭 및 비교표 생성
    logger.info("\n[매칭] 상품 매칭 중...")
    from matcher import build_comparison_table
    rows, site_names = build_comparison_table(our_products, all_competitors)
    logger.info(f"  비교표: {len(rows)}행 × {len(site_names)}개 사이트")

    # 5. 결과 출력 (콘솔)
    logger.info("\n" + "=" * 80)
    logger.info("비교 결과")
    logger.info("=" * 80)

    header = f"{'사이즈':<12} {'상품':<20} {'우리':>8}"
    for site in site_names:
        header += f" {site:>10}"
    logger.info(header)
    logger.info("-" * 80)

    for row in rows:
        line = f"{row['size']:<12} {row['product']:<20} {row['our_price']:>8,}"
        for site in site_names:
            price = row.get(site)
            if price is None:
                line += f" {'   -':>10}"
            else:
                marker = " 🔴" if row['our_price'] > 0 and price < row['our_price'] else "   "
                line += f" {price:>7,}{marker}"
        logger.info(line)

    # 6. JSON 백업 저장
    backup_path = os.path.join(LOG_DIR, f"result_{start.strftime('%Y%m%d_%H%M%S')}.json")
    backup_data = {
        'timestamp': start.isoformat(),
        'sizes': sizes,
        'our_products': {k: v for k, v in our_products.items()},
        'competitors': {
            site: {size: items for size, items in data.items()}
            for site, data in all_competitors.items()
        },
        'comparison': rows,
    }
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)
    logger.info(f"\n결과 백업: {backup_path}")

    # 7. Google Sheets 업데이트
    try:
        from sheets import write_results, append_history
        logger.info("\n[Google Sheets] 비교표 업데이트 중...")
        write_results(rows, site_names)
        logger.info("[Google Sheets] 비교표 업데이트 완료!")

        logger.info("[Google Sheets] 이력 저장 중...")
        append_history(rows, site_names)
        logger.info("[Google Sheets] 이력 저장 완료!")
    except Exception as e:
        logger.error(f"[Google Sheets] 업데이트 실패 (JSON 백업은 저장됨): {e}")

    elapsed = (datetime.now() - start).total_seconds()
    logger.info(f"\n완료! 소요시간: {elapsed:.1f}초")


if __name__ == '__main__':
    run()
