"""
티스테이션 (tstation.com) 크롤러
클라이언트사이드 렌더링 → Playwright headless
URL: https://www.tstation.com/tire/sizes?sizeCd=2355519
"""
import re
import logging
from .base import BaseCrawler

logger = logging.getLogger(__name__)


class TStationCrawler(BaseCrawler):
    name = "티스테이션"
    base_url = "https://www.tstation.com/tire/sizes"

    def crawl(self, size):
        width, ratio, inch = self.parse_size(size)
        size_code = f"{width}{ratio}{inch}"
        url = f"{self.base_url}?sizeCd={size_code}"

        products = []

        try:
            from playwright.sync_api import sync_playwright

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
                page = browser.new_page()
                page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })

                logger.info(f"[{self.name}] {url} 접속 중...")
                page.goto(url, wait_until='networkidle', timeout=30000)

                # 페이지 로드 후 스크롤하여 모든 상품 로드
                page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                page.wait_for_timeout(2000)

                # 모든 상품 카드 텍스트 추출
                content = page.content()
                browser.close()

        except Exception as e:
            logger.error(f"[{self.name}] Playwright 오류: {e}")
            return []

        # HTML 파싱
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(content, 'lxml')

        # 상품 카드에서 이름과 가격 추출
        # 티스테이션은 상품명 + 할인율 + 가격 구조
        all_text = soup.get_text()

        # 패턴: 상품명 → 할인율% → 가격원
        # 예: "Ventus S2 AS" ... "22%" ... "118,300원"
        # 상품 카드 단위로 파싱
        cards = soup.select('[class*="product"], [class*="item"], [class*="card"], article, .swiper-slide')

        if not cards:
            # 카드 셀렉터를 못 찾으면 전체 텍스트에서 가격 패턴 추출
            lines = all_text.split('\n')
            current_name = None
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 가격 패턴
                price_match = re.search(r'([\d,]+)\s*원', line)
                if price_match and current_name:
                    price = self.clean_price(price_match.group(1))
                    if price > 0:
                        products.append({
                            'name': current_name,
                            'price': price,
                        })
                    current_name = None
                    continue

                # 타이어 상품명 패턴 (대문자로 시작, 최소 5자)
                if len(line) > 4 and not line.startswith(('※', '●', '•', '-', '총', '개', '무료')):
                    if re.search(r'[A-Za-z가-힣]', line) and '원' not in line and '%' not in line:
                        current_name = self.clean_name(line)

        else:
            for card in cards:
                text = card.get_text()
                # 상품명
                name_el = card.select_one('h3, h4, [class*="name"], [class*="title"]')
                if name_el:
                    name = self.clean_name(name_el.get_text())
                else:
                    continue

                # 가격
                price_match = re.search(r'([\d,]+)\s*원', text)
                if not price_match:
                    continue

                price = self.clean_price(price_match.group(1))
                if price == 0:
                    continue

                products.append({
                    'name': name,
                    'price': price,
                })

        logger.info(f"[{self.name}] {size}: {len(products)}개 상품")
        return products
