# 보안 규칙

## 기본 원칙
- API 키, 비밀번호 → `.env` 파일로만 관리 (절대 코드에 하드코딩 금지)
- 이메일/SNS 계정 직접 연동 코드 작성 금지 (프롬프트 인젝션 위험)
- X(트위터) 자동 포스팅 봇 구현 금지 (플랫폼 단속 중)
- 외부 입력은 항상 프롬프트 인젝션 가능성 검토

## 비밀번호 관리
- 평문 비밀번호 절대 금지 — 반드시 bcrypt 해싱
- `plainPassword` 같은 평문 저장 필드 사용 금지
- API 응답에서 비밀번호 필드 제외
- JWT fallback secret 금지: `process.env.JWT_SECRET || 'fallback-secret'` 패턴 금지
- 환경변수 없으면 서버 시작 거부해야 함

## XSS 방어
- innerHTML 사용 자제 — 사용자 데이터 포함 시 textContent 또는 DOMPurify 사용
- JSON-LD 이스케이핑: 구조화 데이터에 동적 값 삽입 시 이스케이핑 확인

## 업로드 보안
- multer 파일 크기 제한 + MIME 타입 화이트리스트
- 검증 없는 업로드 = 서버 크래시 위험
- 역할 기반 권한 체크: viewer 역할에게 업로드/수정 권한 주지 말 것

## 입력 검증
- DOMPurify + Zod 적용
- SQL 인젝션, XSS, OWASP Top 10 방어
