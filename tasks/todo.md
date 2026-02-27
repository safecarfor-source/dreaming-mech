# 꿈꾸는정비사 — 작업 추적

> 세션 시작 시 BRAIN.md 먼저 읽을 것!

---

## ✅ Phase 1 MVP 완료 (2026-02-23)

### 백엔드
- [x] DB 스키마 확장 — Customer, ServiceInquiry 모델 추가
- [x] 텔레그램 봇 알림 — NotificationService.sendTelegramMessage 구현
- [x] 고객 카카오 OAuth — GET /auth/kakao/customer, /callback
- [x] ServiceInquiry 모듈 — CRUD API + 텔레그램 연동
- [x] JwtStrategy — customer_token 쿠키 처리 추가
- [x] 카카오 오픈채팅 URL 저장 (KAKAO_OPENCHAT_URL 환경변수)
- [x] GET /service-inquiries/:id/share-message — 단톡방 공유 메시지 API
- [x] 빌드 오류 수정 (prisma generate)

### 프론트엔드
- [x] regions.ts — 전국 270+ 지역 데이터 + searchRegions() 함수
- [x] types/index.ts — Customer, ServiceInquiry 타입 추가
- [x] lib/api.ts — customerAuthApi, serviceInquiryApi 추가
- [x] lib/customer-store.ts — Zustand 고객 인증 스토어
- [x] app/page.tsx — 메인페이지 완전 리뉴얼 (4단계 문의 퍼널)
- [x] app/inquiry/callback/page.tsx — 카카오 콜백 처리
- [x] app/admin/service-inquiries/page.tsx — 문의 관리 + 공유 메시지 복사
- [x] STEP 4 카카오 오픈채팅 버튼 (FEE500 노란색)
- [x] Admin 📋 공유 메시지 복사 버튼 (단톡방 공유용)
- [x] 빌드 검증 완료

### 검증
- [x] 코드 자체 테스트 11개 항목 전체 통과 ✅
- [x] 로컬 서버 실행 중 (http://localhost:3000)
- [x] 빌드 성공 (frontend + backend)

---

## 🔧 배포 전 필수 설정 (사용자 직접 처리 필요)

### 카카오 개발자 콘솔 설정
- [ ] 카카오 앱 생성 → REST API 키, 시크릿 키 발급
- [ ] Redirect URI 4개 등록:
  - `http://localhost:3001/auth/kakao/callback` (사장님 로컬)
  - `http://localhost:3001/auth/kakao/customer/callback` (고객 로컬)
  - `https://dreammechaniclab.com/auth/kakao/callback` (사장님 프로덕션)
  - `https://dreammechaniclab.com/auth/kakao/customer/callback` (고객 프로덕션)
- [ ] 카카오 로그인 활성화, 닉네임/이메일 동의항목 설정
- [ ] 가이드: tasks/KAKAO_SETUP.md 참고

### 환경변수 실제 키 입력 (backend/.env)
- [ ] KAKAO_CLIENT_ID — 카카오 REST API 키
- [ ] KAKAO_CLIENT_SECRET — 카카오 앱 시크릿
- [ ] TELEGRAM_BOT_TOKEN — @BotFather에서 발급
- [ ] TELEGRAM_CHAT_ID — 텔레그램 채팅 ID
- [ ] KAKAO_OPENCHAT_URL — 실제 카카오 오픈채팅 링크

### DB 마이그레이션
- [ ] 서버 배포 시 자동 실행 (docker-compose.prod.yml → prisma migrate deploy)
- [ ] 로컬 테스트: DB 서버 연결 후 npx prisma migrate dev

---

## ✅ Phase 2: 통합 문의 관리 시스템 (완료)

### 백엔드 통합 API ✅ 완료 (2026-02-24)
- [x] UnifiedInquiryModule 생성 (3개 테이블 통합 조회)
- [x] 통합 문의 관리 UI (/admin/unified-inquiries) 완성
- [x] 타입별/상태별 필터 + 페이지네이션 + 공유 메시지 복사
- [x] 문의 상세 모달 (고객 클릭 시 원문 전체 보기) ✅ 2026-02-27

### 버그 수정 이력
- [x] 문의관리 배지 실시간 갱신 (CustomEvent 패턴) ✅ 2026-02-26
- [x] 사장님 영업시간/휴무일 수정 미반영 (toJsonField 누락) ✅ 2026-02-27
- [x] 디자인 통일: Owner 전체 페이지 퍼플 #7C4DFF ✅ 2026-02-27

---

## ⏳ Phase 2.5: 커뮤니티 Q&A (플랜 승인, 구현 대기)

### 벤치마크: 친한약사 앱 ("답변 = 홍보" 모델)

### 백엔드
- [ ] DB 스키마: Post, Comment, PostLike 테이블 추가
- [ ] community 모듈 (controller, service, dto)
- [ ] API: CRUD + 좋아요 + 조회수 + 인기순/최신순 정렬
- [ ] JwtPayload에 customer role 추가 (버그 수정)

### 프론트엔드
- [ ] /community — 게시판 목록 (카테고리 필터 + 정렬)
- [ ] /community/write — 글쓰기 (고객 + 정비사 모두 가능)
- [ ] /community/[id] — 게시글 상세 + 댓글/대댓글
- [ ] 정비사 댓글에 매장 정보 자동 노출
- [ ] 네비게이션에 커뮤니티 탭 추가

### 핵심 결정사항
- ✅ 고객 + 정비사 모두 글쓰기 가능
- ✅ 정비사 매장 정보 자동 노출 (체크박스 없이)

---

## ⏳ 남은 작업 (우선순위)

### P0: 유튜브 연동 작전
- [ ] 플랫폼 소개 페이지 (/about) 제작
- [ ] TrackingLink 생성 (?utm_source=youtube_video_01)

### P1: SEO + 자연 유입
- [ ] 메인페이지 메타태그 최적화
- [ ] 정비소 상세 페이지 SEO (/shop/{region}-{name})

### P2: 정비사 경험 고도화
- [ ] 정비사 마이페이지 + 문의 알림
- [ ] 카카오 알림톡 자동 발송 (SOLAPI)

---

## 📅 Phase 3 (3개월 후)

- [ ] 정비소 상세 페이지 SEO (/shop/{region}-{name})
- [ ] 지역별 정비소 목록 (/region/{sido})
- [ ] sitemap.xml 자동 생성
- [ ] Open Graph 메타태그 최적화

---

## 💰 Phase 4 (6개월 후)

- [ ] 구독 티어 (무료 5건/월, 기본 30만원 무제한)
- [ ] 결제 연동 (토스페이먼츠)
- [ ] 카카오 알림톡 자동 발송 (SOLAPI)

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
- [x] 디자인 시스템 문서화

---

## 검토 기록

| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-02-22 | Phase 0~8 완료 | ✅ |
| 2026-02-22 | 타이어 문의 + HTTPS | ✅ |
| 2026-02-23 | Phase 1 MVP 완료 (문의 퍼널 + 카카오 오픈채팅) | ✅ |
| 2026-02-23 | 코드 테스트 11개 항목 전체 통과 | ✅ |
| 2026-02-24 | Phase 2: 백엔드 통합 문의 API 구현 | ✅ |
| 2026-02-26 | 긴급작전: 차량정보 + 개인정보동의 + 사장님 승인제 | ✅ |
| 2026-02-26 | 배지 실시간 갱신 + 1계정1매장 제한 | ✅ |
| 2026-02-26 | 전략 분석 보고서 (STRATEGY.md) | ✅ |
| 2026-02-27 | 영업시간 버그 + 문의 모달 + 디자인 통일 | ✅ |
| 2026-02-27 | 커뮤니티 Q&A 플랜 수립 (친한약사 벤치마킹) | ✅ 플랜 승인 |
