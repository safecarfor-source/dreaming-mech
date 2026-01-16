# Phase 9: 배포 준비

## 🎯 목표
단일 AWS EC2 인스턴스에 Nginx + PM2를 사용하여 Frontend와 Backend를 함께 배포합니다.

## 💰 비용 예상
- EC2 t3.small: ~$17/월 (t3.micro 프리티어 1년 무료)
- PostgreSQL: EC2 내 설치 시 $0 추가

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                    EC2 (t3.small)                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Nginx (Port 80/443)             │   │
│  │                                              │   │
│  │   /          →  localhost:3000 (Next.js)    │   │
│  │   /api/*     →  localhost:4000 (NestJS)     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │   Next.js    │  │   NestJS     │  │ PostgreSQL│  │
│  │  (PM2:3000)  │  │  (PM2:4000)  │  │  (:5432)  │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Step 9-1: 환경변수 정리

### Frontend `.env.production`
```env
# API는 같은 서버의 Nginx를 통해 프록시됨
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=production_client_id
```

### Backend `.env.production`
```env
# 로컬 PostgreSQL 사용
DATABASE_URL=postgresql://mechanic_user:your_password@localhost:5432/mechanic_db
PORT=4000
JWT_SECRET=super-secret-production-key
NAVER_MAP_CLIENT_ID=xxx
NAVER_MAP_CLIENT_SECRET=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## Step 9-2: EC2 서버 초기 설정

### 1. EC2 인스턴스 생성
- AWS Console → EC2 → Launch Instance
- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: t3.small (또는 t3.micro 프리티어)
- **Storage**: 20GB gp3
- **Security Group**:
  - SSH (22): Your IP
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0

### 2. 서버 초기 설정
```bash
# SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y curl git build-essential
```

### 3. Node.js 설치 (v18 LTS)
```bash
# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 버전 확인
node -v  # v18.x.x
npm -v
```

### 4. PostgreSQL 설치
```bash
# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL 시작 및 활성화
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 및 유저 생성
sudo -u postgres psql
```

```sql
-- PostgreSQL 내에서 실행
CREATE USER mechanic_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE mechanic_db OWNER mechanic_user;
GRANT ALL PRIVILEGES ON DATABASE mechanic_db TO mechanic_user;
\q
```

### 5. PM2 설치
```bash
sudo npm install -g pm2
```

---

## Step 9-3: Nginx 리버스 프록시 설정

### 1. Nginx 설치
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 2. Nginx 설정 파일 생성

#### `/etc/nginx/sites-available/mechanic`
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (NestJS)
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 사이트 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/mechanic /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 4. SSL 인증서 설정 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인이 EC2를 가리키고 있어야 함)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## Step 9-4: PM2로 애플리케이션 배포

### 1. 프로젝트 클론
```bash
# 앱 디렉토리 생성
sudo mkdir -p /var/www/mechanic
sudo chown ubuntu:ubuntu /var/www/mechanic
cd /var/www/mechanic

# Git 클론
git clone https://github.com/your-repo/mechanic-website.git .
```

### 2. Backend 설정 및 빌드
```bash
cd /var/www/mechanic/backend

# 의존성 설치
npm ci --production=false

# .env.production 생성
cp .env.example .env.production
nano .env.production  # 환경변수 입력

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate deploy

# 빌드
npm run build
```

### 3. Frontend 설정 및 빌드
```bash
cd /var/www/mechanic/frontend

# 의존성 설치
npm ci

# .env.production 생성
cp .env.example .env.production
nano .env.production  # 환경변수 입력

# 빌드
npm run build
```

### 4. PM2 Ecosystem 파일 생성

#### `/var/www/mechanic/ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: 'mechanic-frontend',
      cwd: '/var/www/mechanic/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'mechanic-backend',
      cwd: '/var/www/mechanic/backend',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

### 5. PM2로 앱 시작
```bash
cd /var/www/mechanic

# 앱 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 시스템 재부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

### 6. 배포 업데이트 스크립트

#### `/var/www/mechanic/deploy.sh`
```bash
#!/bin/bash
set -e

echo "🚀 Deploying mechanic website..."

cd /var/www/mechanic

# 최신 코드 가져오기
git pull origin main

# Backend 업데이트
echo "📦 Building backend..."
cd backend
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend 업데이트
echo "📦 Building frontend..."
cd ../frontend
npm ci
npm run build

# PM2 재시작
echo "🔄 Restarting PM2..."
cd ..
pm2 restart ecosystem.config.js

echo "✅ Deployment complete!"
```

```bash
# 실행 권한 부여
chmod +x /var/www/mechanic/deploy.sh

# 배포 실행
./deploy.sh
```

---

## ✅ Phase 9 완료

배포 체크리스트:
- [ ] EC2 인스턴스 생성
- [ ] Node.js, PostgreSQL 설치
- [ ] 데이터베이스 및 유저 생성
- [ ] Nginx 설치 및 리버스 프록시 설정
- [ ] SSL 인증서 설정 (Let's Encrypt)
- [ ] 프로젝트 클론 및 빌드
- [ ] PM2 ecosystem 설정
- [ ] 앱 시작 및 자동 재시작 설정
- [ ] 배포 스크립트 작성
- [ ] 프로덕션 테스트

### 유용한 명령어
```bash
# PM2 상태 확인
pm2 status

# 로그 실시간 확인
pm2 logs

# 앱 재시작
pm2 restart all

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

```bash
git push origin feature/phase-9-deployment
```

**다음**: [Phase 10 - 테스트 & 최적화](./phase-10.md)
