# DB 안전 규칙 (절대 원칙)

> ⛔ 이 규칙은 어떤 상황에서도 예외 없이 적용된다.

## 절대 금지 명령어 (프로덕션)
- `prisma db push` → DB 리셋 위험, 절대 사용 금지
- `prisma migrate reset` → 전체 데이터 삭제, 절대 사용 금지
- `DROP DATABASE` / `DROP TABLE` → 직접 실행 금지
- 스키마 변경은 반드시 `prisma migrate dev` (로컬) → `prisma migrate deploy` (프로덕션)

## DB 권한 분리 (3-tier)
- **app_user**: 앱이 사용 (SELECT/INSERT/UPDATE/DELETE만 — DROP/ALTER 불가)
- **migration_user**: 마이그레이션 전용 (스키마 변경 가능, 배포 시에만 사용)
- **readonly_user**: 모니터링/분석용 (SELECT만)
- docker-compose 설정: `DATABASE_URL=app_user`, `MIGRATION_DATABASE_URL=migration_user`
- 앱의 DATABASE_URL에 절대 postgres(슈퍼유저) 사용 금지

## 자동 백업 체계
- 서버 cron: 매일 새벽 2시 자동 `pg_dump` + gzip (30일 보관)
- 배포 전 백업 필수: `scripts/safe-deploy.sh` 사용 권장
- 스키마 변경 전 반드시 백업 확인
- 백업 없이 마이그레이션 실행 금지

## 마이그레이션 안전 절차
1. 로컬에서 `prisma migrate dev --name 설명` 실행
2. `prisma/migrations/` 폴더가 git에 커밋됨
3. 서버에서 `prisma migrate deploy`가 자동 실행 (docker-compose command)
4. 마이그레이션은 migration_user 권한으로 실행됨

## 새 프로젝트 시작 시 필수 체크리스트
- [ ] DB 유저 3개 생성 (app_user, migration_user, readonly_user)
- [ ] docker-compose에 권한 분리 반영
- [ ] cron 자동 백업 설정
- [ ] 금지 명령어 alias 설정
- [ ] 마이그레이션 베이스라인 설정

## 교훈 (2026-03-16 데이터 전량 손실)
- `prisma db push`가 프로덕션 DB를 리셋 → 인센티브 데이터 전부 날아감
- 마이그레이션 파일은 로컬에서 생성 → 즉시 커밋. 나중에 한꺼번에 추가하면 서버 DB 상태와 충돌

## 교훈 (2026-03-19 502 사고)
- 이미 서버 적용된 마이그레이션 파일을 git에 새로 추가 → 중복 실행 시도 → 백엔드 사망
- 커밋 전: `git diff --cached --name-only | grep migrations`로 확인 필수

## 교훈 (P3009 사고)
- `app_user`로 ALTER TABLE 불가 → 마이그레이션 실패 → 백엔드 무한 재시작
- 마이그레이션 전 테이블 소유권 확인: `\dt "테이블명"`

## 테스트 스크립트 안전 (2026-03-24 데이터 삭제 사고)
- DELETE 쿼리에 반드시 TEST_ 필터 — WHERE 조건 없는 DELETE 절대 금지
- DELETE 전 COUNT 확인
