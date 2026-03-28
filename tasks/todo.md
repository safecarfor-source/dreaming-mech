# 꿈꾸는정비사 — 작업 추적

> 세션 시작 시 BRAIN.md 먼저 읽을 것!

---

## ✅ 완료된 전체 작업

### Phase 0~8 (2026-02-22까지)
- [x] 기본 플랫폼 구축 (정비소 목록, 지도, 카드)
- [x] 관리자 대시보드
- [x] 사장님(Owner) 카카오 로그인 + 승인 시스템
- [x] 견적 요청 (QuoteRequest)
- [x] 한줄 리뷰 시스템
- [x] 타이어 문의 (TireInquiry)
- [x] AWS S3 이미지 업로드
- [x] 보안 (Rate Limiting, 봇 감지, XSS 방어)
- [x] HTTPS (Nginx + Let's Encrypt)

### Phase 1 MVP (2026-02-23 완료)
- [x] 4단계 문의 퍼널 (지역→서비스→연락처→완료)
- [x] 고객 카카오 로그인 (customer_token)
- [x] ServiceInquiry API + 텔레그램 봇 알림
- [x] 카카오 오픈채팅 연동

### Phase 2 통합 문의 시스템 (2026-02-24 완료)
- [x] UnifiedInquiry 백엔드 API (3개 테이블 통합 조회)
- [x] 비로그인 문의 접수 (전화번호만으로 가능)
- [x] 영업용 공유 링크 시스템 (/inquiry/[type]/[id])

### 정비사 이주 작전 (2026-02-24 완료)
- [x] 공유 링크 페이지 강화 + 로그인 복귀
- [x] /for-mechanics 경량화 (920줄→260줄)

### 긴급작전 + 버그 수정 (2026-02-26 완료)
- [x] 차량번호/차종 필드 + 개인정보 동의 체크박스
- [x] Owner PENDING 승인제 + 카카오톡 빠른 문의
- [x] 문의관리 배지 실시간 갱신 (CustomEvent)
- [x] 카카오 1계정 = 정비소 1개 제한

### 디자인 통일 + 버그 수정 (2026-02-27 완료)
- [x] Owner 전체 페이지 퍼플 #7C4DFF 통일
- [x] 사장님 영업시간/휴무일 수정 미반영 버그 수정
- [x] 관리자 문의 상세 모달 추가

### 커뮤니티 Q&A (2026-02-27 완료)
- [x] DB: Post, Comment, PostLike 테이블
- [x] 백엔드: community 모듈 CRUD + 좋아요 + 조회수
- [x] /community 목록 + /community/write + /community/[id] 상세
- [x] 정비사 댓글에 매장 정보 자동 노출

### 고객 관리 작전 (2026-02-27 완료)
- [x] 고객 문의 별도 페이지 (/inquiry)
- [x] 고객 회원가입 (/register) + 관리자 고객 현황 (/admin/customers)

### 유튜브 연동 작전 (2026-02-27 완료)
- [x] /about 랜딩 페이지 (유튜브 전용)
- [x] ServiceInquiryFunnel 재사용 컴포넌트 (문의폼 임베드)
- [x] TrackingLink 시스템 (이미 완전 구현 — ?ref=코드)
- [x] GA4 커스텀 이벤트 21개 라이브러리

### SEO 작전 (2026-02-27 완료)
- [x] 구조화 데이터 6종 (Organization, WebSite, AutoRepair, Service, CollectionPage, BreadcrumbList)
- [x] /community + /community/[id] + /about 메타데이터 + JSON-LD
- [x] /community/[id] 동적 generateMetadata (글 제목 → OG title)
- [x] sitemap에 /about 추가 (총 6페이지)
- [x] 네이버 서치어드바이저 수집 요청 5개
- [x] 구글 서치콘솔 색인 요청
- [x] 네이버 블로그 포스트 작성
- [x] 유튜브 채널 → 사이트 링크 연결
- [x] 네비게이션 정리 (서비스/문의하기 삭제, 플랫폼 소개 추가)

### 인프라/보안 안정화 작전 (2026-03-28 완료)
- [x] EC2 t3.small → t3.medium 업그레이드 (RAM 4GB, Swap 597→23MB)
- [x] Postgres 메모리 튜닝 (shared_buffers 1GB, work_mem 16MB)
- [x] memory-guard.sh 설치 (5분 cron, Swap 모니터링, 텔레그램 알림)
- [x] 보안 #1: IncentiveUser.plainPassword 필드 제거 (DB + 코드)
- [x] 보안 #2: Firebird 연결 정보 환경변수화 (gd_sync_server.py)
- [x] 보안 #3: PID 파일 잠금 (동시 실행 방지)
- [x] 보안 #4: users.controller.ts 입력값 검증 추가
- [x] 보안 #5: clear_slot + insert_batch 단일 트랜잭션 묶기
- [x] 보안 #8: GdSyncLog 인덱스 추가 (status/completedAt, sourceHash)
- [x] 보안 #9: GdSaleDetail.saleDate nullable 처리
- [x] 배포 체크리스트 신규 작성 (rules/deploy-checklist.md)
- [x] 차량조회 품목명 2줄 표시 수정 (gd-vehicle/page.tsx)
- [x] 지역별 SEO 랜딩 페이지 + 정비소 JSON-LD 구조화 데이터
- [x] GET /incentive/calc/history 엔드포인트 추가

---

## ⏳ 남은 작업 (우선순위)

### P0: 마케팅 (대장님 직접)
- [ ] 유튜브 인기 영상 설명란에 사이트 링크 추가
- [ ] 유튜브 커뮤니티 탭 플랫폼 소개 포스트
- [ ] 플랫폼 소개 영상 촬영/편집

### P1: 코드 (소위 작전)
- [ ] 텔레그램 알림 연결 (Bot Token + Chat ID 대장님 제공 대기 중)
- [ ] 정비사 문의 알림 시스템 (새 문의 시 정비사에게 알림)
- [ ] 정비소 상세 페이지 SEO (/shop/{region}-{name})

### 커뮤니티 활성화
- [ ] 글 분류 체계 확정 (정보전달 + 가치입증)
- [ ] 가치입증 글 벤치마킹 (대장님 네이버 예시 분석)
- [ ] 글 템플릿 코드 구현 (카테고리/영상임베드/CTA)
- [ ] 시딩 7개 주제 초안 작성
- [ ] 유튜브 영상 매칭 (대장님 확인 필요)
- [ ] 주 2회 글 발행 시작

### P2: 성장 가속 (1~2개월)
- [ ] 카카오 알림톡 자동 발송 (SOLAPI)
- [ ] 리뷰/평점 시스템
- [ ] admin 페이지 퍼플 통일

### Phase 4: 수익화 (3개월+)
- [ ] 구독 티어 (무료 5건/월, 기본 30만원 무제한)
- [ ] 토스페이먼츠 결제 연동

---

## 검토 기록

| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-02-22 | Phase 0~8 완료 | ✅ |
| 2026-02-23 | Phase 1 MVP 완료 | ✅ |
| 2026-02-24 | Phase 2 통합 문의 + 정비사 이주 작전 | ✅ |
| 2026-02-26 | 긴급작전 + 버그 수정 3종 + 전략 보고서 | ✅ |
| 2026-02-27 | 디자인 통일 + 커뮤니티 Q&A + 고객 관리 | ✅ |
| 2026-02-27 | 유튜브 연동 + GA 연동 + 네비게이션 정리 | ✅ |
| 2026-02-27 | SEO P0 작전 (구조화 데이터 + 검색 등록) | ✅ |
| 2026-03-28 | 인프라/보안 안정화 (EC2업그, Postgres튜닝, memory-guard, 보안#1~9) | ✅ |
| 2026-03-28 | 지역별 SEO 랜딩 + 정비소 JSON-LD + calc/history 엔드포인트 | ✅ |
