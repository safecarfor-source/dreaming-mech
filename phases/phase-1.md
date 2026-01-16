# Phase 1: 데이터베이스 설계 및 설정

## 🎯 목표
Prisma를 사용하여 정비사, 관리자, 클릭 로그 테이블을 정의하고 초기 데이터를 생성합니다.

## 📋 사전 준비
- Phase 0 완료
- PostgreSQL 설치 또는 Docker 준비

---

## Step 1-1: Prisma Schema 작성

### 작업 내용
데이터베이스 모델을 정의합니다.

### 파일 수정

#### `backend/prisma/schema.prisma`
```prisma
// Prisma Schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 정비사 모델
model Mechanic {
  id          Int      @id @default(autoincrement())
  name        String   // 정비소 이름
  location    String   // 지역명 (예: 강남구, 서초구)
  phone       String   // 전화번호
  description String?  @db.Text // 설명
  address     String   // 상세 주소
  
  // 지도 좌표 (Decimal 타입으로 정확도 유지)
  mapLat      Decimal  @db.Decimal(10, 8) // 위도
  mapLng      Decimal  @db.Decimal(11, 8) // 경도
  
  // 이미지
  mainImageUrl    String?  // 대표 이미지 URL
  galleryImages   Json?    // 갤러리 이미지 배열 ["url1", "url2", ...]
  
  // 유튜브
  youtubeUrl      String?  // 유튜브 쇼츠 URL
  
  // 통계
  clickCount      Int      @default(0) // 클릭 수
  
  // 상태
  isActive        Boolean  @default(true) // 활성화 여부
  
  // 타임스탬프
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // 관계
  clickLogs       ClickLog[]
  
  // 인덱스
  @@index([location]) // 지역별 검색 최적화
  @@index([isActive])
}

// 관리자 모델
model Admin {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // bcrypt 해시
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 클릭 로그 모델
model ClickLog {
  id         Int      @id @default(autoincrement())
  mechanicId Int
  mechanic   Mechanic @relation(fields: [mechanicId], references: [id], onDelete: Cascade)
  ipAddress  String?  // 클릭한 IP
  clickedAt  DateTime @default(now())
  
  @@index([mechanicId])
  @@index([clickedAt])
}
```

### 데이터베이스 타입 설명
```typescript
// Decimal 타입 사용 이유:
// Float는 부동소수점 오차 발생 → 좌표가 부정확해질 수 있음
// Decimal은 정확한 좌표 저장 가능

// Json 타입 사용 이유:
// 갤러리 이미지 개수가 가변적 → 배열로 저장
```

### 커밋
```bash
git add .
git commit -m "feat(backend): Prisma schema 정의"
```

---

## Step 1-2: Migration 실행

### 작업 내용
Prisma 스키마를 실제 데이터베이스에 반영합니다.

### PostgreSQL 준비 (Docker 사용)

#### `backend/docker-compose.yml` (새로 생성)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: mechanic_db
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mechanic_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### PostgreSQL 실행
```bash
cd backend

# Docker로 PostgreSQL 실행
docker-compose up -d

# 상태 확인
docker ps
# mechanic_db가 실행 중이어야 함
```

### .env 파일 확인

#### `backend/.env`
```env
# Docker 사용 시
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mechanic_db?schema=public"

# 로컬 PostgreSQL 사용 시
# DATABASE_URL="postgresql://user:password@localhost:5432/mechanic_db?schema=public"
```

### Migration 실행
```bash
cd backend

# Prisma migrate
npx prisma migrate dev --name init

# 출력 예상:
# ✔ Generated Prisma Client
# ✔ The migration has been generated
# ✔ Your database is now in sync with your schema
```

### Prisma Client 생성
```bash
npx prisma generate

# 출력 예상:
# ✔ Generated Prisma Client
```

### 데이터베이스 확인
```bash
# Prisma Studio 실행 (GUI 툴)
npx prisma studio

# http://localhost:5555 에서 확인
# Mechanic, Admin, ClickLog 테이블 확인
```

### 커밋
```bash
git add .
git commit -m "feat(backend): migration 실행 및 DB 생성"
```

---

## Step 1-3: Seed 데이터 작성

### 작업 내용
테스트용 더미 데이터를 생성합니다.

### bcrypt 설치
```bash
cd backend
npm install bcrypt
npm install -D @types/bcrypt
```

### Seed 파일 생성

#### `backend/prisma/seed.ts` (새로 생성)
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 관리자 생성
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: '관리자',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 정비사 더미 데이터 (서울 지역 실제 좌표)
  const mechanics = [
    {
      name: '강남 오토센터',
      location: '강남구',
      phone: '02-1234-5678',
      description: '수입차 전문 정비소입니다. 20년 경력의 숙련된 기술자가 정성껏 관리해드립니다.',
      address: '서울시 강남구 테헤란로 123',
      mapLat: 37.5012743,
      mapLng: 127.0396597,
      mainImageUrl: 'https://via.placeholder.com/800x600/4A5568/FFFFFF?text=강남+오토센터',
      galleryImages: [
        'https://via.placeholder.com/400x300/4A5568/FFFFFF?text=Image+1',
        'https://via.placeholder.com/400x300/4A5568/FFFFFF?text=Image+2',
      ],
      youtubeUrl: 'https://www.youtube.com/shorts/example1',
      clickCount: 0,
    },
    {
      name: '서초 모터스',
      location: '서초구',
      phone: '02-2345-6789',
      description: '국산차, 수입차 모두 가능한 종합 정비소입니다.',
      address: '서울시 서초구 서초대로 456',
      mapLat: 37.4833,
      mapLng: 127.0322,
      mainImageUrl: 'https://via.placeholder.com/800x600/6B7280/FFFFFF?text=서초+모터스',
      galleryImages: [
        'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Image+1',
      ],
      youtubeUrl: null,
      clickCount: 0,
    },
    {
      name: '용산 카센터',
      location: '용산구',
      phone: '02-3456-7890',
      description: '엔진 전문 정비소. 엔진 오버홀 전문.',
      address: '서울시 용산구 한강대로 789',
      mapLat: 37.5326,
      mapLng: 126.9652,
      mainImageUrl: 'https://via.placeholder.com/800x600/9CA3AF/FFFFFF?text=용산+카센터',
      galleryImages: null,
      youtubeUrl: 'https://www.youtube.com/shorts/example2',
      clickCount: 5,
    },
    {
      name: '송파 정비공업사',
      location: '송파구',
      phone: '02-4567-8901',
      description: '빠르고 정확한 진단. 합리적인 가격.',
      address: '서울시 송파구 올림픽로 321',
      mapLat: 37.5145,
      mapLng: 127.1065,
      mainImageUrl: 'https://via.placeholder.com/800x600/D1D5DB/000000?text=송파+정비공업사',
      galleryImages: [
        'https://via.placeholder.com/400x300/D1D5DB/000000?text=Image+1',
        'https://via.placeholder.com/400x300/D1D5DB/000000?text=Image+2',
        'https://via.placeholder.com/400x300/D1D5DB/000000?text=Image+3',
      ],
      youtubeUrl: null,
      clickCount: 12,
    },
    {
      name: '마포 자동차정비',
      location: '마포구',
      phone: '02-5678-9012',
      description: '친절하고 꼼꼼한 정비 서비스.',
      address: '서울시 마포구 마포대로 654',
      mapLat: 37.5597,
      mapLng: 126.9089,
      mainImageUrl: 'https://via.placeholder.com/800x600/E5E7EB/000000?text=마포+자동차정비',
      galleryImages: null,
      youtubeUrl: 'https://www.youtube.com/shorts/example3',
      clickCount: 3,
    },
  ];

  for (const mechanic of mechanics) {
    const created = await prisma.mechanic.create({
      data: mechanic,
    });
    console.log('✅ Mechanic created:', created.name);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### package.json에 seed 스크립트 추가

#### `backend/package.json`
```json
{
  "name": "backend",
  ...
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  ...
}
```

### ts-node 설치
```bash
npm install -D ts-node
```

### Seed 실행
```bash
npx prisma db seed

# 출력 예상:
# 🌱 Seeding database...
# ✅ Admin created: admin@test.com
# ✅ Mechanic created: 강남 오토센터
# ✅ Mechanic created: 서초 모터스
# ...
# 🎉 Seeding completed!
```

### 데이터 확인
```bash
# Prisma Studio로 확인
npx prisma studio

# 확인 사항:
# - Admin 테이블: 1개 레코드
# - Mechanic 테이블: 5개 레코드
# - 각 정비사의 좌표 확인
```

### 커밋
```bash
git add .
git commit -m "feat(backend): seed 데이터 생성"
```

---

## ✅ Phase 1 완료 체크리스트

```markdown
- [ ] Step 1-1: Prisma Schema 작성
  - [ ] Mechanic 모델 정의
  - [ ] Admin 모델 정의
  - [ ] ClickLog 모델 정의
  - [ ] 인덱스 설정
  - [ ] 커밋 완료

- [ ] Step 1-2: Migration 실행
  - [ ] Docker PostgreSQL 실행
  - [ ] .env DATABASE_URL 설정
  - [ ] prisma migrate dev 실행
  - [ ] prisma generate 실행
  - [ ] Prisma Studio로 테이블 확인
  - [ ] 커밋 완료

- [ ] Step 1-3: Seed 데이터 작성
  - [ ] bcrypt 설치
  - [ ] seed.ts 파일 작성
  - [ ] ts-node 설치
  - [ ] package.json에 seed 스크립트 추가
  - [ ] seed 실행 성공
  - [ ] Prisma Studio로 데이터 확인
  - [ ] 커밋 완료
```

---

## 🧪 최종 테스트

### 1. 데이터베이스 연결 테스트
```bash
# Prisma Studio 실행
npx prisma studio

# http://localhost:5555 접속
# 테이블 3개 확인: Mechanic, Admin, ClickLog
```

### 2. 데이터 확인
```
Mechanic 테이블:
- 5개 레코드 확인
- 좌표 값 확인 (37.xxxx, 127.xxxx)
- clickCount 값 확인

Admin 테이블:
- 1개 레코드 확인
- email: admin@test.com
```

### 3. Prisma Client 사용 테스트

#### `backend/src/app.controller.ts` 수정
```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller()
export class AppController {
  @Get('mechanics')
  async getMechanics() {
    return await prisma.mechanic.findMany();
  }
}
```

```bash
# 서버 실행
npm run start:dev

# 테스트
curl http://localhost:3001/mechanics
# 또는 브라우저에서 http://localhost:3001/mechanics 접속
# 5개 정비사 데이터가 JSON으로 반환되어야 함
```

---

## 🚀 다음 단계

Phase 1 완료! GitHub에 푸시합니다.

```bash
git push origin feature/phase-1-database

# GitHub에서 PR 생성
# Title: feat(phase-1): 데이터베이스 스키마 및 seed 데이터 생성
# Squash and Merge

git checkout develop
git pull origin develop
```

**다음**: [Phase 2 - Backend API 개발](./phase-2.md)

---

## 🆘 문제 해결

### Q: Migration 실행 시 "Can't reach database server" 에러
```bash
# Docker 컨테이너 상태 확인
docker ps -a

# 컨테이너 재시작
docker-compose down
docker-compose up -d

# 포트 5432가 사용 중인지 확인
lsof -i :5432
```

### Q: Seed 실행 시 타입 에러
```bash
# ts-node가 제대로 설치되었는지 확인
npm list ts-node

# 재설치
npm uninstall ts-node
npm install -D ts-node
```

### Q: Prisma Studio가 안 열림
```bash
# 포트 5555가 사용 중인지 확인
lsof -i :5555

# 다른 포트로 열기
npx prisma studio --port 5556
```

### Q: Decimal 타입 관련 에러
```typescript
// Prisma에서 Decimal은 자동으로 number로 변환됨
// seed.ts에서 그냥 숫자로 입력하면 됨
mapLat: 37.5012743,  // ✅ 이렇게
mapLat: new Decimal(37.5012743),  // ❌ 이렇게 안해도 됨
```
