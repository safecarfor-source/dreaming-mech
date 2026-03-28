"""
타이어사랑 (tirelove.kr) 크롤러
서버사이드 렌더링 → requests + BeautifulSoup
URL: http://www.tirelove.kr/tire_result.php?scar_w=235&scar_h=55&scar_i=19&sch_flag=1

HTML 구조 (2026-03-27 확인):
- ul.list2 > li: 각 상품
- h5 > a: "[브랜드]상품명 - 시즌" (예: [금호타이어]SOLUS TA21 - 올시즌)
- input[name=tr_card]: 가격 hidden field (예: value="87000")
- p.list2size: 사이즈 정보 (예: 205 / 55R 16 91H)
"""
import requests
from bs4 import BeautifulSoup
import re
import logging
from .base import BaseCrawler

logger = logging.getLogger(__name__)


class TireLoveCrawler(BaseCrawler):
    name = "타이어사랑"
    base_url = "http://www.tirelove.kr/tire_result.php"

    def crawl(self, size):
        width, ratio, inch = self.parse_size(size)

        url = f"{self.base_url}?scar_w={width}&scar_h={ratio}&scar_i={inch}&sch_flag=1"
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

        # ul.list2 > li 에서 상품 추출
        items = soup.select('ul.list2 > li')
        for item in items:
            # 가격: hidden input이 가장 안정적
            price_input = item.select_one('input[name="tr_card"]')
            if not price_input:
                continue

            price = self.clean_price(price_input.get('value', '0'))
            if price == 0:
                continue

            # 상품명: h5 > a 텍스트
            name_el = item.select_one('h5 > a')
            if not name_el:
                continue

            raw_name = name_el.get_text(strip=True)

            # "[금호타이어]SOLUS TA21 - 올시즌" → "금호타이어 SOLUS TA21"
            name_match = re.match(
                r'\[([^\]]+)\](.+?)(?:\s*-\s*(?:올시즌|썸머|겨울|올웨더|전천후|전기차|산악|화물))?$',
                raw_name
            )
            if name_match:
                brand = name_match.group(1).strip()
                product = name_match.group(2).strip()
                name = f"{brand} {product}"
            else:
                name = raw_name

            products.append({
                'name': self.clean_name(name),
                'price': price,
            })

        logger.info(f"[{self.name}] {size}: {len(products)}개 상품")
        return products
