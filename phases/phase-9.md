# Phase 9: 배포 준비

## 🎯 목표
Docker 설정 및 AWS/Vercel 배포를 준비합니다.

---

## Step 9-1: 환경변수 정리

### Frontend `.env.production`
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=production_client_id
```

### Backend `.env.production`
```env
DATABASE_URL=postgresql://user:pass@aws-rds-endpoint:5432/mechanic_db
JWT_SECRET=super-secret-production-key
NAVER_MAP_CLIENT_ID=xxx
NAVER_MAP_CLIENT_SECRET=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## Step 9-2: Docker 설정

### Backend Dockerfile

#### `backend/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### Frontend Dockerfile

#### `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml (루트)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mechanic_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mechanic_db
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Step 9-3: Backend 배포 (AWS ECS)

### 1. ECR에 이미지 푸시
```bash
cd backend

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin {account-id}.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드
docker build -t mechanic-backend .

# 태그
docker tag mechanic-backend:latest {account-id}.dkr.ecr.ap-northeast-2.amazonaws.com/mechanic-backend:latest

# 푸시
docker push {account-id}.dkr.ecr.ap-northeast-2.amazonaws.com/mechanic-backend:latest
```

### 2. RDS PostgreSQL 생성
- AWS Console → RDS
- PostgreSQL 15 선택
- db.t3.micro (프리티어)
- Public access: Yes
- 보안 그룹: 5432 포트 오픈

### 3. ECS Task Definition
```json
{
  "family": "mechanic-backend",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "{ecr-image-url}",
      "memory": 512,
      "cpu": 256,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ]
    }
  ]
}
```

### 4. ECS Service 생성
- Fargate 선택
- ALB 연결
- HTTPS 설정 (ACM 인증서)

---

## Step 9-4: Frontend 배포 (Vercel)

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 배포
```bash
cd frontend
vercel

# 프롬프트:
# Set up and deploy? Yes
# Link to existing project? No
# Project name: mechanic-website
```

### 3. 환경변수 설정
```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_NAVER_MAP_CLIENT_ID production
```

### 4. 프로덕션 배포
```bash
vercel --prod
```

### 5. 커스텀 도메인 연결
- Vercel Dashboard → Domains
- Add Domain: yourdomain.com
- DNS 설정 (A, CNAME 레코드)

---

## ✅ Phase 9 완료

배포 체크리스트:
- [ ] Backend Docker 이미지 빌드
- [ ] RDS PostgreSQL 생성
- [ ] ECR 푸시
- [ ] ECS 서비스 생성
- [ ] ALB/HTTPS 설정
- [ ] Frontend Vercel 배포
- [ ] 환경변수 설정
- [ ] 도메인 연결
- [ ] 프로덕션 테스트

```bash
git push origin feature/phase-9-deployment
```

**다음**: [Phase 10 - 테스트 & 최적화](./phase-10.md)
