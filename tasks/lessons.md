# 꿈꾸는정비사 — 교훈 & 패턴

> 수정받을 때마다 여기에 기록. 같은 실수 반복 방지.

---

## 디자인 규칙
1. **퍼플 하나만 사용**: `#7C4DFF`만 메인 퍼플. `#7C3AED`, `#6D28D9` 등 유사 퍼플 혼용하면 안 됨
2. **색상 하드코딩 금지**: 항상 Tailwind 토큰 사용
3. **한글 line-height**: 반드시 1.6~1.7 유지 (W3C klreq 기준)
4. **8px 그리드**: 모든 간격은 8의 배수 (4, 8, 12, 16, 24, 32, 48, 64, 96)
5. **반응형 점프 금지**: `p-3 → p-6` 같은 2배 점프 하지 말 것. `p-3 → p-4 → p-5 → p-6` 점진적으로

## 코드 품질
1. **과잉 설계 금지**: 요청된 것만 구현. 미래 대비 추상화 하지 말 것
2. **주석/문서 자제**: 변경하지 않은 코드에 주석 달지 말 것
3. **보안 먼저**: 입력 유효성 검사, DOMPurify, Zod 적용

## 워크플로우
1. **플랜 모드 먼저**: 3단계 이상이면 반드시 계획부터
2. **일이 틀어지면 STOP**: 밀어붙이지 말고 재계획
3. **작동 증명**: 빌드/테스트 안 돌리고 완료 표시 금지

## 아키텍처 패턴 (2026-02-23 추가)
1. **카카오 OAuth 분리**: 고객/사장님 로그인은 별도 redirect_uri 사용. 카카오 앱에 둘 다 등록 필수
2. **JWT 쿠키 분리**: admin_token / owner_token / customer_token 각각 분리. JwtStrategy에서 경로로 구분
3. **sessionStorage 임시 저장**: OAuth 리다이렉트 전 폼 데이터를 sessionStorage에 저장, 콜백에서 복원
4. **텔레그램 best-effort**: 텔레그램 발송 실패해도 문의 접수는 반드시 성공해야 함. catch로 분리
5. **Prisma 마이그레이션**: `npx prisma migrate deploy` (prod), DB 없이 `--create-only`로 파일만 생성 가능
6. **docker-compose.prod.yml 환경변수**: 새 서비스 추가 시 반드시 prod yml에도 env 추가할 것

## 인증 설계 교훈
1. **카카오 전화번호 불가**: 카카오 로그인으로 전화번호 취득 불가능 (정책). 반드시 별도 입력 필드 필요
2. **customer_token 쿠키 경로**: JwtStrategy에서 /service-inquiries 경로에서 customer_token 추출
3. **role 기반 접근 제어**: JWT payload의 role('admin'|'owner'|'customer')로 권한 구분

## 배포 & 운영 (2026-02-26 추가)
1. **DB 컬럼 추가**: 서버에서 직접 `ALTER TABLE` 가능 (Prisma migrate 없이). 단, schema.prisma도 반드시 동기화
2. **docker-compose 환경변수**: 새 환경변수 추가 시 `docker-compose.prod.yml`에도 반드시 추가. Dockerfile ARG도 체크
3. **CustomEvent 패턴**: 서로 다른 컴포넌트 간 통신에 `window.dispatchEvent(new Event('이벤트명'))` 활용. 배지 갱신 등에 효과적

## API 동기화 (2026-02-27 추가) ⚠️ 중요
1. **사장님 API ↔ 관리자 API 동기화**: `mechanic.service.ts`(관리자용)에 기능 추가할 때, `owner.service.ts`(사장님용)에도 **반드시** 동일 로직 적용 체크. 02-26 프로필 버그, 02-27 영업시간 버그 모두 이 패턴
2. **Prisma JSON 필드 처리**: `operatingHours`, `holidays` 같은 `Json` 타입 필드는 반드시 `toJsonField()` 함수 거쳐야 함. `null` → `Prisma.JsonNull` 변환 필수. 그냥 `null` 전달하면 DB 업데이트 무시됨
3. **유틸 함수 공유**: 두 서비스가 같은 DB 모델을 다루면, `toJsonField()` 같은 유틸을 별도 파일로 분리하거나, 양쪽에 동일하게 복사

## UX 원칙 (2026-02-27 추가)
1. **관리자 정보 접근성**: 목록에서 `truncate`/`line-clamp` 사용 시 반드시 상세보기 모달 제공. 관리자는 모든 정보에 즉시 접근할 수 있어야 함
2. **디자인 통일**: 새 페이지 만들 때 `purple-600` 대신 `#7C4DFF` 사용. Tailwind arbitrary value `[#7C4DFF]`로 통일. 유사 퍼플 혼용 금지
3. **hover → #6B3FE0**: `#7C4DFF`의 hover 상태는 `#6B3FE0`으로 통일

---

*마지막 업데이트: 2026-02-27*
