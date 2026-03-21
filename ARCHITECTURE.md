# 아키텍처 다이어그램

> 꿈꾸는정비사 시스템 전체 구조도
> 최종 수정: 2026-03-21

---

## 전체 시스템 구성

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (브라우저)                       │
│                                                         │
│  dreammechaniclab.com/          → 고객용 메인 플랫폼      │
│  dreammechaniclab.com/admin/    → 정비소/고객/문의 관리    │
│  dreammechaniclab.com/incentive/→ 매출/성과/인사이트       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 Nginx (SSL + Reverse Proxy)              │
│                 Let's Encrypt 인증서                      │
│                                                         │
│  /api/*          → localhost:3001  (백엔드 NestJS)       │
│  /api/incentive/* → localhost:3001/incentive/*           │
│  그 외            → localhost:3000  (프론트 Next.js)      │
└───────┬──────────────────────────────────┬──────────────┘
        │                                  │
        ▼                                  ▼
┌───────────────────┐          ┌───────────────────────┐
│  Frontend (3000)  │          │   Backend (3001)      │
│  Next.js 16       │          │   NestJS 11           │
│  React 19         │          │   Prisma ORM          │
│  Tailwind CSS 4   │          │   JWT 인증             │
│  Framer Motion    │          │   class-validator     │
│  zustand (상태)    │          │                       │
│                   │          │         │              │
│  Docker 컨테이너   │          │  Docker 컨테이너       │
└───────────────────┘          └─────────┬─────────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │  PostgreSQL 15     │
                               │  Docker 컨테이너    │
                               │                   │
                               │  Volume:          │
                               │  postgres_data    │
                               │  (external)       │
                               └───────────────────┘
```

---

## 인센티브 시스템 API 구조

```
[프론트엔드 Next.js]
    │
    │ HTTPS (Nginx → localhost:3001)
    │
    ├── /api/incentive/auth/login       → IncentiveAuthController
    ├── /api/incentive/team/*           → TeamController
    ├── /api/incentive/manager/*        → ManagerController
    ├── /api/incentive/director/*       → DirectorController
    ├── /api/incentive/dashboard/*      → DashboardController
    ├── /api/incentive/gd/*             → GdController
    ├── /api/incentive/upload/*         → UploadController
    ├── /api/incentive/auto-calc/*      → AutoCalcController
    ├── /api/incentive/config/*         → ConfigController
    ├── /api/incentive/users/*          → UsersController
    ├── /api/incentive/mapping/*        → MappingController
    ├── /api/incentive/logs/*           → LogsController
    ├── /api/incentive/director/sales-target/*    → SalesTargetController
    └── /api/incentive/manager/sales-target/*     → ManagerSalesTargetController

[백엔드 NestJS]
    │
    ├── Guards
    │   ├── IncentiveJwtGuard     (JWT 토큰 검증)
    │   └── RolesGuard            (역할 기반 접근 제어)
    │
    ├── Filters
    │   └── IncentiveExceptionFilter  (에러 응답 통일)
    │
    ├── Constants
    │   └── rates.ts              (ITEM_RATES, BASE_SALARY, ...)
    │
    ├── Utils
    │   └── kst.ts                (nowKST, todayKST, getYearMonthKST)
    │
    └── Prisma → PostgreSQL
```

---

## 인센티브 데이터 흐름도

```
                    ┌──────────────────┐
                    │   극동 ERP API    │
                    └────────┬─────────┘
                             │ 자동 동기화
                             ▼
              ┌──────────────────────────────┐
              │  GdSaleDetail (매출 상세)      │
              │  GdRepair    (정비 이력)       │
              │  GdVehicle   (차량 정보)       │
              │  GdProduct   (상품 마스터)      │
              └──────────────┬───────────────┘
                             │
         ┌───────────────────┤
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  CSV 업로드      │  │  자동 계산       │
│  (수동 입력)     │  │  (AutoCalc)     │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └────────┬───────────┘
                  ▼
         ┌─────────────────┐
         │ TeamIncentive    │  ← 팀 인센티브 (1단계)
         │ (월별 데이터)     │
         └────────┬────────┘
                  │ 의존
                  ▼
         ┌─────────────────┐
         │ ManagerIncentive │  ← 매니저 인센티브 (2단계)
         │ (월별 데이터)     │
         └────────┬────────┘
                  │ 의존
                  ▼
         ┌─────────────────┐
         │DirectorIncentive │  ← 부장 인센티브 (3단계)
         │ (월별 데이터)     │
         └────────┬────────┘
                  │ 집계
                  ▼
         ┌─────────────────┐
         │   Dashboard      │  ← 전체 현황판 (4단계)
         │ (실시간 집계)     │
         └─────────────────┘
```

**핵심 규칙:** 상위 단계 데이터가 없으면 하위 단계 계산 불가.
순서: 팀 → 매니저 → 부장 → 대시보드

---

## 인증 흐름

```
┌──────────┐     POST /auth/login (LoginDto)     ┌──────────────┐
│  브라우저  │ ─────────────────────────────────→ │  AuthController │
│          │                                     │               │
│          │  ← JWT 토큰 + expiresAt 반환         │  bcrypt 검증   │
│          │                                     │  JWT 발급(7일) │
└─────┬────┘                                     └───────────────┘
      │
      │ localStorage에 저장 (zustand persist)
      │
      ▼
┌──────────┐     Authorization: Bearer {token}   ┌──────────────┐
│  API 호출 │ ─────────────────────────────────→ │  JWT Guard    │
│          │                                     │               │
│          │  ← 200 + 데이터                      │  토큰 검증     │
│          │                                     │  역할 확인     │
│          │  ← 401 (토큰 만료/잘못됨)             │  (RolesGuard) │
└─────┬────┘                                     └───────────────┘
      │
      │ 401 응답 감지 (axios interceptor)
      │
      ▼
┌──────────┐
│ 자동 로그아웃│
│ → /incentive/login 리다이렉트                    │
└──────────┘
```

---

## Nginx 프록시 경로 상세

```
dreammechaniclab.com
    │
    ├── /api/incentive/*   → proxy_pass http://localhost:3001/incentive/*
    │                        (백엔드 인센티브 API)
    │
    ├── /api/*             → proxy_pass http://localhost:3001/*
    │                        (백엔드 일반 API: 정비사, 문의, 커뮤니티 등)
    │
    ├── /incentive/*       → proxy_pass http://localhost:3000/incentive/*
    │                        (프론트엔드 인센티브 페이지)
    │
    └── /*                 → proxy_pass http://localhost:3000/*
                             (프론트엔드 메인 페이지)
```

---

## DB 테이블 관계도

### 인센티브 시스템

```
IncentiveUser (사용자)
    │
    ├── TeamIncentive (팀 인센티브)
    │   PK: id
    │   FK: userId → IncentiveUser.id
    │   UK: userId + year + month (월별 유니크)
    │
    ├── ManagerIncentive (매니저 인센티브)
    │   PK: id
    │   FK: userId → IncentiveUser.id
    │   UK: userId + year + month
    │
    ├── DirectorIncentive (부장 인센티브)
    │   PK: id
    │   FK: userId → IncentiveUser.id
    │   UK: userId + year + month
    │
    ├── CashFlow (시재관리)
    │   PK: id
    │   FK: userId → IncentiveUser.id
    │   필드: openingCash (BigInt), year, month
    │
    └── IncentiveConfig (설정값)
        PK: id
        필드: key (String), value (Json)
```

### 극동 ERP 연동

```
GdVehicle (극동 차량)
    │
    └── GdRepair (정비 이력)
        FK: vehicleId → GdVehicle.id

GdSaleDetail (극동 매출 상세)
    단독 테이블, 매출 원데이터

GdProduct (극동 상품)
    단독 테이블, 상품 마스터
```

### 메인 플랫폼

```
Mechanic (정비소)
    │
    ├── ServiceInquiry (문의)
    │   FK: mechanicId → Mechanic.id
    │
    └── MechanicClick (클릭 로그)

Owner (정비소 사장님)
    FK: mechanicId → Mechanic.id

Customer (고객)
    │
    └── ServiceInquiry (문의)
        FK: customerId → Customer.id

Post (커뮤니티 게시글)
    │
    ├── Comment (댓글)
    │   FK: postId → Post.id
    │
    └── PostLike (좋아요)
        FK: postId → Post.id
```

---

## Docker 구성

```
docker-compose.prod.yml
    │
    ├── postgres (PostgreSQL 15 Alpine)
    │   ├── Port: 내부 전용 (외부 노출 안 함)
    │   ├── Volume: postgres_data (external)
    │   └── Healthcheck: pg_isready
    │
    ├── backend (NestJS)
    │   ├── Port: 3001:3001
    │   ├── Command: prisma migrate deploy && npm run start:prod
    │   ├── 마이그레이션: MIGRATION_DATABASE_URL 사용
    │   ├── 런타임: DATABASE_URL 사용 (app_user)
    │   ├── Depends: postgres (healthy)
    │   └── Healthcheck: /health 엔드포인트
    │
    └── frontend (Next.js)
        ├── Port: 3000:3000
        ├── Build Args: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
        ├── Depends: backend (healthy)
        └── Healthcheck: / 엔드포인트
```

---

## DB 권한 체계

```
┌─────────────────────────────────────────┐
│              PostgreSQL                  │
│                                         │
│  ┌─────────────┐  앱 런타임 전용         │
│  │  app_user   │  SELECT/INSERT/        │
│  │             │  UPDATE/DELETE          │
│  │             │  (ALTER/DROP 불가)      │
│  └─────────────┘                        │
│                                         │
│  ┌───────────────┐  배포 시에만 사용      │
│  │migration_user │  스키마 변경 가능      │
│  │               │  (ALTER/CREATE/DROP)  │
│  └───────────────┘                      │
│                                         │
│  ┌───────────────┐  모니터링 전용        │
│  │ readonly_user │  SELECT만            │
│  └───────────────┘                      │
│                                         │
│  ┌───────────────┐                      │
│  │   postgres    │  슈퍼유저             │
│  │  (사용 금지)   │  앱/코드에서 절대 불가 │
│  └───────────────┘                      │
└─────────────────────────────────────────┘
```

---

## 백업 체계

```
┌─────────────────────────────────────────┐
│          자동 백업 (cron)                 │
│                                         │
│  매일 새벽 2시 실행                       │
│  pg_dump → gzip                         │
│  저장: /home/ubuntu/dreaming-mech/backups/│
│  보관: 30일 (이후 자동 삭제)              │
│                                         │
│  파일명: mechanic_db_YYYYMMDD_020000.sql.gz│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          배포 전 수동 백업                 │
│                                         │
│  스키마 변경이 포함된 배포 시 필수          │
│  docker exec → pg_dump → gzip           │
│                                         │
│  파일명: mechanic_db_manual_YYYYMMDD_*.sql.gz│
└─────────────────────────────────────────┘
```

---

## 파일 구조 요약

```
dreaming-mech/
├── frontend/                    # Next.js 16
│   ├── app/                     # App Router 페이지
│   │   ├── page.tsx             # 메인 페이지
│   │   ├── incentive/           # 인센티브 페이지 (12개)
│   │   ├── admin/               # 관리자 페이지
│   │   └── ...
│   ├── components/              # React 컴포넌트
│   ├── lib/                     # 유틸리티 (API 클라이언트 등)
│   ├── types/                   # TypeScript 타입 정의
│   └── Dockerfile
│
├── backend/                     # NestJS 11
│   ├── src/
│   │   ├── main.ts              # 앱 진입점 (BigInt 전역 설정)
│   │   ├── config/
│   │   │   └── env.validation.ts # 환경변수 검증
│   │   ├── incentive/           # 인센티브 모듈
│   │   │   ├── auth/            # 인증
│   │   │   ├── team/            # 팀 인센티브
│   │   │   ├── manager/         # 매니저 인센티브
│   │   │   ├── director/        # 부장 인센티브
│   │   │   ├── dashboard/       # 대시보드
│   │   │   ├── gd/              # 극동 ERP 연동
│   │   │   ├── upload/          # CSV 업로드
│   │   │   ├── auto-calc/       # 자동 계산
│   │   │   ├── config/          # 설정 관리
│   │   │   ├── users/           # 사용자 관리
│   │   │   ├── mapping/         # 상품코드 매핑
│   │   │   ├── logs/            # 로그
│   │   │   ├── guards/          # 인증 가드
│   │   │   ├── filters/         # 예외 필터
│   │   │   ├── constants/       # 비즈니스 상수
│   │   │   └── utils/           # 유틸리티 (KST 등)
│   │   ├── mechanic/            # 정비소 모듈
│   │   └── common/              # 공통 모듈
│   ├── prisma/
│   │   ├── schema.prisma        # DB 스키마
│   │   └── migrations/          # 마이그레이션 이력
│   └── Dockerfile
│
├── mission-control/             # 상황판 (정적 HTML)
│   └── index.html
│
├── docker-compose.prod.yml      # 프로덕션 Docker 구성
├── CLAUDE.md                    # Claude 작업 규칙
├── DESIGN_SYSTEM.md             # 디자인 시스템
├── DEPLOY_CHECKLIST.md          # 배포 체크리스트 (이 문서)
├── DATA_RULES.md                # 데이터 코드 규칙 (이 문서)
├── ARCHITECTURE.md              # 아키텍처 (이 문서)
└── BRAIN.md                     # 전략/아키텍처 종합
```
