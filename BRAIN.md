# 🧠 BRAIN.md — 꿈꾸는정비사 전략 외부 저장소
> Claude가 세션 간 기억을 유지하기 위한 핵심 문서.
> 모든 중요한 결정, 전략, 패턴을 여기에 기록.
> 세션 시작 시 반드시 이 파일 먼저 읽을 것.

*마지막 업데이트: 2026-02-27*

---

## 🎯 사업 핵심 전략

### 플랫폼 구조 (양면 시장)
```
[고객] 지역+항목 선택 → 전화번호 입력 → 카카오 로그인 → 문의 접수
                                                          ↓
[운영자] 텔레그램 봇 알림 수신 → 카카오 단톡방(600명+)에 링크 수동 공유
                                                          ↓
[정비사] 링크 클릭 → 회원가입 → 고객 전화번호 확인 → 직접 전화 연결
```

### 왜 전화번호가 핵심인가
- 카카오 소셜 로그인으로는 전화번호를 받을 수 없음 (카카오 정책)
- 타겟 고객(40~60대)은 전화가 가장 익숙한 연락 방식
- 카카오 로그인 = 허들 낮은 가입 수단 / 전화번호 = 실제 연결 수단

### 단계별 전략 (2026-02-26 업데이트)
| 단계 | 시기 | 내용 | 상태 |
|------|------|------|------|
| Phase 1 (MVP) | 완료 | 문의 접수 + 텔레그램 알림 + 카카오 로그인 | ✅ |
| Phase 1.5 | 완료 | 사장님 승인제 + 통합 문의 API + 공유 링크 | ✅ |
| Phase 2 | NOW | 통합 문의 관리 UI + 커뮤니티 Q&A + 유튜브→플랫폼 연결 | 진행 중 |
| Phase 3 | 1~2개월 | SEO + 정비소 상세 페이지 + 알림톡 | 대기 |
| Phase 4 | 3개월+ | 유료화 (무료 5건/월, 기본 30만원 무제한) | 대기 |

### OKR — 2026 상반기
- **Objective:** 정비사가 직접 고객을 찾는 한국 1등 플랫폼
- KR1: 월 문의 100건 / KR2: 등록 정비사 50명 / KR3: 연결률 30% / KR4: 유튜브→플랫폼 월 500명

### 핵심 전략 문서
- 상세 전략: `tasks/STRATEGY.md` 참고

---

## 🏗️ 기술 아키텍처

### 인프라
- **EC2**: ubuntu@13.209.143.155 (ap-northeast-2)
- **PEM**: /Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem
- **서버 경로**: /home/ubuntu/dreaming-mech
- **배포**: Docker Compose (frontend:3000, backend:3001, postgres)
- **Nginx**: SSL (Let's Encrypt), dreammechaniclab.com

### 기술 스택
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion + Zustand
- **Backend**: NestJS 11 + Prisma + PostgreSQL
- **인증**: JWT (HttpOnly 쿠키) + 카카오 OAuth
- **스토리지**: AWS S3 + CloudFront CDN
- **알림**: 텔레그램 Bot API (운영자), SOLAPI 알림톡 (정비사, 나중에)

### DB 모델 구조 (2026-02-23 기준)
```
Admin          — 관리자 (이메일/비밀번호)
Owner          — 정비사 사장님 (카카오 로그인, PENDING/APPROVED/REJECTED)
Mechanic       — 정비소 프로필 (Owner에 연결)
Customer       — 고객 (카카오 로그인 + 전화번호) ← Phase 1 신규
ServiceInquiry — 서비스 문의 (Customer에 연결) ← Phase 1 신규
Inquiry        — 기존 일반 문의 (고객/사장님 문의 폼)
TireInquiry    — 타이어 전용 문의 (구형)
QuoteRequest   — 견적 요청 (특정 정비소 대상)
Review         — 한줄 리뷰
Post           — 커뮤니티 게시글 ← Phase 2 신규 (플랜 승인, 구현 대기)
Comment        — 커뮤니티 댓글 ← Phase 2 신규
PostLike       — 게시글 좋아요 ← Phase 2 신규
ClickLog       — 정비소 클릭 통계
PageView       — 페이지뷰 로그
SyncMessage    — 폰-컴퓨터 동기화
```

### 주요 API 엔드포인트 (Phase 1 신규)
```
GET  /auth/kakao/customer          → 고객 카카오 로그인
GET  /auth/kakao/customer/callback → 고객 콜백 → customer_token 쿠키
POST /service-inquiries            → 문의 접수 (인증 필요, customer role)
GET  /service-inquiries/:id        → 공개 상세 (전화번호 블러)
GET  /service-inquiries/:id/full   → 전체 상세 (관리자)
PATCH /service-inquiries/:id/status → 상태 업데이트 (관리자)
```

---

## 🎨 디자인 시스템 핵심

### 색상 (60-30-10 법칙)
- **60% 배경**: #FFFFFF, #F9FAFB, #F3F4F6
- **30% 퍼플**: #7C4DFF (하나만! var(--brand-500))
- **10% 앰버**: #F59E0B (var(--accent-400))
- ⚠️ #7C3AED, #6D28D9 등 유사 퍼플 혼용 금지

### 타이포그래피 (Minor Third 1.200)
- Display 48px / H1 40px / H2 33px / H3 28px / Body 16px / Caption 13px
- 한글 line-height: 1.6~1.7 (필수)

### 간격 (8px 그리드)
- 4, 8, 12, 16, 24, 32, 48, 64, 96px만 사용
- 반응형 점진적 변화: p-3 → p-4 → p-5 → p-6

---

## 📋 고객 문의 퍼널 설계

### 4단계 플로우
```
STEP 1: 지역 선택
  - 검색형 입력 (타이핑 → 드롭다운)
  - 인기 지역 칩 (인천 서구, 천안시, 수원시 등)

STEP 2: 서비스 선택
  - 🛞 타이어 / 🛢️ 엔진오일 / 🔴 브레이크 / 🔧 경정비 / 💬 종합상담
  - 클릭 즉시 다음 단계

STEP 3: 연락처 입력
  - 전화번호 (필수, 자동 포맷)
  - 추가 설명 (선택)
  - "카카오로 문의 접수" → 카카오 로그인 → 접수 완료

STEP 4: 접수 완료
  - 요약 표시
  - 💛 카카오 오픈채팅 참여하기 버튼 (진행상황 안내)
  - 새로운 문의하기 버튼
```

### 카카오 오픈채팅 전략
- 고객 접수 완료 시 → 오픈채팅 참여 유도 (진행상황 알림용)
- 운영자 → 단톡방(600명+)에 "공유 메시지" 복사해서 붙여넣기
- Admin 대시보드 → "📋 공유 메시지 복사" 버튼 (단톡방용 텍스트 자동 생성)
- 텔레그램은 그대로 유지 (운영자 개인 알림 + 빠른 확인용)

### 카카오 인증 흐름 (중요!)
1. STEP 3에서 버튼 클릭 → 입력 데이터 `sessionStorage`에 저장
2. `/auth/kakao/customer` (백엔드) 리다이렉트 → 카카오 인증
3. 콜백: `/inquiry/callback` 페이지로 돌아옴
4. sessionStorage 복원 → `POST /service-inquiries` API 호출
5. 성공 → STEP 4 표시 (메인페이지 or 완료 페이지)

---

## 🔔 텔레그램 알림 설계

### 환경변수
- `TELEGRAM_BOT_TOKEN`: BotFather에서 발급
- `TELEGRAM_CHAT_ID`: 운영자 개인 채팅 ID

### 메시지 형식
```
🔔 새 정비 문의
📍 지역: 경기도 수원시
🔧 항목: 🛞 타이어
📝 앞 타이어 2개 교체 필요합니다
👉 https://dreammechaniclab.com/admin/inquiries/{id}
```

### 단톡방 공유 템플릿 (운영자가 수동 복사)
```
🔔 고객 문의 도착!
📍 경기도 수원시
🔧 🛞 타이어
👉 상세: https://dreammechaniclab.com/inquiry/{id}
(회원 정비사만 고객 연락처 확인 가능)
```

---

## 🗺️ SEO 전략 (Phase 3)

### URL 구조
```
/                          → 메인 (문의 퍼널)
/inquiry/:id               → 문의 상세 (정비사 공유용)
/inquiry/callback           → 카카오 콜백 처리
/mechanic/register          → 정비사 가입
/mechanic/inquiries         → 정비사 문의 목록
/shop/{region}-{name}       → 정비소 상세 (SEO 핵심)
/region/{sido}              → 지역별 정비소
/blog/{slug}                → 블로그 (SEO용)
/admin                      → 운영자 대시보드
```

### 정비소 페이지 SEO
- 타이틀: "{매장명} - {지역} {전문분야} 추천 | 꿈꾸는정비사 검증"
- 유튜브 영상 임베드 + 카카오맵 + 전화하기 버튼

---

## 💰 수익화 로드맵

### Phase 4 (6개월 후)
- **무료**: 월 5건까지
- **기본**: 30만원/월 → 무제한
- **프리미엄**: 추후 결정 (선착순 매칭, 우선 노출 등)

### 수익 계산
- 정비사 100명 × 30만원 = 월 3,000만원
- 정비사 50명 × 30만원 = 월 1,500만원 (목표)

---

## 🚨 알려진 이슈 & 결정사항

### 카카오 API 제약
- 카카오 로그인으로 전화번호 취득 불가 (정책)
- → 고객이 직접 전화번호 입력 필수
- → 카카오 로그인은 신원 인증 수단으로만 활용

### 카카오 앱 설정 필요
- Redirect URI 2개 등록 필요:
  - `https://dreammechaniclab.com/auth/kakao/callback` (정비사 사장님용)
  - `https://dreammechaniclab.com/auth/kakao/customer/callback` (고객용)
- 로컬 개발: http://localhost:3001 버전도 등록

### 정비사 회원가입 (Phase 2 예정)
- 현재: Owner 시스템이 이미 구현되어 있음 (PENDING/APPROVED/REJECTED)
- Phase 2: 문의 상세 페이지에서 "가입하면 전화번호 확인" 유도

---

## 📅 작업 히스토리

| 날짜 | 작업 | 상태 |
|------|------|------|
| 2026-02-22 | 기본 플랫폼 구축 (Phase 0~8) | ✅ 완료 |
| 2026-02-22 | 타이어 문의 기능 + HTTPS | ✅ 완료 |
| 2026-02-23 | Phase 1 MVP 기획 브리핑 수신 | ✅ |
| 2026-02-23 | DB 스키마 확장 (Customer, ServiceInquiry) | ✅ 완료 |
| 2026-02-23 | Backend: 텔레그램 알림 + 고객 카카오 OAuth + ServiceInquiry API | ✅ 완료 (빌드 성공) |
| 2026-02-23 | Frontend: 메인페이지 리뉴얼 + 4단계 문의 퍼널 | ✅ 완료 (localhost:3000 실행 중) |
| 2026-02-23 | docker-compose.prod.yml + .env 파일 업데이트 | ✅ 완료 |
| 2026-02-24 | 통합 문의 시스템 (UnifiedInquiry API + 비로그인 접수 + 공유 링크) | ✅ 완료·배포 |
| 2026-02-24 | 정비사 이주 작전 (공유 링크 강화 + 로그인 복귀 + 메시지 최적화 + 경량화) | ✅ 완료·배포 |
| 2026-02-24 | 퍼널 실전 테스트 (소비자 4단계 + 정비사 공유 링크) | ✅ 확인 |
| 2026-02-26 | 긴급작전: 차량번호/차종 필드 + 개인정보 동의 체크박스 | ✅ 완료·배포 |
| 2026-02-26 | 사장님 가입 플로우 개선 (PENDING 승인제 + 카카오톡 빠른 문의) | ✅ 완료·배포 |
| 2026-02-26 | 문의관리 배지 실시간 갱신 (CustomEvent 패턴) | ✅ 완료·배포 |
| 2026-02-26 | 카카오 1계정 = 정비소 1개 제한 | ✅ 완료·배포 |
| 2026-02-26 | 전략 분석 보고서 작성 (STRATEGY.md 전쟁 타임라인 추가) | ✅ 완료 |
| 2026-02-27 | 디자인 통일: 전체 Owner 페이지 퍼플 #7C4DFF로 통일 | ✅ 완료·배포 |
| 2026-02-27 | 버그수정: 사장님 영업시간/휴무일 수정 미반영 (toJsonField 누락) | ✅ 완료·배포 |
| 2026-02-27 | 문의 상세 모달: 관리자 페이지 고객 클릭→원문 전체 보기 | ✅ 완료·배포 |
| 2026-02-27 | 커뮤니티 Q&A 플랜 수립 (친한약사 벤치마킹, 플랜 승인) | ✅ 플랜 승인 |

---

## 🔑 환경변수 체크리스트

### Backend (.env)
```bash
DATABASE_URL                 # PostgreSQL
JWT_SECRET                   # JWT 서명키
KAKAO_CLIENT_ID              # 카카오 앱 ID
KAKAO_CLIENT_SECRET          # 카카오 앱 시크릿
KAKAO_CALLBACK_URL           # 정비사용 콜백 (http://localhost:3001/auth/kakao/callback)
KAKAO_CUSTOMER_CALLBACK_URL  # 고객용 콜백 (http://localhost:3001/auth/kakao/customer/callback)
FRONTEND_URL                 # http://localhost:3000
TELEGRAM_BOT_TOKEN           # 텔레그램 봇 토큰 ← 신규
TELEGRAM_CHAT_ID             # 텔레그램 채팅 ID ← 신규
NAVER_MAP_CLIENT_ID          # 네이버 지도 (기존)
AWS_S3_BUCKET / 관련 AWS 설정 # 이미지 업로드 (기존)
ALLOWED_ORIGINS              # CORS
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=cnw5tzm2de
```

---

## 🤝 커뮤니티 Q&A 설계 (2026-02-27 플랜 승인)

### 벤치마크: 친한약사 앱
- 핵심 메커니즘: "답변 = 홍보" 선순환 (정비사가 답변하면 매장이 자동 노출)
- 양쪽 모두 글쓰기 가능 (고객 + 정비사)
- 정비사 댓글에 매장 정보 자동 노출 (체크박스 아닌 자동)

### DB 설계 (3 테이블)
```
Post (게시글)
  - authorRole: CUSTOMER | OWNER (다형성)
  - customerId? / ownerId? (역할에 따라 하나만 사용)
  - category: REPAIR | TIRE | ENGINE_OIL | BRAKE | GENERAL
  - title, content, viewCount, likeCount, commentCount

Comment (댓글)
  - authorRole, customerId?, ownerId?
  - postId → Post 연결
  - parentId? → 대댓글

PostLike (좋아요)
  - postId + authorRole + customerId/ownerId (복합 유니크)
```

### 프론트엔드 라우트
- `/community` — 게시판 목록
- `/community/write` — 글쓰기
- `/community/[id]` — 게시글 상세 + 댓글

---

## 🧩 컴포넌트 재사용 가이드

### 재사용 가능한 컴포넌트
- `KoreaMap` — 지역 선택 (지도 기반)
- `MechanicCard` — 정비소 카드
- `MechanicModal` — 정비소 상세 모달
- `QuickInquiry` — 빠른 문의 (기존)

### Phase 1 신규 컴포넌트
- `InquiryFunnel` — 4단계 문의 퍼널 (메인)
- `RegionSearch` — 검색형 지역 입력
- `ServiceTypeCard` — 서비스 항목 선택 카드

---

## 💡 다음 세션 체크리스트

세션 시작 시 반드시 확인:
1. `tasks/todo.md` — 현재 할 일
2. `tasks/lessons.md` — 과거 실수
3. 이 `BRAIN.md` — 전략 및 맥락
4. 백엔드 `.env` 설정 여부 확인 (카카오 키, 텔레그램 키)
5. `git log --oneline -10` — 최근 커밋 확인
