# 차량조회/상품조회 탭 백업
- 백업일: 2026-03-17
- 사유: 대표 아이디(662)가 해당 기능 사용하지 않음 → 삭제
- 삭제 대상: index.html의 차량조회(gd-vehicle) + 상품조회(gd-product) 탭
- 복원 방법: 이 파일의 코드를 index.html에 재삽입
- 자동삭제 예정: 2026-09-17 (6개월 후)

## 복원 위치
1. HTML 마크업 → </div><!-- tab-insight --> 뒤에 삽입
2. buildTabs() → tabs.push 영역에 추가
3. switchTab() → else if 분기 추가
4. JavaScript 함수들 → if (token) { initApp(); } 앞에 삽입
