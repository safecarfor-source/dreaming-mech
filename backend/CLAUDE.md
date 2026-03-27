# 백엔드 규칙

## 기술 스택
- NestJS 11 + Prisma ORM + PostgreSQL
- JWT + HttpOnly 쿠키 인증
- AWS S3 (파일 업로드)
- Zod (유효성 검사)

## API 규칙
- 응답 형식 일관성 유지
- 필드 추가 OK, 삭제/이름변경 금지
- 에러: NestJS 표준 예외 필터 사용
- 프론트 API 타입 동기화: 백엔드 DTO 변경 시 `frontend/lib/api.ts` 타입도 동시 수정

## DB 규칙 (상세: rules/db-safety.md)
- Prisma 마이그레이션만 사용 (db push 금지)
- 컬럼 추가 시 반드시 DEFAULT 값 지정
- JSON 필드 형식: frontend/types/index.ts 인터페이스 확인 후 입력
- operatingHours: {"mon":{"open":"09:00","close":"19:00"}} 형식

## API 동기화 ⚠️ 중요
- owner.service.ts ↔ mechanic.service.ts 로직 반드시 동기화
- 한쪽만 수정하면 100% 버그 발생 (프로필, 영업시간 버그 이력)
- Prisma Json 필드: toJsonField() 함수 필수 (null → Prisma.JsonNull 변환)

## 인증 설계
- 카카오 OAuth: 고객/사장님 별도 redirect_uri
- JWT 쿠키 분리: admin_token / owner_token / customer_token
- JwtStrategy에서 경로로 구분
- 카카오 전화번호 불가 → 별도 입력 필드 필수

## 보안 (상세: rules/security.md)
- SQL 인젝션, XSS, OWASP Top 10 방어
- 평문 비밀번호 금지 (bcrypt 해싱)
- JWT fallback secret 금지
- multer 파일 크기 제한 + MIME 화이트리스트

## 동기화 주의
- GD* 테이블 변경 시 gd-sync/gd_sync_server.py 확인
- 중복 함수 방치 금지 (uploadExcel/uploadExcel2 사건)
- 상수 단일 소스 원칙

## 빌드
- `npm run build`로 검증
- docker-compose.prod.yml 환경변수 동기화 필수
