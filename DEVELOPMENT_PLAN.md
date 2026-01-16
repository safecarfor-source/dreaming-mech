# 정비사 웹사이트 개발 계획

## 📌 프로젝트 개요

**목표**: 정비사 정보를 관리하고 표시하는 웹/모바일 반응형 웹사이트 구축

**기술 스택**:
- Frontend: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- Backend: NestJS + Prisma + PostgreSQL
- Maps: Naver Maps API
- Deployment: AWS EC2 + Nginx + PM2

---

## 🔀 Git 워크플로우

### 브랜치 전략
```
main (프로덕션)
  └── develop (개발 통합)
      └── feature/phase-X-name (Phase별 작업)
```

### 작업 방식
1. **작업 중**: 자주 커밋 (wip, temp, save 등 자유롭게)
2. **완료 후**: GitHub PR 생성 → Squash and Merge
3. **결과**: develop에는 깔끔한 커밋만 남음

### 기본 명령어
```bash
# Phase 시작
git checkout develop
git pull origin develop
git checkout -b feature/phase-X-name

# 작업 중 자주 커밋
git add .
git commit -m "wip: 작업 내용"
git push origin feature/phase-X-name

# Phase 완료
# → GitHub에서 PR 생성
# → Squash and Merge 선택
# → develop에 머지

# 다음 Phase 시작
git checkout develop
git pull origin develop
git checkout -b feature/phase-Y-name
```

---

## 📋 Phase 목록 (총 11개 Phase, 45 Steps)

| Phase | 제목 | Steps | 파일 |
|-------|------|-------|------|
| Phase 0 | 프로젝트 초기 설정 | 3 | [phase-0.md](./phases/phase-0.md) |
| Phase 1 | 데이터베이스 설계 | 3 | [phase-1.md](./phases/phase-1.md) |
| Phase 2 | Backend API 개발 | 6 | [phase-2.md](./phases/phase-2.md) |
| Phase 3 | Frontend 기본 구조 | 4 | [phase-3.md](./phases/phase-3.md) |
| Phase 4 | 메인 페이지 개발 | 4 | [phase-4.md](./phases/phase-4.md) |
| Phase 5 | 정비사 상세 모달 | 5 | [phase-5.md](./phases/phase-5.md) |
| Phase 6 | 관리자 페이지 | 7 | [phase-6.md](./phases/phase-6.md) |
| Phase 7 | 이미지 업로드 | 3 | [phase-7.md](./phases/phase-7.md) |
| Phase 8 | 반응형 & 애니메이션 | 3 | [phase-8.md](./phases/phase-8.md) |
| Phase 9 | 배포 준비 | 4 | [phase-9.md](./phases/phase-9.md) |
| Phase 10 | 테스트 & 최적화 | 3 | [phase-10.md](./phases/phase-10.md) |

---

## 🎯 시작하기

### 1단계: 저장소 초기화
```bash
# 로컬에 클론
git clone <repository-url>
cd <repository-name>

# develop 브랜치 생성
git checkout -b develop
git push -u origin develop
```

### 2단계: Phase 0부터 시작
```bash
# Phase 0 가이드 확인
cat phases/phase-0.md

# 브랜치 생성
git checkout -b feature/phase-0-setup

# 작업 시작!
```

---

## ✅ 전체 진행 체크리스트

```markdown
- [ ] Phase 0: 프로젝트 초기 설정
  - [ ] Step 0-1: 프로젝트 구조 생성
  - [ ] Step 0-2: Frontend 초기화
  - [ ] Step 0-3: Backend 초기화

- [ ] Phase 1: 데이터베이스 설계
  - [ ] Step 1-1: Prisma Schema 작성
  - [ ] Step 1-2: Migration 실행
  - [ ] Step 1-3: Seed 데이터 작성

- [ ] Phase 2: Backend API 개발
  - [ ] Step 2-1: Prisma Service 생성
  - [ ] Step 2-2: Mechanic CRUD API
  - [ ] Step 2-3: DTO 및 Validation
  - [ ] Step 2-4: Naver Maps API 프록시
  - [ ] Step 2-5: 클릭 로그 API
  - [ ] Step 2-6: CORS 설정

- [ ] Phase 3: Frontend 기본 구조
  - [ ] Step 3-1: 타입 정의
  - [ ] Step 3-2: API 클라이언트 설정
  - [ ] Step 3-3: Naver Maps 유틸리티
  - [ ] Step 3-4: Tailwind 커스텀 설정

- [ ] Phase 4: 메인 페이지 개발
  - [ ] Step 4-1: 레이아웃 컴포넌트
  - [ ] Step 4-2: 히어로 섹션
  - [ ] Step 4-3: 정비사 카드 그리드
  - [ ] Step 4-4: 메인 페이지 통합

- [ ] Phase 5: 정비사 상세 모달
  - [ ] Step 5-1: 모달 컴포넌트 베이스
  - [ ] Step 5-2: 상세 정보 레이아웃
  - [ ] Step 5-3: Naver Maps 표시
  - [ ] Step 5-4: 유튜브 쇼츠 임베디드
  - [ ] Step 5-5: 클릭 카운트 증가

- [ ] Phase 6: 관리자 페이지
  - [ ] Step 6-1: 인증 시스템
  - [ ] Step 6-2: 로그인 페이지
  - [ ] Step 6-3: 대시보드 레이아웃
  - [ ] Step 6-4: 정비사 관리 테이블
  - [ ] Step 6-5: 정비사 추가/수정 폼 (지도 편집)
  - [ ] Step 6-6: EditableMap 컴포넌트
  - [ ] Step 6-7: 통계 대시보드

- [ ] Phase 7: 이미지 업로드
  - [ ] Step 7-1: Cloudinary 설정
  - [ ] Step 7-2: 이미지 업로드 API
  - [ ] Step 7-3: Frontend 업로드 컴포넌트

- [ ] Phase 8: 반응형 & 애니메이션
  - [ ] Step 8-1: 모바일 최적화
  - [ ] Step 8-2: Framer Motion 애니메이션
  - [ ] Step 8-3: 로딩 상태

- [ ] Phase 9: 배포 준비
  - [ ] Step 9-1: 환경변수 정리
  - [ ] Step 9-2: EC2 서버 초기 설정
  - [ ] Step 9-3: Nginx 리버스 프록시 설정
  - [ ] Step 9-4: PM2로 애플리케이션 배포

- [ ] Phase 10: 테스트 & 최적화
  - [ ] Step 10-1: API 테스트
  - [ ] Step 10-2: SEO 최적화
  - [ ] Step 10-3: 성능 최적화
```

---

## 📝 작업 시 주의사항

### Claude Code에게 요청하는 방법

**좋은 예시**:
```
"phases/phase-0.md 파일을 보고 Phase 0을 시작해줘"
"Step 0-1부터 차근차근 진행하자"
"Step 0-2 완료했으니 커밋하고 Step 0-3 시작하자"
```

**피할 예시**:
```
"웹사이트 만들어줘" (너무 모호)
"모든 Phase를 한번에 해줘" (너무 큼)
```

### 커밋 타이밍
- 파일 1-3개 생성/수정할 때마다 커밋
- 에러 수정할 때마다 커밋
- 새로운 시도 전에 커밋 (안전망)

### 테스트 타이밍
- 각 Step 완료 시 동작 확인
- Phase 완료 시 전체 테스트
- PR 생성 전 마지막 확인

---

## 🚀 다음 단계

1. `phases/phase-0.md` 파일 열기
2. Phase 0 시작하기
3. 각 Step을 순서대로 완료
4. 문제 발생 시 해당 Phase 문서 참고

**Ready? Let's build! 🔨**
