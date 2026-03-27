# Superpowers 프레임워크 공존 규칙

> Superpowers가 설치되어 있을 때 아래 규칙을 반드시 준수한다.

- **Git worktrees 사용하지 않음.** 기존 git-per-task 워크플로우 유지. main 브랜치 단일 작업.
- **TDD 선택적 적용:** 프론트엔드 UI 컴포넌트는 TDD 면제. API 엔드포인트와 비즈니스 로직에만 TDD 적용.
- **비동기 관제 역할 분리:** STEERING.md/MEMORY.md = 전체 프로젝트 로드맵 (큰 그림), Superpowers PLAN.md = 개별 기능 세부 구현 계획 (작은 그림).
- **브레인스토밍 스킵:** 이미 설계 완료된 작업은 "이 작업은 설계 완료됨. 브레인스토밍 스킵하고 바로 구현 계획 단계로." 지시.
- **CLAUDE.md 프로젝트 규칙이 Superpowers보다 우선한다.**
