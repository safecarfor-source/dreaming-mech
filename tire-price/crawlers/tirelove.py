"""
타이어사랑 (tirelove.kr) 크롤러
requests 시도 → 실패 시 Playwright 폴백 (봇 차단 우회)
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

        products = self._crawl_requests(url)

        if not products:
            logger.info(f"[{self.name}] requests 실패 → Playwright 시도")
            products = self._crawl_playwright(url, size)

        logger.info(f"[{self.name}] {size}: {len(products)}개 상품")
        return products

    def _crawl_requests(self, url):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Referer': 'http://www.tirelove.kr/',
            'Connection': 'keep-alive',
        }
        try:
            session = requests.Session()
            session.get('http://www.tirelove.kr/', headers=headers, timeout=10)
            response = session.get(url, headers=headers, timeout=15)
            response.encoding = 'utf-8'
            if response.status_code != 200:
                logger.debug(f"[{self.name}] HTTP {response.status_code}")
                return []
            return self._parse_html(response.text)
        except Exception as e:
            logger.debug(f"[{self.name}] requests 오류: {e}")
            return []

    def _crawl_playwright(self, url, size):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.warning(f"[{self.name}] Playwright 미설치")
            return []

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
                )
                context = browser.new_context(locale='ko-KR')
                page = context.new_page()
                page.goto('http://www.tirelove.kr/', wait_until='domcontentloaded', timeout=15000)
                page.goto(url, wait_until='domcontentloaded', timeout=15000)
                content = page.content()
                browser.close()
            return self._parse_html(content)
        except Exception as e:
            logger.error(f"[{self.name}] Playwright 오류: {e}")
            return []

    def _parse_html(self, html):
        soup = BeautifulSoup(html, 'lxml')
        products = []

        items = soup.select('ul.list2 > li')
        for item in items:
            price_input = item.select_one('input[name="tr_card"]')
            if not price_input:
                continue
            price = self.clean_price(price_input.get('value', '0'))
            if price == 0:
                continue

            name_el = item.select_one('h5 > a')
            if not name_el:
                continue
            raw_name = name_el.get_text(strip=True)

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

            products.append({'name': self.clean_name(name), 'price': price})

        return products
