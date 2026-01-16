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

# 동시 실행 (루트에서)
npm run dev
```

## 기술 스택
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- Backend: NestJS, Prisma, PostgreSQL
- Maps: Naver Maps API
- Deployment: AWS EC2 + Nginx + PM2
