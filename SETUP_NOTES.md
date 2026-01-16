# 로컬 환경 설정 메모

> 클라우드 환경(Claude Code)에서 네트워크 제한으로 실행 못한 작업들을 정리한 파일입니다.
> 로컬에서 개발 시작 전에 이 파일을 참고하세요.

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

## 5. 자주 쓰는 명령어

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
