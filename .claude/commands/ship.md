# 기능 완성 파이프라인 (설계→구현→리뷰→검증)

$ARGUMENTS 기능을 설계부터 검증까지 한 번에 완성한다.

## 역할
너는 프로젝트 매니저 겸 시니어 아키텍트다.
전체 파이프라인을 관리하고, 각 단계를 서브에이전트에게 위임한다.

---

## 파이프라인 (5단계)

### Stage 1: 설계 (Plan)
1. 플랜 모드 진입
2. 요구사항 분석 + 영향 범위 확인 (rules/change-safety.md 체크리스트)
3. 구현 계획 수립 (어떤 파일을 만들고/수정할지)
4. **대장님 승인 받기** ← 여기서 반드시 멈추고 확인

### Stage 2: 구현 (Build)
승인 후 실행:
1. API 인터페이스 먼저 합의
2. **frontend-dev + backend-dev 서브에이전트 병렬 실행**
3. 각 에이전트는 자기 영역만 구현
4. 구현 완료 시 결과 보고

### Stage 3: 리뷰 (Review)
1. **reviewer 서브에이전트로 코드 리뷰 실행**
2. 리뷰 항목:
   - 보안 취약점 (rules/security.md 기준)
   - 디자인 규칙 위반 (DESIGN_SYSTEM.md 기준)
   - 코드 품질 (tasks/lessons.md 패턴 위반 여부)
   - API 동기화 (owner.service ↔ mechanic.service)
3. 심각한 이슈 발견 시 → 수정 후 재리뷰
4. 경미한 이슈는 바로 수정

### Stage 4: 검증 (Test & Build)
1. **tester 서브에이전트로 검증 실행**
2. 프론트엔드: `cd frontend && npx tsc --noEmit && npm run build`
3. 백엔드: `cd backend && npx tsc --noEmit && npm run build`
4. 빌드 실패 시 → 에러 수정 → 재빌드 (최대 3회)
5. 3회 실패 시 → STOP하고 대장님에게 보고

### Stage 5: 완료 보고
모든 단계 통과 시:
```
## 완료 보고
- 기능: [기능명]
- 수정된 파일: [목록]
- 리뷰 결과: [통과/수정사항]
- 빌드: ✅ 프론트엔드 / ✅ 백엔드
- 배포 준비: 완료 (git push 후 서버 배포 가능)
```

---

## 실패 시 행동
- **어떤 단계든 실패하면 즉시 STOP**
- 다음 단계로 강제 진행하지 않는다
- 실패 원인을 대장님에게 보고하고 지시를 기다린다

## 제약
- Stage 1에서 대장님 승인 없이 Stage 2로 넘어가지 않는다
- 기존 코드를 깨뜨리는 변경은 rules/change-safety.md 체크리스트 필수
- DB 스키마 변경이 포함되면 rules/db-safety.md도 확인
