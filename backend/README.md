# Dreaming Mech - Backend

NestJS 기반의 정비사 관리 시스템 백엔드 API

## 🚀 기술 스택

- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (HttpOnly Cookies)
- **File Storage**: AWS S3
- **Maps API**: Naver Maps API
- **Rate Limiting**: @nestjs/throttler

## 📦 주요 기능

### 1. 정비사 관리 (Mechanic CRUD)
- 정비사 목록 조회
- 정비사 상세 조회
- 정비사 등록/수정/삭제 (관리자)
- 클릭 카운트 증가

### 2. 지도 API (Naver Maps Proxy)
- 주소 → 좌표 변환 (Geocoding)
- 좌표 → 주소 변환 (Reverse Geocoding)

### 3. 인증 시스템
- JWT 기반 인증
- HttpOnly 쿠키로 토큰 관리 (XSS 방지)
- 관리자 로그인/로그아웃

### 4. 이미지 업로드
- AWS S3 통합
- 파일 크기 제한: 10MB
- 지원 포맷: JPEG, PNG, WebP
- JWT 인증 필수

### 5. 통계 및 분석
- 페이지 뷰 추적
- 정비사별 클릭 통계
- 월별 클릭 추이
- 실시간 TOP 정비사

## 🛠️ 환경 설정

### `.env` 파일
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mechanic_db?schema=public"

# JWT
JWT_SECRET="your-secret-key"

# Naver Maps API
NAVER_MAP_CLIENT_ID="your_client_id"
NAVER_MAP_CLIENT_SECRET="your_client_secret"

# AWS S3 (Image Storage)
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"

# AWS CloudFront (Optional)
# AWS_CLOUDFRONT_URL="https://d123456.cloudfront.net"

# CORS
ALLOWED_ORIGINS="http://localhost:3000"

# Admin
ADMIN_PASSWORD="your-admin-password"
```

## 📥 설치 및 실행

### 설치
```bash
npm install
```

### 데이터베이스 마이그레이션
```bash
npx prisma migrate dev
```

### 시드 데이터 생성
```bash
npx prisma db seed
```

### 개발 모드 실행
```bash
npm run start:dev
```

### 프로덕션 빌드
```bash
npm run build
npm run start:prod
```

## 🧪 테스트

### 단위 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### 테스트 커버리지
```bash
npm run test:cov
```

## 📡 API 엔드포인트

### Public APIs

#### Mechanics
- `GET /mechanics` - 정비사 목록 조회
- `GET /mechanics/:id` - 정비사 상세 조회
- `POST /mechanics/:id/click` - 클릭 카운트 증가

#### Maps
- `GET /maps/geocode?address={address}` - 주소 → 좌표
- `GET /maps/reverse?lat={lat}&lng={lng}` - 좌표 → 주소

#### Analytics
- `POST /analytics/pageview` - 페이지 뷰 추적

### Protected APIs (JWT 인증 필요)

#### Auth
- `POST /auth/login` - 관리자 로그인
- `GET /auth/profile` - 프로필 조회
- `POST /auth/logout` - 로그아웃

#### Mechanics (Admin)
- `POST /mechanics` - 정비사 등록
- `PATCH /mechanics/:id` - 정비사 수정
- `DELETE /mechanics/:id` - 정비사 삭제

#### Upload
- `POST /upload/image` - 이미지 업로드 (S3)

#### Analytics (Admin)
- `GET /analytics/site-stats?days={days}` - 사이트 통계
- `GET /analytics/mechanic/:id/monthly?months={months}` - 정비사별 월별 통계
- `GET /analytics/all-mechanics-monthly?months={months}` - 전체 정비사 월별 통계
- `GET /analytics/top-mechanics?period={period}&limit={limit}` - TOP 정비사

## 🔒 보안

### XSS 방지
- JWT 토큰을 HttpOnly 쿠키로 저장
- localStorage 사용 안함

### CORS 설정
- 허용된 오리진만 접근 가능
- Credentials 포함 요청 지원

### Rate Limiting
- 60초당 최대 100회 요청 제한

### 파일 업로드 보안
- JWT 인증 필수
- 파일 크기 제한 (10MB)
- MIME 타입 검증
- 파일 확장자 검증

## 📂 프로젝트 구조

```
backend/
├── src/
│   ├── analytics/          # 통계 및 분석
│   ├── auth/              # JWT 인증
│   ├── click-log/         # 클릭 로그
│   ├── common/            # 공통 모듈
│   ├── maps/              # Naver Maps API
│   ├── mechanic/          # 정비사 CRUD
│   ├── prisma/            # Prisma 서비스
│   ├── upload/            # 이미지 업로드 (S3)
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma      # 데이터베이스 스키마
│   └── seed.ts           # 시드 데이터
└── test/                  # E2E 테스트
```

## 🗄️ 데이터베이스 스키마

### Mechanic (정비사)
- id, name, location, phone, description
- address, mapLat, mapLng
- mainImageUrl, youtubeUrl
- clickCount, isActive
- createdAt, updatedAt

### ClickLog (클릭 로그)
- id, mechanicId, clickedAt

### PageView (페이지 뷰)
- id, path, referer, timestamp

### Admin (관리자)
- id, email, password, name
- createdAt, updatedAt

## 🚀 배포

### PM2 사용
```bash
npm install -g pm2
pm2 start npm --name "mechanic-backend" -- run start:prod
```

### 환경변수 확인
```bash
npm run start:prod
# 로그에서 ✅ 표시 확인
# - Environment validation passed
# - AWS S3 configured successfully
# - Database connected
```

## 📝 라이센스

MIT License

---

**Powered by NestJS** 🚀
