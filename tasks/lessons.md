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

---

*마지막 업데이트: 2026-02-23*
