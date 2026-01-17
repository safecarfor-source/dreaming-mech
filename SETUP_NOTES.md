# 로컬 환경 설정 메모

> 클라우드 환경(Claude Code)에서 네트워크 제한으로 실행 못한 작업들을 정리한 파일입니다.
> 로컬에서 개발 시작 전에 이 파일을 참고하세요.

---

## 🚀 진행 상황 요약

| Phase | 상태 | 코드 생성 | 로컬 작업 필요 |
|-------|------|----------|---------------|
| Phase 0: 프로젝트 초기 설정 | ✅ 완료 | ✅ | - |
| Phase 1: 데이터베이스 설계 | ✅ 완료 | ✅ | migration, seed 실행 |
| Phase 2: Backend API 개발 | ✅ 완료 | ✅ | 패키지 설치 |
| Phase 3: Frontend 기본 구조 | ✅ 완료 | ✅ | - |
| Phase 4: 메인 페이지 개발 | ✅ 완료 | ✅ | - |
| Phase 5: 정비사 상세 모달 | ✅ 완료 | ✅ | 네이버맵 API 키 설정 |
| Phase 6: 관리자 페이지 | ✅ 완료 | ✅ | JWT 패키지 설치 필요 |
| Phase 7~10 | ⏳ 대기 | - | - |

---

## 🎨 디자인 시스템 (이상한마케팅 스타일)

### 사이트 정보
- **사이트명**: 꿈꾸는정비사
- **컨셉**: 이상한마케팅 스타일 (풀스크린 히어로, 수치 강조, 권위/신뢰 표현)
- **테마**: 보라색 (#8B5CF6) + 다크/라이트 섹션 전환

### 컬러 팔레트
```css
/* 다크 섹션 (히어로) */
--background: #0a0a0a;
--surface: #111111;
--accent: #8B5CF6;      /* 보라색 메인 */
--accent-light: #A78BFA;
--accent-dark: #7C3AED;
--text-muted: #888888;

/* 라이트 섹션 (목록) */
--light-bg: #ffffff;
--light-surface: #f8f8f8;
--light-text: #111111;
--light-muted: #666666;
```

### 폰트
- **Pretendard** (CDN): 한국어 최적화 산세리프
- layout.tsx의 `<head>`에서 로드

### 핵심 디자인 패턴
1. **히어로 섹션**: 풀스크린, 다크 배경, 큰 수치 강조 (5+, 20+, 98.5%)
2. **목록 섹션**: 흰색 배경, 카드 그리드
3. **애니메이션**: Framer Motion (fade-in, slide-up, hover scale)
4. **네비게이션**: 고정 헤더, 블러 배경

### 컴포넌트 구조
```
frontend/components/
├── Layout.tsx        # 전체 레이아웃 (네비게이션 + 푸터)
├── HeroSection.tsx   # 풀스크린 히어로 (다크)
├── MechanicCard.tsx  # 정비사 카드
├── MechanicModal.tsx # 상세 모달 (슬라이드업)
├── NaverMapView.tsx  # 네이버 지도
└── YouTubeEmbed.tsx  # 유튜브 임베디드
```

### 로컬에서 한 번에 실행할 명령어
```bash
# 1. backend 폴더로 이동
cd backend

# 2. 패키지 재설치 (Prisma 6.x 다운그레이드 포함)
rm -rf node_modules package-lock.json
npm install

# 3. Prisma Client 생성
npx prisma generate

# 4. PostgreSQL 실행 (Docker)
docker-compose up -d

# 5. DB 마이그레이션
npx prisma migrate dev --name init

# 6. Seed 데이터 삽입
npx prisma db seed

# 7. 서버 실행 테스트
npm run start:dev
```

> **참고**: Prisma 7.x에서 설정 방식이 변경되어 6.x로 다운그레이드했습니다.

---

## 1. Prisma 엔진 설정 (완료 여부: ✅)

**문제**: 클라우드에서 Prisma 바이너리 다운로드 403 에러
**해결**: 로컬에서 실행 완료

```bash
cd backend
npx prisma generate
```

---

## 2. Google Fonts (선택사항 - 나중에)

**현재 상태**: 시스템 폰트 사용 중 (동작에 문제 없음)
**필요 시점**: 디자인 완성 단계에서 커스텀 폰트 적용 시

### 방법 A: 로컬 폰트 (권장)
```bash
# 1. 폰트 다운로드 (예: Pretendard)
# https://github.com/orioncactus/pretendard/releases

# 2. 파일 저장
frontend/public/fonts/Pretendard-Regular.woff2
```

```typescript
// frontend/app/layout.tsx
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/Pretendard-Regular.woff2',
  variable: '--font-pretendard',
})
```

### 방법 B: Google Fonts
```typescript
import { Noto_Sans_KR } from 'next/font/google'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})
```

---

## 3. 환경변수 파일

| 파일 | 용도 | 예시 파일 |
|------|------|----------|
| `frontend/.env.local` | API URL, Naver Map Client ID | 직접 생성 필요 |
| `backend/.env` | DB URL, JWT Secret, API Keys | `.env.example` 참고 |

---

## 4. Phase 1: 데이터베이스 초기화

> **실행 시점**: 로컬에서 처음 개발 시작할 때 1회 실행
> **필요 조건**: Docker 설치 필요

### Step 1: PostgreSQL 컨테이너 실행
```bash
cd backend
docker-compose up -d
```
- `docker-compose.yml`에 정의된 PostgreSQL 15 컨테이너 실행
- 포트 5432, DB명: mechanic_db, 유저: postgres/postgres
- `-d`: 백그라운드 실행

### Step 2: 데이터베이스 테이블 생성 (Migration)
```bash
npx prisma migrate dev --name init
```
- `prisma/schema.prisma`에 정의된 모델을 실제 DB 테이블로 생성
- Mechanic, Admin, ClickLog 테이블 생성
- `--name init`: 마이그레이션 이름 (첫 번째이므로 init)

### Step 3: bcrypt 설치 (Seed용)
```bash
npm install bcrypt
npm install -D @types/bcrypt
```
- 관리자 비밀번호 해싱에 필요
- seed.ts에서 사용

### Step 4: 테스트 데이터 삽입 (Seed)
```bash
npx prisma db seed
```
- `prisma/seed.ts` 실행
- 관리자 1명: admin@test.com / admin123
- 정비사 5개: 강남, 서초, 용산, 송파, 마포

### Step 5: 데이터 확인 (선택)
```bash
npx prisma studio
```
- http://localhost:5555 에서 GUI로 데이터 확인
- 테이블별 레코드 조회/수정 가능

---

## 5. Phase 2: Backend API 패키지 설치

> **실행 시점**: Phase 1 완료 후, Backend 개발 시작 전
> **위치**: backend 폴더에서 실행

```bash
cd backend

# Validation 관련
npm install class-validator class-transformer

# HTTP 요청 (Naver Maps API용)
npm install axios @nestjs/axios

# 이미 설치된 경우 스킵
npm install @nestjs/mapped-types
```

### API 엔드포인트 목록
```
GET    /mechanics           # 모든 정비사 조회
GET    /mechanics/:id       # 특정 정비사 조회
POST   /mechanics           # 정비사 생성
PATCH  /mechanics/:id       # 정비사 수정
DELETE /mechanics/:id       # 정비사 삭제 (soft delete)
POST   /mechanics/:id/click # 클릭수 증가

GET    /maps/geocode?address=...  # 주소 → 좌표
GET    /maps/reverse?lat=...&lng=... # 좌표 → 주소

GET    /click-logs/stats/:mechanicId # 클릭 통계
```

---

## 6. 자주 쓰는 명령어

### 개발 서버 실행
```bash
# Frontend (포트 3000)
cd frontend && npm run dev

# Backend (포트 3001)
cd backend && npm run start:dev

# 동시 실행 (루트에서)
npm run dev
```

### Prisma 명령어
```bash
# 스키마 변경 후 마이그레이션
npx prisma migrate dev --name 변경내용

# Prisma Client 재생성
npx prisma generate

# DB 초기화 (주의: 데이터 삭제됨)
npx prisma migrate reset
```

### Docker 명령어
```bash
# 컨테이너 상태 확인
docker ps

# 컨테이너 중지
docker-compose down

# 컨테이너 + 볼륨 삭제 (DB 데이터 삭제)
docker-compose down -v
```
