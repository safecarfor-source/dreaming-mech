"""
타이어짱 (tirezzang.co.kr) 크롤러
POST 방식 → requests + BeautifulSoup
URL: http://tirezzang.co.kr/product/tire/sizelist.aspx

HTML 구조 (2026-03-27 확인):
- POST form: find_ftsize=2055516 (너비+편평비+인치 연결)
- 전체 상품이 하나의 table 안에 있음
- 브랜드: span[style*="color:#000;font-weight:700"] (21개 = 상품 수)
- 상품명: span[style*="color:#0066CC;font-weight:700"] (21개 = 상품 수)
- 할인가: font[color="#CC3300"] > b (42개 = 짝수idx=1본, 홀수idx=4본)
"""
import requests
from bs4 import BeautifulSoup
import re
import logging
from .base import BaseCrawler

logger = logging.getLogger(__name__)


class TireZzangCrawler(BaseCrawler):
    name = "타이어짱"
    base_url = "http://tirezzang.co.kr/product/tire/sizelist.aspx"

    def crawl(self, size):
        width, ratio, inch = self.parse_size(size)
        size_code = f"{width}{ratio}{inch}"

        data = {
            'find_ftsize': size_code,
            'find_rtsize': '',
            'seltireg': 'all',
            'spage': '1',
            'lpage': '1',
            'findfristchk': 'pagereset',
        }

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        response = requests.post(self.base_url, data=data, headers=headers, timeout=15)
        response.encoding = 'utf-8'

        if response.status_code != 200:
            logger.error(f"HTTP {response.status_code}: {self.base_url}")
            return []

        soup = BeautifulSoup(response.text, 'lxml')
        products = []

        # 병렬 리스트 방식: 브랜드/상품명/가격을 각각 수집 후 인덱스로 매칭
        brand_spans = soup.find_all('span', style=re.compile(r'color:#000.*font-weight'))
        name_spans = soup.find_all('span', style=re.compile(r'color:#0066CC.*font-weight'))

        # 가격: CC3300 > b (짝수=1본 가격, 홀수=4본 가격)
        cc_fonts = soup.find_all('font', color=re.compile(r'CC3300'))
        all_prices = []
        for f in cc_fonts:
            b = f.find('b')
            if b:
                price_text = b.get_text(strip=True)
                if re.search(r'[\d,]+', price_text):
                    all_prices.append(self.clean_price(price_text))

        # 1본 가격만 추출 (짝수 인덱스)
        single_prices = [all_prices[i] for i in range(0, len(all_prices), 2)]

        count = min(len(brand_spans), len(name_spans), len(single_prices))

        for i in range(count):
            brand = brand_spans[i].get_text(strip=True)
            product_name = name_spans[i].get_text(strip=True)
            price = single_prices[i]

            if price == 0:
                continue

            full_name = f"{brand} {product_name}".strip()
            products.append({
                'name': self.clean_name(full_name),
                'price': price,
            })

        logger.info(f"[{self.name}] {size}: {len(products)}개 상품")
        return products
