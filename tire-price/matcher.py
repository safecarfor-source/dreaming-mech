"""
타이어 가격 비교 시스템 — 상품 매칭 모듈
우리 DB 상품과 경쟁사 상품을 브랜드+패턴명으로 매칭
"""
import re
import logging

logger = logging.getLogger(__name__)

# 브랜드 키워드 사전
BRAND_KEYWORDS = {
    '한국타이어': ['한국', 'Hankook', 'hankook'],
    '금호': ['금호', 'Kumho', 'kumho'],
    '넥센': ['넥센', 'Nexen', 'nexen', 'RODIAN', 'Rodian', '로디안'],
    '미쉐린': ['미쉐린', 'Michelin', 'michelin', 'MICHELIN'],
    '콘티넨탈': ['콘티넨탈', 'Continental', 'continental', '콘티'],
    '브릿지스톤': ['브릿지스톤', 'Bridgestone', 'bridgestone', 'BRIDGESTONE'],
    '굿이어': ['굿이어', '굳이어', 'Goodyear', 'goodyear', 'GOODYEAR'],
    '피렐리': ['피렐리', 'Pirelli', 'pirelli', 'PIRELLI'],
    '라우펜': ['라우펜', 'Laufenn', 'laufenn', 'LAUFENN'],
    '쿠퍼': ['쿠퍼', 'Cooper', 'cooper'],
}

# 패턴명 매칭 키워드 (브랜드 무관하게 패턴명으로 매칭)
PATTERN_KEYWORDS = {
    'HPX': ['HPX', 'RA43', '다이나프로HPX', '다이나프로 HPX', 'Dynapro HPX', 'Dynapro Premium'],
    'HP3': ['HP3', 'RA55', '다이나프로HP3', 'Dynapro HP3'],
    'HP2': ['HP2', 'RA33', '다이나프로HP2', 'Dynapro HP2', '다이나프로 HP2'],
    'HL3': ['HL3', 'RA45', '다이나프로HL3', 'Dynapro HL3'],
    'Ventus S2 AS': ['S2 AS', 'H462', '벤투스 S2', 'Ventus S2 AS'],
    'Ventus S1 evo Z AS': ['H129', 'H129A', 'evo Z AS', 'evo Z X AS', '벤투스 S1 evo Z'],
    'Weatherflex GT': ['H755', 'Weatherflex', '웨더플렉스', 'weatherflex'],
    'Kinergy EX': ['Kinergy EX', 'EX', '키너지 EX'],
    'Kinergy ST AS': ['Kinergy ST', 'H318', '키너지 ST'],
    'Kinergy 4S2': ['H750', '4S2', 'Kinergy 4S2', '키너지 4S2'],
    'iON evo AS': ['IH01', 'iON evo', '아이온 evo', 'iON EVO'],
    'iON ST AS': ['IH61', 'iON ST', '아이온 ST'],
    'Serenity Plus': ['Serenity', '세레니티'],
    'ECOPIA EP300': ['EP300', 'ECOPIA', '에코피아'],
    'CrossClimate 2': ['CrossClimate', 'CROSSCLIMATE', '크로스클라이밋'],
    'Primacy': ['Primacy', 'primacy', '프라이머시'],
    'LTX': ['LTX'],
    'ComfortContact CC7': ['CC 7', 'CC7', 'ComfortContact'],
    'EFFICIENT GRIP': ['EFFICIENT', 'Efficient Grip', 'EfficientGrip'],
    'S FIT AS': ['S FIT', 'S-Fit', 'S Fit'],
    'KL33': ['KL33', '크루젠 프리미엄', 'CRUGEN PREMIUM'],
    'HP51': ['HP51', 'CRUGEN HP51'],
    'HP71': ['HP71', 'CRUGEN HP71'],
    'HP72': ['HP72', 'CRUGEN GT', 'GT Pro'],
    'HP91': ['HP91', 'CRUGEN HP91'],
    'TA51': ['TA51', 'SOLUS TA51'],
    'TA91': ['TA91', 'Majesty 9', 'MAJESTY'],
    'TA92': ['TA92', 'Majesty X'],
    'AU7': ['AU7', 'N FERA AU7'],
    'RU5': ['RU5', 'N FERA RU5'],
    'GTX': ['GTX', 'RODIAN GTX', '로디안 GTX'],
    '라우펜 S-Fit': ['LH01', 'S-Fit AS SUV', '라우펜 S-Fit'],
    'HA32': ['HA32', 'SOLUS 4S'],
    'UC6': ['UC6', 'UltraContact'],
    'LX SPORT': ['LX SPORT', 'LX-SPORT', '크로스 콘텍트'],
    'CrossContact RX': ['Contact RX', 'CrossContact RX', '크로스Contact RX'],
    '스콜피온': ['스콜피온', 'Scorpion', 'SCORPION'],
}


def detect_brand(name):
    """상품명에서 브랜드 탐지"""
    for brand, keywords in BRAND_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in name.lower():
                return brand
    return None


def detect_pattern(name):
    """상품명에서 패턴 탐지"""
    for pattern, keywords in PATTERN_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in name.lower():
                return pattern
    return None


def match_products(our_products, competitor_products):
    """
    우리 상품과 경쟁사 상품을 매칭

    Args:
        our_products: [{'code': 'TA001', 'name': '...', 'price': 175000}, ...]
        competitor_products: [{'name': '...', 'price': 170000}, ...]

    Returns:
        매칭 결과 리스트:
        [
            {
                'our_name': '다이나프로HPX RA43',
                'our_price': 175000,
                'competitor_name': '다이나프로 HPX RA43',
                'competitor_price': 170000,
                'cheaper': True  # 경쟁사가 더 쌈
            }
        ]

        + 매칭 안 된 경쟁사 상품 리스트
    """
    matched = []
    unmatched_competitors = list(competitor_products)

    for our in our_products:
        our_pattern = detect_pattern(our['name'])
        our_brand = detect_brand(our['name'])

        best_match = None
        best_score = 0

        for comp in unmatched_competitors:
            comp_pattern = detect_pattern(comp['name'])
            comp_brand = detect_brand(comp['name'])

            score = 0

            # 패턴 매칭 (가장 중요)
            if our_pattern and comp_pattern and our_pattern == comp_pattern:
                score += 10

            # 브랜드 매칭
            if our_brand and comp_brand and our_brand == comp_brand:
                score += 3

            if score > best_score:
                best_score = score
                best_match = comp

        if best_match and best_score >= 10:  # 최소 패턴 매칭 필요
            matched.append({
                'our_name': our['name'],
                'our_price': our['price'],
                'competitor_name': best_match['name'],
                'competitor_price': best_match['price'],
                'cheaper': best_match['price'] < our['price'],
            })
            unmatched_competitors.remove(best_match)

    return matched, unmatched_competitors


def build_comparison_table(our_products, all_competitors):
    """
    전체 비교표 생성

    Args:
        our_products: {size: [{code, name, price}, ...]}
        all_competitors: {site_name: {size: [{name, price}, ...]}}

    Returns:
        비교표 데이터 (rows)
    """
    rows = []
    site_names = list(all_competitors.keys())

    for size, our_items in our_products.items():
        for our in our_items:
            our_pattern = detect_pattern(our['name'])
            if not our_pattern:
                our_pattern = our['name']  # 패턴 못 찾으면 원래 이름

            row = {
                'size': size,
                'product': our_pattern,
                'our_name': our['name'],
                'our_price': our['price'],
            }

            # 각 경쟁사에서 매칭되는 상품 찾기
            for site in site_names:
                comp_items = all_competitors.get(site, {}).get(size, [])
                matched_price = None

                for comp in comp_items:
                    comp_pattern = detect_pattern(comp['name'])
                    if comp_pattern and comp_pattern == our_pattern:
                        matched_price = comp['price']
                        break

                row[site] = matched_price

            rows.append(row)

        # 경쟁사에만 있는 상품 (우리 DB에 없는 것)
        all_comp_patterns = set()
        for our in our_items:
            p = detect_pattern(our['name'])
            if p:
                all_comp_patterns.add(p)

        for site in site_names:
            comp_items = all_competitors.get(site, {}).get(size, [])
            for comp in comp_items:
                comp_pattern = detect_pattern(comp['name'])
                if comp_pattern and comp_pattern not in all_comp_patterns:
                    # 이미 추가된 패턴인지 확인
                    already = any(r['product'] == comp_pattern and r['size'] == size for r in rows)
                    if not already:
                        row = {
                            'size': size,
                            'product': comp_pattern,
                            'our_name': '-',
                            'our_price': 0,
                        }
                        for s in site_names:
                            ci = all_competitors.get(s, {}).get(size, [])
                            mp = None
                            for c in ci:
                                if detect_pattern(c['name']) == comp_pattern:
                                    mp = c['price']
                                    break
                            row[s] = mp
                        rows.append(row)
                    all_comp_patterns.add(comp_pattern)

    return rows, site_names
