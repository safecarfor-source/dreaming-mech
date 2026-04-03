# 꿈꾸는정비사 — Claude 작업 규칙

## 프로젝트
- 자동차 정비소 매칭 플랫폼 (B2C SaaS)
- Frontend: Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion
- Backend: NestJS 11 + Prisma + PostgreSQL
- 언어: 한국어 서비스

---

## 라우팅 (필요한 것만 읽어라)

| 작업 | 참조 파일 |
|------|----------|
| 프론트엔드 작업 | `frontend/CLAUDE.md` |
| 백엔드 작업 | `backend/CLAUDE.md` |
| UI/디자인 작업 | `DESIGN_SYSTEM.md` |
| DB 스키마 변경 | `rules/db-safety.md` + `rules/change-safety.md` |
| 새 기능 추가 | `rules/change-safety.md` (변경 전 체크리스트) |
| 배포 | `rules/deploy.md` |
| 배포 후 검증 | `rules/deploy-checklist.md` (매 배포마다 필수) |
| 보안 관련 | `rules/security.md` |
| 세션 시작 | `BRAIN.md` (시스템 구조도) + `tasks/todo.md` |
| 컨텍스트 압축 후 | `rules/context-recovery.md` |
| 워크플로우/프로세스 | `rules/workflow.md` |

---

## 절대 금지 (항상 적용)

### DB
- `prisma db push` — DB 리셋 위험
- `prisma migrate reset` — 전체 데이터 삭제
- `DROP DATABASE` / `DROP TABLE` — 직접 실행 금지
- WHERE 조건 없는 DELETE — 전체 삭제 위험
- 스키마 변경: `prisma migrate dev` (로컬) → `prisma migrate deploy` (프로덕션)

### 코드
- API 키/비밀번호 하드코딩 금지 → `.env` 전용
- API 응답 필드 삭제/이름변경 금지 (추가만 허용)
- 비밀번호 평문 저장 금지 (bcrypt 필수)
- JWT fallback secret 금지

### 프로세스
- 빌드 검증 없이 완료 표시 금지
- 비밀번호/계정 정보 임의 변경 금지
- 대장님 말 끝나기 전에 실행 시작 금지

> 전체 금지 목록: `rules/dont-do-this.md`

---

## 코드 컨벤션
- TypeScript strict mode
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 파일: kebab-case 또는 PascalCase (컴포넌트)
- Tailwind 클래스 사용, 인라인 스타일 최소화
- 한국어 주석 사용 가능

---

## 핵심 원칙
- **단순함 우선:** 최소한의 코드 영향. 과잉 설계 금지.
- **게으름 금지:** 근본 원인 찾기. 임시 수정 없음. 시니어 개발자 기준.
- **최소 영향:** 변경은 필요한 부분만. 새로운 버그 도입 금지.
- **불확실하면 플래그:** 확신도 80% 미만이면 추측 대신 보고.

---

## 기본 제작 컨셉: 하네스 + 에이전틱 엔지니어링 (2026-04-03 확정)

> 모든 프로젝트에 적용하는 기본 방식. 새 기능/서비스 시작 시 이 구조로 설계한다.

### 원칙
- **프롬프트(부탁)가 아니라 하네스(시스템 강제)**: AI가 실수하면 프롬프트를 고치지 말고, 그 실수가 구조적으로 불가능하도록 시스템을 고친다.
- **AI 자율 루프**: AI가 계획→실행→검증을 자동 반복. 사람 개입 최소화.
- **위임 스펙트럼**: 검증 쉬운 것은 완전 자율, 어려운 것은 대화형 협업.

### 하네스 4기둥 (매 프로젝트 적용)
1. **컨텍스트 파일** — CLAUDE.md, 프롬프트에 규칙 내장 (런타임 설정)
2. **자동 강제** — 코드로 검증. 규칙 위반 시 통과 불가 (린터/테스트/훅)
3. **도구 경계** — AI 접근 범위 제한. 최소 권한 원칙.
4. **가비지 컬렉션** — 실패 패턴 → 규칙 자동 보강. 시간이 갈수록 견고해짐.

### 위임 기준
- "내가 결과를 빠르게 검증할 수 있는가?" → Yes: 자율 위임 / No: 협업 또는 인간 주도
- 자율 위임된 작업도 하네스(자동 검증)가 반드시 뒷받침

---

## Lazy Loading 규칙
- 위 라우팅 테이블에 해당하는 파일만 읽는다
- 세션 시작 시 전체 파일을 한꺼번에 읽지 않는다
- BRAIN.md + tasks/todo.md만 세션 시작 시 읽는다
- 나머지는 작업 종류에 따라 필요한 파일만 참조한다
