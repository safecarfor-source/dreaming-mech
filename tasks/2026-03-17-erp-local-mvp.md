# 극동 ERP 웹 전환 — 로컬 MVP 작전

## 작전 목표
극동프로그램의 핵심 기능을 로컬에서 웹으로 구현.
완성되면 바로 서버에 배포 가능한 수준.

## 스펙 결정 (소위 판단)

### 아키텍처: 기존 인프라 100% 활용
- DB: 기존 PostgreSQL + Gd* 테이블 5개 (이미 존재)
- Backend: 기존 NestJS + 새 모듈 추가
- Frontend: 기존 Next.js /admin/ 하위에 새 라우트

### 추가 필요 테이블: 2개만
1. `CustomerReminder` — 고객 리마인더 (3/6개월 알림)
2. (기존 GdRepair에 mileage 있으므로 주행거리 별도 불필요)

### 구현 범위 (MVP)

#### 1. 백엔드 — `/erp/` 모듈
- `GET /erp/dashboard` — 일별 매출 집계 + KPI
- `GET /erp/customers?q=` — 고객/차량 통합 검색
- `GET /erp/customers/:code/history` — 고객별 정비이력 + 주행거리 추적
- `GET /erp/customers/:code/predict` — 다음 정비 예측 (주행거리 기반)
- `GET /erp/reminders` — 리마인더 목록 (미방문 고객)
- `POST /erp/reminders/generate` — 리마인더 자동 생성 (배치)
- `GET /erp/products/top` — 인기 상품 TOP 10
- `GET /erp/sales/daily?from=&to=` — 일별 매출 상세

#### 2. 프론트엔드 — `/admin/erp/`
- **대시보드**: 오늘 매출, 고객수, 전년비교, 주간추이 차트
- **고객관리**: 검색 + 상세 (정비이력 타임라인 + 주행거리 그래프)
- **매출분석**: 일별/카테고리별 차트 (recharts 활용)
- **리마인더**: 미방문 고객 리스트 + "카카오톡 보내기" 버튼 (미래 연동)

#### 3. 시드 데이터 — 극동 스크린샷 기반 실데이터
- 거래처 20개 (매입처 + 매출처)
- 차량/고객 30개 (차량번호 + 차종 + 전화번호)
- 상품 50개 (타이어, 오일, 밧데리, 브레이크 등)
- 매출 200건 (3월 1~17일, 스크린샷의 실제 매출 데이터)
- 정비이력 100건 (차량별 정비 + 주행거리)

## 실행 순서

### Phase A: 백엔드 (먼저)
1. [ ] Prisma 스키마에 `CustomerReminder` 추가
2. [ ] 시드 데이터 스크립트 작성 (극동 스크린샷 기반)
3. [ ] NestJS `erp` 모듈 생성 + API 엔드포인트
4. [ ] 로컬에서 API 테스트 확인

### Phase B: 프론트엔드
5. [ ] `/admin/erp` 라우트 + AdminLayout 통합
6. [ ] 대시보드 페이지 (KPI 카드 + 일별 매출 차트)
7. [ ] 고객관리 페이지 (검색 + 정비이력 타임라인)
8. [ ] 리마인더 페이지 (미방문 고객 목록)

### Phase C: 검증
9. [ ] 로컬 서버 실행 → 대장님 확인
10. [ ] 코드 리뷰 + 빌드 체크

## 기술 결정 사항
- 차트: recharts (이미 설치됨)
- 아이콘: lucide-react (이미 사용중)
- 레이아웃: AdminLayout 재사용
- 색상: #7C4DFF 통일
- 인증: 기존 admin JWT 그대로
