"""
타이어 가격 비교 시스템 — Google Sheets 모듈
gspread로 스프레드시트 읽기/쓰기
"""
import os
import logging
from datetime import datetime

import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
]

DEFAULT_SIZES = [
    '205/55R16', '235/55R19', '235/60R18', '245/40R19', '275/35R19',
    '245/45R19', '270/40R19', '245/45R18', '215/55R17', '225/55R17',
    '195/65R15',
]


def get_client():
    """gspread 클라이언트 생성 (서비스 계정)"""
    json_path = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', 'service-account.json')
    # 상대경로면 tire-price/ 기준으로 변환
    if not os.path.isabs(json_path):
        json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), json_path)

    creds = Credentials.from_service_account_file(json_path, scopes=SCOPES)
    return gspread.authorize(creds)


def get_spreadsheet():
    """스프레드시트 객체 반환"""
    sheet_id = os.getenv('GOOGLE_SHEETS_ID', '')
    if not sheet_id:
        raise ValueError("GOOGLE_SHEETS_ID 환경변수가 설정되지 않음")

    client = get_client()
    return client.open_by_key(sheet_id)


def ensure_settings_tab(spreadsheet):
    """[설정] 탭이 없으면 기본 사이즈 목록으로 생성"""
    try:
        ws = spreadsheet.worksheet('설정')
        return ws
    except gspread.WorksheetNotFound:
        logger.info("[설정] 탭 생성 중 (기본 사이즈 11개)...")
        ws = spreadsheet.add_worksheet(title='설정', rows=50, cols=5)
        # 헤더 + 사이즈 목록
        data = [['타이어 사이즈', '비고']]
        for size in DEFAULT_SIZES:
            data.append([size, ''])
        ws.update(range_name='A1', values=data)
        # 헤더 볼드 (배경색)
        ws.format('A1:B1', {
            'textFormat': {'bold': True},
            'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9},
        })
        logger.info(f"[설정] 탭 생성 완료 ({len(DEFAULT_SIZES)}개 사이즈)")
        return ws


def read_sizes():
    """
    [설정] 탭에서 사이즈 목록 읽기
    Returns: ['205/55R16', '235/55R19', ...] or None
    """
    spreadsheet = get_spreadsheet()
    ws = ensure_settings_tab(spreadsheet)

    # A열에서 사이즈 읽기 (헤더 제외)
    values = ws.col_values(1)
    sizes = []
    for v in values[1:]:  # 첫 행은 헤더
        v = v.strip()
        if v and '/' in v and 'R' in v:
            sizes.append(v)

    return sizes if sizes else None


def write_results(rows, site_names):
    """
    [비교표] 탭에 가격 비교표 작성

    Args:
        rows: [{'size': '205/55R16', 'product': 'HPX', 'our_price': 95000, '남동공단점': 90000, ...}]
        site_names: ['남동공단점', '티스테이션', '타이어사랑', '타이어짱']
    """
    spreadsheet = get_spreadsheet()

    # [비교표] 탭 가져오기 (없으면 생성)
    try:
        ws = spreadsheet.worksheet('비교표')
        ws.clear()
    except gspread.WorksheetNotFound:
        ws = spreadsheet.add_worksheet(title='비교표', rows=500, cols=20)

    # 헤더 구성
    headers = ['사이즈', '상품(패턴)', '우리 가격']
    for site in site_names:
        headers.append(site)
    headers.append('최저 경쟁사')
    headers.append('차이')

    # 데이터 행 구성
    data = [headers]
    red_cells = []  # 빨간색으로 칠할 셀 좌표

    for i, row in enumerate(rows):
        data_row = [
            row['size'],
            row['product'],
            row['our_price'] if row['our_price'] > 0 else '-',
        ]

        # 경쟁사 가격 + 최저가 추적
        min_price = None
        min_site = '-'

        for col_idx, site in enumerate(site_names):
            price = row.get(site)
            if price is None:
                data_row.append('-')
            else:
                data_row.append(price)
                # 우리보다 싼 경쟁사 = 빨간색 표시
                if row['our_price'] > 0 and price < row['our_price']:
                    # row i+1 (0-indexed data), col 3+col_idx (0-indexed)
                    # gspread는 1-indexed: row=i+2 (헤더+1), col=col_idx+4
                    red_cells.append((i + 2, col_idx + 4))

                if min_price is None or price < min_price:
                    min_price = price
                    min_site = site

        # 최저 경쟁사 + 차이
        data_row.append(f"{min_site} ({min_price:,}원)" if min_price else '-')
        if min_price and row['our_price'] > 0:
            diff = row['our_price'] - min_price
            data_row.append(f"{diff:+,}")
        else:
            data_row.append('-')

        data.append(data_row)

    # 마지막 업데이트 시간 추가
    data.append([])
    data.append([f"최종 업데이트: {datetime.now().strftime('%Y-%m-%d %H:%M')}"])

    # 한번에 쓰기 (API 호출 최소화)
    ws.update(range_name='A1', values=data)

    # 헤더 스타일
    ws.format(f'A1:{chr(65 + len(headers) - 1)}1', {
        'textFormat': {'bold': True, 'fontSize': 11},
        'backgroundColor': {'red': 0.2, 'green': 0.2, 'blue': 0.3},
        'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}},
        'horizontalAlignment': 'CENTER',
    })

    # 빨간색 하이라이트 (우리보다 싼 경쟁사)
    if red_cells:
        formats = []
        for row_idx, col_idx in red_cells:
            cell_label = f"{chr(64 + col_idx)}{row_idx}"
            formats.append({
                'range': cell_label,
                'format': {
                    'backgroundColor': {'red': 1, 'green': 0.85, 'blue': 0.85},
                    'textFormat': {'bold': True, 'foregroundColor': {'red': 0.8, 'green': 0, 'blue': 0}},
                },
            })
        ws.batch_format(formats)

    # 열 너비 자동 조정 (숫자 형식)
    # 가격 열에 숫자 포맷 적용
    price_cols = f"C2:{chr(65 + 2 + len(site_names))}{len(data)}"
    ws.format(price_cols, {
        'numberFormat': {'type': 'NUMBER', 'pattern': '#,##0'},
        'horizontalAlignment': 'RIGHT',
    })

    logger.info(f"[비교표] {len(rows)}행 작성 완료 (빨간색 {len(red_cells)}개)")


def ensure_history_tab(spreadsheet):
    """[이력] 탭이 없으면 헤더와 함께 자동 생성"""
    try:
        ws = spreadsheet.worksheet('이력')
        return ws
    except gspread.WorksheetNotFound:
        logger.info("[이력] 탭 생성 중...")
        ws = spreadsheet.add_worksheet(title='이력', rows=5000, cols=20)
        return ws


def append_history(rows, site_names):
    """
    [이력] 탭에 날짜별 가격 데이터 누적 append

    Args:
        rows: [{'size': '205/55R16', 'product': 'HPX', 'our_price': 95000, '남동공단점': 90000, ...}]
        site_names: ['남동공단점', '티스테이션', '타이어사랑', '타이어짱']
    """
    spreadsheet = get_spreadsheet()
    ws = ensure_history_tab(spreadsheet)

    today = datetime.now().strftime('%Y-%m-%d')

    # 헤더 구성
    headers = ['날짜', '사이즈', '상품(패턴)', '우리 가격']
    for site in site_names:
        headers.append(site)
    headers.append('최저 경쟁사')
    headers.append('차이')

    # 현재 데이터 확인
    existing = ws.get_all_values()

    # 헤더가 없으면 추가
    if not existing:
        ws.update(range_name='A1', values=[headers])
        ws.format(f'A1:{chr(65 + len(headers) - 1)}1', {
            'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}},
            'backgroundColor': {'red': 0.2, 'green': 0.2, 'blue': 0.3},
            'horizontalAlignment': 'CENTER',
        })
        existing = [headers]

    # 같은 날짜 중복 방지: 오늘 날짜 행 삭제
    rows_to_delete = []
    for idx, row_data in enumerate(existing):
        if idx == 0:
            continue  # 헤더 스킵
        if row_data and row_data[0] == today:
            rows_to_delete.append(idx + 1)  # 1-indexed

    if rows_to_delete:
        # 뒤에서부터 삭제 (인덱스 밀림 방지)
        for row_idx in sorted(rows_to_delete, reverse=True):
            ws.delete_rows(row_idx)
        logger.info(f"[이력] 오늘({today}) 기존 {len(rows_to_delete)}행 삭제 후 재작성")
        existing = ws.get_all_values()

    # 새 데이터 행 구성
    new_rows = []
    for row in rows:
        data_row = [today, row['size'], row['product']]
        data_row.append(row['our_price'] if row['our_price'] > 0 else '')

        min_price = None
        min_site = ''
        for site in site_names:
            price = row.get(site)
            if price is None:
                data_row.append('')
            else:
                data_row.append(price)
                if min_price is None or price < min_price:
                    min_price = price
                    min_site = site

        # 최저 경쟁사 + 차이
        data_row.append(f"{min_site} ({min_price:,})" if min_price else '')
        if min_price and row['our_price'] > 0:
            diff = row['our_price'] - min_price
            data_row.append(diff)
        else:
            data_row.append('')

        new_rows.append(data_row)

    # append (기존 데이터 아래에 추가)
    next_row = len(existing) + 1
    ws.update(range_name=f'A{next_row}', values=new_rows)

    # 가격 열 숫자 포맷
    price_range = f'D{next_row}:{chr(65 + 3 + len(site_names))}{next_row + len(new_rows) - 1}'
    ws.format(price_range, {
        'numberFormat': {'type': 'NUMBER', 'pattern': '#,##0'},
        'horizontalAlignment': 'RIGHT',
    })

    logger.info(f"[이력] {today}: {len(new_rows)}행 추가 (총 {next_row + len(new_rows) - 2}행)")


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    # 테스트: 사이즈 목록 읽기
    sizes = read_sizes()
    print(f"사이즈 목록: {sizes}")
