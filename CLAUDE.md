# 꿈꾸는정비사 — Claude 작업 규칙

## 프로젝트 개요
- 자동차 정비소 매칭 플랫폼 (B2C SaaS)
- Frontend: Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion
- Backend: NestJS 11 + Prisma + PostgreSQL
- 언어: 한국어 서비스

---

## 디자인 규칙 (반드시 준수)

웹 디자인 작업 시 `DESIGN_SKILLS_ROADMAP.md`를 참조하고, 아래 규칙을 반드시 따를 것.

### 색상 — 60-30-10 법칙
- **60% 지배색:** 흰색/연한 그레이 (`#FFFFFF`, `#F9FAFB`, `#F3F4F6`)
- **30% 보조색:** 브랜드 퍼플 계열 (`#F5F3FF` ~ `#7C4DFF`)
- **10% 강조색:** 앰버/골드 (`#F59E0B`, `#FBBF24`)
- 퍼플은 `#7C4DFF` 하나만 메인으로 사용. `#7C3AED`, `#6D28D9` 등 유사 퍼플 혼용 금지
- 모든 색상은 CSS 변수 또는 Tailwind 토큰으로 관리. 하드코딩 금지
- 텍스트 대비율 WCAG AA (4.5:1) 이상 유지

### 타이포그래피 — 모듈러 스케일
- 기준: base 16px, 비율 Minor Third (1.200)
- Display: 48px / H1: 40px / H2: 33px / H3: 28px / H4: 23px / H5: 19px / Body: 16px / Caption: 13px
- **한글 line-height: 1.6 ~ 1.7** (W3C klreq 권장)
- 제목 line-height: 1.1 ~ 1.2
- 폰트: Pretendard 기본, weight로 위계 구분 (400 본문, 600 중요, 700 제목)
- ALL CAPS 텍스트는 letter-spacing +0.05em 이상

### 간격 — 8px 그리드
- 모든 간격은 8의 배수: 4, 8, 12, 16, 24, 32, 48, 64, 96
- 반응형 전환은 점진적으로: `p-3 sm:p-4 md:p-5 lg:p-6` (2배 점프 금지)
- 내부 패딩 ≤ 외부 마진 (Gestalt 근접성)

### 비율
- 정비소 메인 이미지: 16:9 (`aspect-ratio: 16/9`)
- 카드 썸네일: 4:3 (`aspect-ratio: 4/3`)
- 프로필/아바타: 1:1
- 이미지는 반드시 `object-fit: cover` 적용
- 같은 목록 내 카드 이미지 비율 통일

### 시각적 위계
- 제목과 본문 크기 비율 최소 1.5:1
- CTA 버튼 주변에 충분한 여백 확보
- 그림자 체계: xs(인풋) → sm(카드) → md(호버) → lg(드롭다운) → xl(모달)
- 홈페이지: Z-패턴 / 목록 페이지: F-패턴

### 트랜지션
- fast: 150ms (호버, 포커스)
- normal: 200ms (일반 전환)
- slow: 300ms (확장, 슬라이드)
- easing: cubic-bezier(0.4, 0, 0.2, 1) 기본

---

## 코드 컨벤션
- TypeScript strict mode
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 파일: kebab-case 또는 PascalCase (컴포넌트)
- Tailwind 클래스 사용, 인라인 스타일 최소화
- 한국어 주석 사용 가능
