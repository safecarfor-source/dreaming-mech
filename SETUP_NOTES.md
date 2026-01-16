# 로컬 환경 설정 메모

## 1. Prisma 엔진 설정
클라우드 환경에서 네트워크 제한으로 Prisma 엔진 다운로드 실패.
로컬에서 아래 명령 실행 완료:

```bash
cd backend
npx prisma generate
```

## 2. Google Fonts (선택사항)
현재 시스템 폰트 사용 중. 나중에 커스텀 폰트가 필요하면:

### 방법 A: 로컬 폰트 사용
```bash
# 폰트 파일 다운로드 후 저장
frontend/public/fonts/Pretendard-Regular.woff2
```

```typescript
// frontend/app/layout.tsx
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/Pretendard-Regular.woff2',
  variable: '--font-pretendard',
})

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### 방법 B: Google Fonts (네트워크 필요)
```typescript
// frontend/app/layout.tsx
import { Noto_Sans_KR } from 'next/font/google'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})
```

## 3. 환경변수 설정
로컬 개발 시 아래 파일들 확인:

- `frontend/.env.local` - API URL, Naver Map Client ID
- `backend/.env` - DB URL, JWT Secret, API Keys

---

## 4. Phase 1: 로컬에서 실행할 명령어

### PostgreSQL 실행 (Docker)
```bash
cd backend
docker-compose up -d
```

### Migration 실행
```bash
cd backend
npx prisma migrate dev --name init
```

### Seed 데이터 생성
```bash
cd backend
npm install bcrypt
npm install -D @types/bcrypt
npx prisma db seed
```

### 데이터 확인
```bash
npx prisma studio
# http://localhost:5555 에서 확인
```
