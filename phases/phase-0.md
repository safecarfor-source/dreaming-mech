# Phase 0: 프로젝트 초기 설정

## 🎯 목표
모노레포 구조로 Frontend(Next.js)와 Backend(NestJS)를 분리하여 프로젝트 기본 구조를 구축합니다.

## 📦 준비물
- Node.js 18+ 설치 확인
- Git 설치 확인
- 코드 에디터 (VS Code 추천)

---

## Step 0-1: 프로젝트 구조 생성

### 작업 내용
루트 디렉토리와 기본 파일들을 생성합니다.

### 명령어
```bash
# 프로젝트 루트 디렉토리 생성 (이미 있으면 스킵)
mkdir -p mechanic-website
cd mechanic-website

# Git 초기화 (이미 있으면 스킵)
git init
git branch -M main
```

### 생성할 파일

#### 1. `.gitignore` (루트)
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Prisma
backend/prisma/migrations/

# Misc
*.pem
```

#### 2. `README.md` (루트)
```markdown
# 정비사 웹사이트

## 프로젝트 구조
- `/frontend` - Next.js 14 (TypeScript)
- `/backend` - NestJS (TypeScript + Prisma)

## 개발 환경 실행
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run start:dev
```

## 기술 스택
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- Backend: NestJS, Prisma, PostgreSQL
- Maps: Naver Maps API
```

#### 3. `package.json` (루트)
```json
{
  "name": "mechanic-website",
  "version": "1.0.0",
  "description": "정비사 정보 관리 웹사이트",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run start:dev",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### 커밋
```bash
git add .
git commit -m "chore: 프로젝트 구조 생성"
```

---

## Step 0-2: Frontend 초기화

### 작업 내용
Next.js 14 프로젝트를 생성하고 Tailwind CSS를 설정합니다.

### 명령어
```bash
# Next.js 프로젝트 생성
npx create-next-app@latest frontend

# 프롬프트 응답:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? No
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No
```

### 폴더 구조 생성
```bash
cd frontend

# 폴더 생성
mkdir -p components
mkdir -p lib
mkdir -p types
mkdir -p utils
mkdir -p styles

# app 디렉토리는 이미 생성되어 있음
```

### 불필요한 파일 정리
```bash
# frontend/app/page.tsx 간소화
```

#### `frontend/app/page.tsx`
```typescript
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">정비사 웹사이트</h1>
      <p className="mt-4 text-gray-600">개발 진행 중...</p>
    </main>
  );
}
```

### 필요한 패키지 추가 설치
```bash
cd frontend

# 상태 관리
npm install zustand

# API 통신
npm install axios
npm install @tanstack/react-query

# 애니메이션
npm install framer-motion

# 아이콘
npm install lucide-react

# 네이버 지도 (나중에 사용하지만 미리 설치)
npm install react-naver-maps
```

### Tailwind 설정 커스터마이징

#### `frontend/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          light: '#333333',
        },
        accent: {
          yellow: '#FFD700',
          red: '#FF0000',
        },
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1' }],
        'display': ['3rem', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
}
export default config
```

### 환경변수 파일 생성

#### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here
```

### 테스트
```bash
npm run dev
# http://localhost:3000 에서 확인
```

### 커밋
```bash
git add .
git commit -m "feat(frontend): Next.js 14 + Tailwind 초기 설정"
```

---

## Step 0-3: Backend 초기화

### 작업 내용
NestJS 프로젝트를 생성하고 Prisma를 설정합니다.

### 명령어
```bash
# 루트 디렉토리로 이동
cd ..

# NestJS 프로젝트 생성
npm i -g @nestjs/cli
nest new backend

# 프롬프트 응답:
# ⚡  Which package manager would you ❤️  to use? npm
```

### Prisma 설치
```bash
cd backend

# Prisma 설치
npm install prisma @prisma/client

# Prisma 초기화
npx prisma init
```

### 환경변수 설정

#### `backend/.env`
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mechanic_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Naver Maps API
NAVER_MAP_CLIENT_ID="your_client_id"
NAVER_MAP_CLIENT_SECRET="your_client_secret"

# Cloudinary (나중에 사용)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### 포트 변경 (3001)

#### `backend/src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS 설정
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
}
bootstrap();
```

### 불필요한 파일 정리

#### `backend/src/app.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 테스트
```bash
npm run start:dev
# http://localhost:3001 에서 확인
# http://localhost:3001/health 에서 헬스체크 확인
```

### 커밋
```bash
git add .
git commit -m "feat(backend): NestJS + Prisma 초기 설정"
```

---

## ✅ Phase 0 완료 체크리스트

```markdown
- [ ] Step 0-1: 프로젝트 구조 생성
  - [ ] .gitignore 생성
  - [ ] README.md 생성
  - [ ] package.json 생성
  - [ ] 커밋 완료

- [ ] Step 0-2: Frontend 초기화
  - [ ] Next.js 프로젝트 생성
  - [ ] 폴더 구조 생성
  - [ ] 필요한 패키지 설치
  - [ ] Tailwind 설정
  - [ ] .env.local 생성
  - [ ] localhost:3000 접속 확인
  - [ ] 커밋 완료

- [ ] Step 0-3: Backend 초기화
  - [ ] NestJS 프로젝트 생성
  - [ ] Prisma 설치 및 초기화
  - [ ] .env 파일 생성
  - [ ] 포트 3001로 변경
  - [ ] CORS 설정
  - [ ] localhost:3001 접속 확인
  - [ ] 커밋 완료
```

---

## 🧪 최종 테스트

### 1. Frontend 확인
```bash
cd frontend
npm run dev
# http://localhost:3000 접속
# "정비사 웹사이트" 제목 확인
```

### 2. Backend 확인
```bash
cd backend
npm run start:dev
# http://localhost:3001 접속
# "Hello World!" 확인
# http://localhost:3001/health 접속
# {"status":"ok",...} 확인
```

### 3. 동시 실행 (루트에서)
```bash
npm install  # concurrently 설치
npm run dev  # 동시 실행
```

---

## 🚀 다음 단계

Phase 0 완료! 이제 GitHub에 푸시하고 다음으로 진행합니다.

```bash
# 현재 브랜치 확인
git branch
# * feature/phase-0-setup

# Push
git push origin feature/phase-0-setup

# GitHub에서 PR 생성
# Title: feat(phase-0): 프로젝트 초기 설정 완료
# Description: Phase 0 체크리스트 붙여넣기
# Squash and Merge 선택

# develop으로 전환
git checkout develop
git pull origin develop
```

**다음**: [Phase 1 - 데이터베이스 설계](./phase-1.md)

---

## 🆘 문제 해결

### Q: Next.js 설치 시 에러 발생
```bash
# npm 캐시 클리어
npm cache clean --force
# 다시 시도
```

### Q: NestJS 포트 이미 사용 중
```bash
# 포트 3001 사용 중인 프로세스 확인
lsof -i :3001
# 프로세스 종료
kill -9 <PID>
```

### Q: Prisma 초기화 시 에러
```bash
# Prisma 재설치
npm uninstall prisma @prisma/client
npm install prisma @prisma/client
npx prisma init
```
