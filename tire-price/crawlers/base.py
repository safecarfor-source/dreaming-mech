"""
크롤러 공통 베이스 클래스
"""
import re
import time
import logging
import random

logger = logging.getLogger(__name__)


class BaseCrawler:
    name = "base"
    base_url = ""

    def parse_size(self, size):
        """'235/55R19' -> (width=235, ratio=55, inch=19)"""
        match = re.match(r'(\d{3})/(\d{2})R(\d{2})', size)
        if not match:
            raise ValueError(f"잘못된 사이즈 형식: {size}")
        return int(match.group(1)), int(match.group(2)), int(match.group(3))

    def crawl(self, size):
        """
        사이즈별 크롤링. 하위 클래스에서 구현.

        Returns:
            [{'name': '한국 벤투스 S2 AS', 'price': 170000}, ...]
        """
        raise NotImplementedError

    def crawl_all(self, sizes):
        """여러 사이즈 순차 크롤링"""
        results = {}
        for size in sizes:
            try:
                logger.info(f"[{self.name}] {size} 크롤링 시작...")
                items = self.crawl(size)
                results[size] = items
                logger.info(f"[{self.name}] {size}: {len(items)}개 상품")
                # 서버 부담 방지: 1~3초 랜덤 대기
                time.sleep(random.uniform(1, 3))
            except Exception as e:
                logger.error(f"[{self.name}] {size} 크롤링 실패: {e}")
                results[size] = []
        return results

    def clean_price(self, price_text):
        """가격 문자열 정리: '118,300원' -> 118300"""
        if not price_text:
            return 0
        cleaned = re.sub(r'[^\d]', '', str(price_text))
        return int(cleaned) if cleaned else 0

    def clean_name(self, name):
        """상품명 정리: 앞뒤 공백 제거"""
        if not name:
            return ''
        return re.sub(r'\s+', ' ', name.strip())
