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

## ⏳ Phase 2: 통합 문의 관리 시스템 (진행 중)

### 백엔드 통합 API ✅ 완료 (2026-02-24)
- [x] UnifiedInquiryModule 생성
  - `/Users/shinjeayoun/dreaming-mech/backend/src/unified-inquiry/unified-inquiry.service.ts`
  - `/Users/shinjeayoun/dreaming-mech/backend/src/unified-inquiry/unified-inquiry.controller.ts`
  - `/Users/shinjeayoun/dreaming-mech/backend/src/unified-inquiry/unified-inquiry.module.ts`
- [x] app.module.ts에 모듈 등록
- [x] 3개 테이블 통합 조회 API
  - Inquiry (GENERAL) → 정비사 문의
  - ServiceInquiry (SERVICE) → 고객 정비 문의
  - QuoteRequest (QUOTE) → 견적 요청
- [x] 빌드 검증 완료

### API 엔드포인트 (관리자 전용)
- `GET /unified-inquiries?page=1&limit=20` — 통합 목록 조회
- `GET /unified-inquiries/count` — 총 건수 (뱃지용)
- `PATCH /unified-inquiries/:type/:id/status` — 상태 변경
- `GET /unified-inquiries/:type/:id/share-message` — 공유 메시지

### 프론트엔드 (다음 작업)
- [ ] /admin/inquiries — 통합 문의 관리 페이지
- [ ] 타입별 필터 (GENERAL/SERVICE/QUOTE)
- [ ] 상태별 필터 (PENDING/SHARED/COMPLETED)
- [ ] 페이지네이션 (무한 스크롤)
- [ ] 공유 메시지 복사 버튼
- [ ] /inquiry/:id 공개 상세 페이지 — 비회원 시 전화번호 블러 처리
- [ ] /mechanic/register — 정비사 회원가입 유도 페이지
- [ ] 정비사 마이페이지 (/mechanic/inquiries) — 문의 목록 조회
- [ ] 정비사 승인 시 SMS/알림톡 발송

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
