# 꿈꾸는정비사 ⚙️

> 정비소 정보를 관리하고 제공하는 풀스택 웹 애플리케이션

[![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748)](https://www.prisma.io/)

## 📖 문서

**모든 상세한 정보는 통합 문서를 참조하세요:**
### 👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)** 📚

통합 문서에는 다음 내용이 포함되어 있습니다:
- 📋 프로젝트 개요 및 기능
- 🚀 빠른 시작 가이드
- 🏗️ 기술 스택 및 아키텍처
- ⚙️ 개발 환경 설정
- 📡 API 문서 (전체 엔드포인트)
- 🎨 디자인 시스템
- ☁️ AWS S3 설정 가이드
- 🔧 개선 사항 (우선순위별)
- 🚢 배포 가이드
- 🆘 문제 해결

## 🚀 빠른 시작

```bash
# 1. 저장소 클론
git clone <repository-url>
cd dreaming-mech

# 2. Backend 설정
cd backend
npm install
cp .env.example .env
# .env 파일 편집 필요

# 3. Frontend 설정
cd ../frontend
npm install
cp .env.local.example .env.local
# .env.local 파일 편집 필요

# 4. 데이터베이스 초기화
cd ../backend
docker-compose up -d
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 5. 개발 서버 실행
# 터미널 1: Backend
npm run start:dev

# 터미널 2: Frontend
cd ../frontend
npm run dev
```

**접속**: http://localhost:3000

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 16.1.2 (React 19.2.3)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion 12.26.2
- **State Management**: Zustand
- **Charts**: Recharts 3.7.0

### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7.3
- **ORM**: Prisma 6.0.0
- **Database**: PostgreSQL 15
- **Authentication**: JWT (Passport)
- **Storage**: AWS S3

### External Services
- **Maps**: Naver Maps API
- **Storage**: AWS S3 + CloudFront (optional)

## 📂 프로젝트 구조
```
dreaming-mech/
├── backend/          # NestJS 백엔드
├── frontend/         # Next.js 프론트엔드
├── archive/          # 이전 문서 아카이브
├── DOCUMENTATION.md  # 📖 통합 문서 (메인)
└── README.md         # 이 파일
```

## 📊 현재 상태

- ✅ Phase 0-7 완료
- ⏳ Phase 8-10 대기 (반응형, 배포, 테스트)
- 🔄 최근 작업: Cloudinary → AWS S3 마이그레이션 (2026-01-28)

## 📝 주요 기능

### 사용자 기능
- 정비소 목록 조회 및 상세 정보 모달
- 네이버 지도 통합 (위치 표시 및 길찾기)
- 유튜브 쇼츠 임베드
- 클릭 수 자동 증가 (봇 감지)

### 관리자 기능
- JWT 기반 인증
- 정비소 CRUD 관리
- 이미지 업로드 (AWS S3)
- 통계 대시보드:
  - 정비사 통계 (총 조회수, TOP 5)
  - 사이트 트래픽 (페이지뷰, 방문자, 일별 차트)
  - 월별 클릭 추이 차트

## 🔗 관련 문서

- **통합 문서**: [DOCUMENTATION.md](./DOCUMENTATION.md) - **메인 문서**
- **AWS S3 설정**: [backend/AWS_SETUP.md](./backend/AWS_SETUP.md)
- **디자인 시스템**: [frontend/DESIGN_SYSTEM.md](./frontend/DESIGN_SYSTEM.md)
- **아카이브**: [archive/](./archive/) - 이전 개발 문서들

## 📞 문의

- **GitHub Issues**: <repository-url>/issues
- **이메일**: (프로젝트 담당자 이메일)

---

**최종 업데이트**: 2026-01-28 | **버전**: Phase 7 완료
