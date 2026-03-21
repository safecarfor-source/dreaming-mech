# 배포 체크리스트

> 꿈꾸는정비사 프로덕션 배포 표준 절차서
> 최종 수정: 2026-03-21

---

## 서버 정보

| 항목 | 값 |
|------|-----|
| EC2 | ubuntu@13.209.143.155 |
| PEM | `/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem` |
| 서버 경로 | `/home/ubuntu/dreaming-mech` |
| 도메인 | dreammechaniclab.com |
| SSL | Nginx + Let's Encrypt |

```
SSH 접속:
ssh -i "/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem" ubuntu@13.209.143.155
```

---

## 1단계: 배포 전 확인 (로컬)

### 필수 체크

- [ ] **로컬 빌드 성공 확인**
  ```bash
  cd /Users/shinjeayoun/dreaming-mech/frontend && npm run build
  cd /Users/shinjeayoun/dreaming-mech/backend && npm run build
  ```

- [ ] **TypeScript 타입 에러 없음**
  ```bash
  cd /Users/shinjeayoun/dreaming-mech/frontend && npx tsc --noEmit
  cd /Users/shinjeayoun/dreaming-mech/backend && npx tsc --noEmit
  ```

- [ ] **로컬 서버에서 동작 확인** (대장님 직접 확인)
  ```bash
  cd /Users/shinjeayoun/dreaming-mech/frontend && npm run dev
  # http://localhost:3000 에서 확인
  ```

- [ ] **마이그레이션 파일 존재 여부** (스키마 변경 시)
  ```bash
  ls backend/prisma/migrations/
  # 새 마이그레이션 폴더가 있어야 함
  # prisma migrate dev --name 설명 으로 생성됨
  ```

- [ ] **git에 모든 변경사항 커밋됨**
  ```bash
  git status  # clean 상태여야 함
  ```

### 마이그레이션이 있는 경우 추가 확인

- [ ] 마이그레이션 SQL 파일 직접 확인 (DROP TABLE, DROP COLUMN 없는지)
- [ ] 기존 데이터에 영향 없는지 확인
- [ ] 필요 시 서버 백업 먼저 실행 (아래 수동 백업 참조)

---

## 2단계: 배포 실행

### A. 코드 푸시 (로컬)

```bash
git push origin main
```

### B. 서버 접속 후 배포

```bash
# 1. SSH 접속
ssh -i "/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem" ubuntu@13.209.143.155

# 2. 프로젝트 디렉토리 이동
cd /home/ubuntu/dreaming-mech

# 3. 최신 코드 받기
git pull origin main

# 4-a. frontend만 배포
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend --no-deps

# 4-b. backend만 배포
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend --no-deps

# 4-c. 전체 배포 (frontend + backend)
docker compose -f docker-compose.prod.yml build frontend backend
docker compose -f docker-compose.prod.yml up -d frontend backend --no-deps

# 5. 마이그레이션은 backend 컨테이너 시작 시 자동 실행됨
# (docker-compose.prod.yml의 command에서 prisma migrate deploy 실행)
# 마이그레이션은 MIGRATION_DATABASE_URL(migration_user) 권한으로 실행됨
```

---

## 3단계: 배포 후 확인

### 필수 확인 항목

- [ ] **컨테이너 상태 확인**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  # 모든 컨테이너가 Up (healthy) 상태여야 함
  ```

- [ ] **백엔드 헬스체크**
  ```bash
  curl -s http://localhost:3001/health
  # {"status":"ok"} 응답 확인
  ```

- [ ] **프론트엔드 접속 확인**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
  # 200 응답 확인
  ```

- [ ] **실제 도메인 접속 확인**
  - https://dreammechaniclab.com/ (메인 페이지)
  - https://dreammechaniclab.com/incentive/ (인센티브)
  - https://dreammechaniclab.com/admin/login (관리자)

- [ ] **로그인 테스트**
  - 인센티브 로그인 정상 동작
  - 관리자 로그인 정상 동작

- [ ] **백엔드 로그 확인** (에러 없는지)
  ```bash
  docker logs dreaming-mech-backend --tail 50
  ```

- [ ] **프론트엔드 로그 확인**
  ```bash
  docker logs dreaming-mech-frontend --tail 50
  ```

---

## 롤백 절차

### 즉시 롤백 (코드 되돌리기)

```bash
# 서버에서 실행
cd /home/ubuntu/dreaming-mech

# 1. 이전 커밋으로 되돌리기
git log --oneline -5        # 되돌릴 커밋 해시 확인
git checkout <이전커밋해시>

# 2. 다시 빌드 + 재시작
docker compose -f docker-compose.prod.yml build frontend backend
docker compose -f docker-compose.prod.yml up -d frontend backend --no-deps

# 3. 확인 후 main 브랜치로 복귀
git checkout main
```

### DB 롤백 (마이그레이션 문제 시)

```bash
# 1. 자동 백업에서 복원 (매일 새벽 2시 백업)
ls /home/ubuntu/dreaming-mech/backups/
# mechanic_db_YYYYMMDD_020000.sql.gz 파일 확인

# 2. 복원 (주의: 현재 데이터 덮어씀)
gunzip -c /home/ubuntu/dreaming-mech/backups/mechanic_db_YYYYMMDD_020000.sql.gz | \
  docker exec -i dreaming-mech-postgres psql -U postgres mechanic_db
```

### 수동 백업 (배포 전 안전망)

```bash
# 서버에서 실행
docker exec dreaming-mech-postgres pg_dump -U postgres mechanic_db | \
  gzip > /home/ubuntu/dreaming-mech/backups/mechanic_db_manual_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## DB 권한 체계

| 사용자 | 용도 | 권한 | 환경변수 |
|--------|------|------|----------|
| `app_user` | 앱 런타임 | SELECT/INSERT/UPDATE/DELETE | `DATABASE_URL` |
| `migration_user` | 마이그레이션 | 스키마 변경 가능 (ALTER/CREATE/DROP) | `MIGRATION_DATABASE_URL` |
| `readonly_user` | 모니터링 | SELECT만 | - |
| `postgres` | 슈퍼유저 | 전체 | 앱에서 절대 사용 금지 |

### 절대 금지 명령어 (프로덕션)

| 명령어 | 위험도 | 이유 |
|--------|--------|------|
| `prisma db push` | 치명적 | DB 리셋 위험 |
| `prisma migrate reset` | 치명적 | 전체 데이터 삭제 |
| `DROP DATABASE` | 치명적 | 복구 불가 |
| `DROP TABLE` | 치명적 | 데이터 손실 |

> 서버 `.bashrc`에 `prisma` alias가 차단 설정되어 있음.
> 마이그레이션은 반드시 docker-compose command를 통해서만 실행.

---

## 배포 유형별 요약

| 상황 | 배포 대상 | 마이그레이션 | 백업 |
|------|-----------|-------------|------|
| 프론트 UI 수정만 | frontend만 | 불필요 | 불필요 |
| 백엔드 로직 수정 (스키마 변경 없음) | backend만 | 불필요 | 권장 |
| DB 스키마 변경 포함 | backend (+ frontend) | 자동 실행 | 필수 |
| 전체 리팩토링 | 전체 | 상황에 따라 | 필수 |
