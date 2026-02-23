# 꿈꾸는정비사 — 작업 추적

> 세션 시작 시 BRAIN.md 먼저 읽을 것!

---

## 🔄 Phase 1 MVP (2026-02-23 진행 중)

### 백엔드
- [x] DB 스키마 확장 — Customer, ServiceInquiry 모델 추가
- [ ] 텔레그램 봇 알림 — NotificationService에 sendTelegramMessage 추가
- [ ] 고객 카카오 OAuth — GET /auth/kakao/customer, /callback
- [ ] ServiceInquiry 모듈 — CRUD API + 텔레그램 연동
- [ ] JwtStrategy — customer_token 쿠키 처리 추가
- [ ] Prisma 마이그레이션 실행
- [ ] 빌드 오류 체크

### 프론트엔드
- [ ] regions.ts — 전국 지역 데이터 + 검색 함수
- [ ] types/index.ts — Customer, ServiceInquiry 타입 추가
- [ ] lib/api.ts — customerAuthApi, serviceInquiryApi 추가
- [ ] lib/customer-store.ts — Zustand 고객 인증 스토어
- [ ] app/page.tsx — 메인페이지 완전 리뉴얼 (4단계 문의 퍼널)
- [ ] app/inquiry/callback/page.tsx — 카카오 콜백 처리
- [ ] 빌드 오류 체크

### 환경설정
- [ ] backend/.env 파일 생성 (카카오 키, 텔레그램 키 입력)
- [ ] 카카오 개발자 콘솔 — Redirect URI 2개 등록

### 검증
- [ ] 로컬 서버 실행 (backend 3001, frontend 3000)
- [ ] 문의 퍼널 E2E 테스트 (지역→서비스→전화번호→카카오→완료)
- [ ] 텔레그램 알림 수신 확인

---

## ⏳ Phase 2 (1~2개월 후)

- [ ] 정비사 회원가입 페이지 (/mechanic/register)
- [ ] 문의 상세 블러 처리 (비가입 시 전화번호 숨김)
- [ ] 정비사 마이페이지 — 문의 목록 조회
- [ ] 정비사 회원가입 폼 (사업자번호, 매장 주소, 전문분야)

---

## 📅 Phase 3 (3개월 후)

- [ ] 정비소 상세 페이지 SEO (/shop/{region}-{name})
- [ ] 지역별 정비소 목록 (/region/{sido})
- [ ] 운영자 대시보드 업그레이드
- [ ] 블로그 섹션 (/blog/{slug})

---

## 💰 Phase 4 (6개월 후)

- [ ] 구독 티어 설계 (무료 5건/월, 기본 30만원 무제한)
- [ ] 결제 연동 (토스페이먼츠)
- [ ] 카카오 알림톡 자동 발송 (SOLAPI)
- [ ] 지역별 카카오 오픈채팅 자동 공유

---

## ✅ 완료된 작업

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
- [x] 디자인 시스템 문서화 (DESIGN_SKILLS_ROADMAP.md)
- [x] CLAUDE.md 작업 규칙

### Phase 1 (2026-02-23)
- [x] 사업 전략 브리핑 분석 (BRAIN.md 작성)
- [x] DB 스키마 확장 (Customer, ServiceInquiry)

---

## 검토 기록

| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-02-22 | Phase 0~8 완료 | ✅ |
| 2026-02-22 | 타이어 문의 + HTTPS | ✅ |
| 2026-02-23 | Phase 1 MVP 시작 | 🔄 진행 중 |
