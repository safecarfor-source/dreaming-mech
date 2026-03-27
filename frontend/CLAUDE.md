# 프론트엔드 규칙

## 기술 스택
- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + Framer Motion
- Zustand (상태관리)
- TypeScript strict mode

## 디자인 (DESIGN_SYSTEM.md 참조)
- 메인 퍼플: #7C4DFF (hover: #6B3FE0)
- 소비자 레드: #E4015C
- 60-30-10 색상 법칙
- 8px 그리드 시스템
- 한글 line-height: 1.6~1.7
- 반응형 점프 금지 (p-3→p-6 금지, 점진적으로)

> ⚠️ 컬러 마이그레이션 보류: 현재 코드베이스는 `#7C4DFF` 기반. `DESIGN_SYSTEM.md`는 `#7C3AED` 정의. 향후 일괄 전환 예정. 신규 코드에서는 CSS 변수 사용 권장.

## 컴포넌트 규칙
- PascalCase 컴포넌트명
- props 추가: OK (optional). props 삭제: 사용처 전수 확인
- 새 페이지: 기존 라우트 수정 없이 새 파일만 생성
- 새 탭: 탭 배열에 항목 추가만, 기존 인덱스 변경 금지
- 서버 컴포넌트 기본, 클라이언트 상태 필요할 때만 'use client'

## 성능
- 불필요한 리렌더링 방지
- insightLoaded 패턴 (한 번 로드한 탭 재로드 방지)
- CSS-only 차트 선호 (Chart.js 불필요 시)

## 코드 중복 주의
- /inquiry/page.tsx와 ServiceInquiryFunnel 중복 주의
- 같은 UI가 2곳 이상이면 즉시 재사용 컴포넌트로 추출

## JSON 필드 형식 (사이트 크래시 원인)
- operatingHours: `{"mon":{"open":"09:00","close":"19:00"}}` 객체 형식
- holidays: `{"type":"weekly","days":["일요일"],"description":"매주 일요일 휴무"}` 객체
- 프론트엔드 타입 `frontend/types/index.ts` 인터페이스 먼저 확인 후 데이터 입력

## 빌드
- `npm run build` 또는 `npx tsc --noEmit`으로 검증
- NEXT_PUBLIC_API_URL 환경변수 필요
