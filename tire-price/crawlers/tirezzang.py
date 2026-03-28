"""
타이어짱 (tirezzang.co.kr) 크롤러
GET 방식 → requests + BeautifulSoup + 페이지네이션
URL: http://tirezzang.co.kr/product/tire/sizelist.aspx

HTML 구조 (2026-03-27 확인):
- GET 파라미터: frchk=1&find_ftsize=2055516&find_rtsize=2055516&spage=1&lpage=1&seltireg=all
- 브랜드: span[style*="color:#000;font-weight:700"]
- 상품명: span[style*="color:#0066CC;font-weight:700"]
- 카드가: input[name="hcardmoney1"] (hidden, 가장 안정적)
- 현금가: input[name="hcashmoney1"] (hidden)
- 8개/페이지, spage로 페이지네이션

EC2 접근 이슈: 데이터센터 IP(AWS, Cloudflare) 차단 가능성 있음
→ Playwright로 폴백하여 브라우저 핑거프린트 우회 시도
"""
import os
import requests
from bs4 import BeautifulSoup
import re
import time
import logging
from .base import BaseCrawler

logger = logging.getLogger(__name__)

MAX_PAGES = 10  # 최대 페이지 (안전장치)


class TireZzangCrawler(BaseCrawler):
    name = "타이어짱"
    base_url = "http://tirezzang.co.kr/product/tire/sizelist.aspx"

    def crawl(self, size):
        width, ratio, inch = self.parse_size(size)
        size_code = f"{width}{ratio}{inch}"

        products = self._crawl_requests(size_code)

        # requests 실패 시 Playwright로 폴백 (TIREZZANG_PLAYWRIGHT=1 설정 시만 실행)
        # EC2 메모리 절약: tstation Playwright와 동시 실행 방지
        if not products and os.getenv('TIREZZANG_PLAYWRIGHT', '0') == '1':
            logger.info(f"[{self.name}] requests 실패 → Playwright 시도")
            products = self._crawl_playwright(size_code, size)
        elif not products:
            logger.warning(f"[{self.name}] 크롤링 실패 (IP 차단 가능성 — TIREZZANG_PLAYWRIGHT=1 로 Playwright 폴백 활성화 가능)")

        logger.info(f"[{self.name}] {size}: {len(products)}개 상품")
        return products

    def _crawl_requests(self, size_code):
        """requests + BeautifulSoup으로 크롤링"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Referer': 'http://tirezzang.co.kr/',
            'Upgrade-Insecure-Requests': '1',
        }

        session = requests.Session()
        # 첫 메인 페이지 방문으로 쿠키 획득
        try:
            session.get('http://tirezzang.co.kr/', headers=headers, timeout=10)
        except Exception:
            pass

        products = []
        seen = set()
        page = 1

        while page <= MAX_PAGES:
            url = (
                f"{self.base_url}?frchk=1"
                f"&find_ftsize={size_code}"
                f"&find_rtsize={size_code}"
                f"&spage={page}&lpage=1&seltireg=all"
            )

            try:
                response = session.get(url, headers=headers, timeout=15)
                response.encoding = 'utf-8'
            except Exception as e:
                logger.debug(f"[{self.name}] 페이지 {page} 요청 실패: {e}")
                break

            if response.status_code != 200:
                logger.debug(f"[{self.name}] HTTP {response.status_code}")
                break

            soup = BeautifulSoup(response.text, 'lxml')
            page_products = self._parse_page(soup)

            if not page_products:
                break

            new_count = 0
            for p in page_products:
                key = (p['name'], p['price'])
                if key not in seen:
                    seen.add(key)
                    products.append(p)
                    new_count += 1

            if new_count == 0:
                break

            page += 1
            if page <= MAX_PAGES:
                time.sleep(0.5)

        return products

    def _crawl_playwright(self, size_code, size):
        """Playwright로 크롤링 (EC2 봇 탐지 우회)"""
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.warning(f"[{self.name}] Playwright 미설치 — 건너뜀")
            return []

        url = (
            f"{self.base_url}?frchk=1"
            f"&find_ftsize={size_code}"
            f"&find_rtsize={size_code}"
            f"&spage=1&lpage=1&seltireg=all"
        )

        products = []
        seen = set()

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--single-process',
                    ]
                )
                context = browser.new_context(
                    locale='ko-KR',
                    extra_http_headers={
                        'Accept-Language': 'ko-KR,ko;q=0.9',
                    }
                )
                page_obj = context.new_page()

                # 메인 페이지 먼저 방문 (쿠키/세션)
                page_obj.goto('http://tirezzang.co.kr/', wait_until='domcontentloaded', timeout=15000)

                page_num = 1
                while page_num <= MAX_PAGES:
                    current_url = (
                        f"{self.base_url}?frchk=1"
                        f"&find_ftsize={size_code}"
                        f"&find_rtsize={size_code}"
                        f"&spage={page_num}&lpage=1&seltireg=all"
                    )
                    page_obj.goto(current_url, wait_until='domcontentloaded', timeout=15000)
                    content = page_obj.content()

                    soup = BeautifulSoup(content, 'lxml')
                    page_products = self._parse_page(soup)

                    if not page_products:
                        break

                    new_count = 0
                    for prod in page_products:
                        key = (prod['name'], prod['price'])
                        if key not in seen:
                            seen.add(key)
                            products.append(prod)
                            new_count += 1

                    if new_count == 0:
                        break

                    page_num += 1
                    if page_num <= MAX_PAGES:
                        time.sleep(0.3)

                browser.close()
        except Exception as e:
            logger.error(f"[{self.name}] Playwright 오류: {e}")

        return products

    def _parse_page(self, soup):
        """한 페이지의 HTML에서 상품 추출"""
        products = []

        brand_spans = soup.find_all('span', style=re.compile(r'color:#000.*font-weight'))
        name_spans = soup.find_all('span', style=re.compile(r'color:#0066CC.*font-weight'))

        # 가격: hidden input이 가장 안정적
        card_inputs = soup.find_all('input', attrs={'name': re.compile(r'^hcardmoney\d+$')})

        # hidden input이 없으면 CC3300 font fallback
        if card_inputs:
            prices = [self.clean_price(inp.get('value', '0')) for inp in card_inputs]
        else:
            cc_fonts = soup.find_all('font', color=re.compile(r'CC3300'))
            all_prices = []
            for f in cc_fonts:
                b = f.find('b')
                if b:
                    price_text = b.get_text(strip=True)
                    if re.search(r'[\d,]+', price_text):
                        all_prices.append(self.clean_price(price_text))
            # 짝수=1본, 홀수=4본
            prices = [all_prices[i] for i in range(0, len(all_prices), 2)]

        count = min(len(brand_spans), len(name_spans), len(prices))

        for i in range(count):
            brand = brand_spans[i].get_text(strip=True)
            product_name = name_spans[i].get_text(strip=True)
            price = prices[i]

            if price == 0:
                continue

            full_name = f"{brand} {product_name}".strip()
            products.append({
                'name': self.clean_name(full_name),
                'price': price,
            })

        return products
