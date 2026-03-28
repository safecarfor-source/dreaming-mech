"""
남동공단점 (tsautovalley.com) 크롤러
서버사이드 렌더링 → requests + BeautifulSoup
"""
import requests
from bs4 import BeautifulSoup
import logging
from .base import BaseCrawler

logger = logging.getLogger(__name__)


class TsAutoValleyCrawler(BaseCrawler):
    name = "남동공단점"
    base_url = "http://tsautovalley.com/tire/search.html"

    def crawl(self, size):
        width, ratio, inch = self.parse_size(size)

        url = f"{self.base_url}?sWidth={width}&sRatio={ratio}&sInch={inch}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'

        if response.status_code != 200:
            logger.error(f"HTTP {response.status_code}: {url}")
            return []

        soup = BeautifulSoup(response.text, 'lxml')
        products = []

        # 상품 목록은 <li> 안에 <h4>제목 + 가격
        items = soup.select('ul li')
        for item in items:
            # 제목 (h4 태그)
            title_el = item.select_one('h4')
            if not title_el:
                continue

            name = self.clean_name(title_el.get_text())

            # 사이즈가 포함된 상품만
            if size[:3] not in name:
                continue

            # 가격 추출 (숫자+원 패턴)
            text = item.get_text()
            import re
            price_match = re.search(r'([\d,]+)\s*원', text)
            if not price_match:
                continue

            price = self.clean_price(price_match.group(1))

            # 0원은 재고 없음 → 제외
            if price == 0:
                continue

            products.append({
                'name': name,
                'price': price,
            })

        logger.info(f"[{self.name}] {size}: {len(products)}개 상품 (가격 > 0)")
        return products
