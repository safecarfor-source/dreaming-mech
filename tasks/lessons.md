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
4. **핵심 UX(사용자 동선)는 코드 전에 확인**: 퍼널/랜딩 같은 사용자 동선 페이지는 구조를 먼저 설명하고 대장님 피드백 받은 후 구현. "/about에서 /inquiry로 이동해야 하나?" 사건 교훈

## 워크플로우 최적화 (2026-02-27 세션 분석)

### 병렬 작전 패턴 (기본값)
1. **관리자 페이지 작업 = 대장님 직접**: 네이버 서치어드바이저, 구글 서치콘솔, 유튜브 스튜디오 등 로그인 필요한 관리자 페이지는 Chrome 확장 보안 제한으로 소위가 접근 불가. 처음부터 대장님 담당으로 배정
2. **대장님 플랫폼 작업 + 소위 코드 병렬**: 대장님이 네이버/구글 등록하는 동안 소위는 코드 6개 동시 작업 → 시간 절반 절약. 이 패턴을 기본 작전으로 사용

### 문서 동기화 루틴
3. **배포 후 즉시 문서 업데이트**: todo.md + MEMORY.md를 세션 끝에 반드시 갱신. 문서가 실전보다 뒤처지면 다음 세션에서 정찰 에이전트가 잘못된 보고를 함 (커뮤니티 Q&A "대기 중" 오보 사건)
4. **MEMORY.md 완료 작전 이력 섹션**: 작전 완료 시 즉시 MEMORY.md "완료된 작전 이력"에 이동 + 날짜 기록

### 중복 방지
5. **만들기 전에 있는지 확인**: 새 기능 시작 전 반드시 researcher 에이전트로 기존 코드 정찰. TrackingLink가 이미 완전 구현된 걸 발견 → 중복 개발 방지 → 최소 30분 절약

### 재사용 패턴
6. **공통 컴포넌트 추출**: 같은 UI가 2곳 이상에서 쓰이면 즉시 재사용 컴포넌트로 추출. ServiceInquiryFunnel 성공 패턴 (/inquiry + /about 공유)
7. **추적 링크 습관**: 블로그, 유튜브, 공유 메시지 등 모든 외부 링크에 `?ref=출처코드` 부착. 유입 경로 자동 측정

### 배포 전략
8. **묶어서 배포**: 기능 추가/SEO 같은 비긴급 작업은 여러 개 모아서 빌드 1번 → 배포 1번. 버그 수정은 즉시 단독 배포

## 코드 중복 & API 추적 (2026-03-01 추가) ⚠️ 중요

### 코드 중복 함정
1. **퍼널 코드 2중 존재**: `/inquiry/page.tsx`가 `ServiceInquiryFunnel` 컴포넌트를 재사용하지 않고 자체 인라인 퍼널 구현 → 한쪽만 수정하면 100% 버그. 새 필드(regionDong) 추가 시 반드시 양쪽 수정 확인. **향후 컴포넌트 통합 리팩토링 필요**
2. **프리뷰 검증 필수**: 배포 전 로컬 프리뷰로 실제 UI 확인 → 이번에 코드 중복 버그 1건 발견

### API 다중 엔드포인트 추적
3. **같은 데이터의 다중 접점**: 공유 링크 클릭 추적 코드가 `service-inquiry`에만 있고 `unified-inquiry`에는 없어 조회수 항상 0 → 같은 데이터를 여러 API에서 다루면 추적/카운팅 로직은 모든 접점에 구현할 것
4. **프론트 API 타입 동기화**: 백엔드 DTO 변경 시 `frontend/lib/api.ts`의 타입 정의도 반드시 동시 수정

### 비즈니스 정책 교훈
5. **만료 정책은 상태 기반**: 24시간 시간 기반 만료 → 혼란. CONNECTED/COMPLETED 상태 기반 만료가 실운영에 적합
6. **영업시간 > 휴무일**: 두 데이터 충돌 시 "더 구체적인 정보"가 우선. operatingHours 설정 있으면 holidays 무시

## DB 안전 관리 (2026-03-16 추가) 🚨 치명적

### 프로덕션 DB 조작 금지 규칙
1. **`prisma db push` 프로덕션 절대 사용 금지**: 스키마 차이가 크면 DB를 리셋함. 2026-03-16 인센티브 데이터 전량 손실 사고 발생
2. **마이그레이션만 사용**: 새 모델/컬럼 추가 시 반드시 `prisma migrate dev --create-only` (로컬) → `prisma migrate deploy` (서버)
3. **로컬 DB 없으면 SQL 직접 작성**: 마이그레이션 파일 수동 생성 or 서버에서 `ALTER TABLE` / `CREATE TABLE` 직접 실행
4. **DB 백업 습관**: 스키마 변경 전 반드시 `pg_dump`로 백업. `docker exec postgres pg_dump -U postgres mechanic_db > backup.sql`
5. **변경 전 데이터 확인**: `SELECT COUNT(*)` 등으로 기존 데이터 존재 확인 후 작업

## 영업일수 & 데이터 정합성 (2026-03-17 추가)

### 영업일수 계산 버그
1. **매출 데이터는 전일까지**: 엑셀 업로드 기반이므로 매출 데이터는 전일까지만 반영. `tyElapsed`는 오늘이 아닌 `today - 1`까지 계산해야 함. 오늘 포함 시 일평균 매출이 실제보다 낮게 표시됨 (434만 vs 461만)
2. **공휴일 = 1/1 + 설(+대체공휴일) + 추석(+대체공휴일)만**: 정비소는 매일 영업 (일요일 포함). 대체공휴일은 일요일 겹칠 때만 발생
3. **영업일 하드코딩 주의**: 2026→2027→2028 넘어갈 때 반드시 설/추석 날짜 추가 필요 (음력 기반이라 자동 계산 불가)

### 인센티브 대시보드 패턴
4. **프론트엔드 단독 기능 추가 가능**: 기존 읽기 API만으로 새 탭(마스터 인사이트) 전체 구현 가능. 백엔드 변경 없이 `dashboard/summary` + `director/monthly` + `cashflow` API 조합으로 풍부한 분석 UI 구축
5. **`insightLoaded` 패턴**: 한 번 로드한 탭은 재로드 방지. 기존 팀/매니저/부장 탭 모두 이 패턴 사용
6. **CSS-only 차트**: Chart.js 없이 순수 CSS 바 차트로 충분. 유지보수 단순, 로딩 빠름

### 업로드 코드 통합 교훈
7. **중복 함수 방치 금지**: `uploadExcel()`과 `uploadExcel2()`처럼 동일 기능이 2개 존재하면 즉시 통합. ID 충돌 위험 + 유지보수 2배

## 보안 교훈 (2026-03-17 전수조사) 🚨 치명적

### 비밀번호 관리
1. **평문 비밀번호 절대 금지**: `plainPassword` 같은 평문 저장 필드 사용 금지. 반드시 bcrypt 해싱. API 응답에서도 제외
2. **JWT fallback secret 금지**: `process.env.JWT_SECRET || 'fallback-secret'` 패턴 금지. 환경변수 없으면 서버 시작 거부해야 함

### XSS 방어
3. **innerHTML 사용 자제**: 사용자 데이터가 포함될 수 있는 곳에 innerHTML 금지. textContent 또는 DOMPurify 사용
4. **JSON-LD 이스케이핑**: 구조화 데이터에 동적 값 삽입 시 반드시 이스케이핑 확인

### 업로드 보안
5. **파일 업로드 검증 필수**: multer 파일 크기 제한 + MIME 타입 화이트리스트. 검증 없는 업로드 = 서버 크래시 위험
6. **역할 기반 권한 체크**: viewer 역할에게 업로드/수정 권한 주지 말 것. 컨트롤러 레벨에서 role 체크

## 코드 품질 교훈 (2026-03-17 전수조사)

### 중복 제거 원칙
1. **유틸 함수 복붙 금지**: `formatPhone()` 5곳 복붙 → 반드시 `shared/utils.ts`로 추출. 2곳 이상 사용되면 즉시 공통화
2. **상수 단일 소스**: `ITEM_RATES`, `LAST_YEAR_REVENUE` 등 상수가 2곳 이상에 정의되면 동기화 버그 100% 발생

### 성능
3. **N+1 쿼리 경계**: 루프 안에서 DB 호출 발견하면 즉시 `include`/`join`으로 변환
4. **limit 하드코딩 금지**: `limit=1000` 대신 페이지네이션 구현. 데이터 증가하면 성능 급락

## DB 데이터 형식 교훈 (2026-03-17 사이트 다운 사고) 🚨 치명적

### JSON 필드 형식 불일치 = 사이트 크래시
1. **operatingHours 형식 통일 필수**: 프론트엔드 `OperatingHours` 타입은 `{"mon":{"open":"09:00","close":"19:00"}}` 객체 형식. 문자열 `{"mon":"09:00-19:00"}` 또는 배열 `[{"day":"월","open":"09:00","close":"19:00"}]` 형식은 `.open.split(':')` 에서 크래시 발생
2. **holidays 형식 통일 필수**: `HolidayInfo` 타입은 `{"type":"weekly","days":["일요일"],"description":"매주 일요일 휴무"}` 객체. 단순 배열 `["일요일"]`은 타입 불일치
3. **SQL로 DB 직접 수정 시 프론트엔드 타입 먼저 확인**: INSERT/UPDATE 전에 반드시 `frontend/types/index.ts`의 인터페이스 확인 후 해당 형식에 맞춰 JSON 입력
4. **테스트 데이터 ≠ 실데이터**: 기존 시드 데이터와 다른 형식으로 넣으면 100% 크래시. 기존 데이터 형식 SELECT 후 동일 형식으로 입력

## 대장님 원칙 (2026-03-17 제정) ⭐ 최상위 원칙

### AI 작업 원칙 — "왜 하는가 + 전문가 접근법"
> 대장님이 아이디어를 주면, AI는 반드시 아래 3가지를 먼저 분석한다:
> 1. **왜 하는가?** — 이 작업의 본질적 이유, 비즈니스 임팩트
> 2. **이 분야 전문가는 누구인가?** — 15년+ 경력 실무 전문가 탐색
> 3. **전문가라면 어떻게 설계하고 진행할까?** — 전문가 기준의 접근법, 단계, 프레임워크

### 데이터의 힘 — 극동 전산화 비전
- 극동 프로그램의 로우데이터(고객, 제품, 방문일시) → AWS → 웹 대시보드
- 고객 방문 날짜/시간을 아는 것이 핵심 인사이트의 시작
- AI가 이 데이터를 처리하면: 고객이 뭘 필요로 하는지, 뭘 좋아하는지 예측 가능
- 대표님 인사이트: 오늘 고객수, 하루 매출, 전년 동월동일 비교, 매일 7시 리포트
- **오프라인(정비소) ↔ 온라인(데이터) 세계를 잇는 것이 대장님의 핵심 역량**

### CRM 리텐션 연결 — 카카오톡 전략
- 3개월/6개월 전 고객에게 카카오톡 메시지 자동 발송
- 비수기: 특별 이벤트(비오는 날 할인, 계절 점검 무료 등)
- 미끼 설계: 받을 차(예비 고객)도 타겟팅
- **데이터(극동) + 메시징(카카오) = 자동화된 고객 재방문 엔진**

### AI 역할 분담 구상
- 기초 AI: 정보 수집, 원칙 질문("왜?", "전문가는?"), 미래 계획
- 실행 AI: 코드 작성, 배포, 구현
- 각 AI에 필요한 정보를 부분적으로 배치

---

## 마이그레이션 배포 교훈 (2026-03-19 502 사고) 🚨 치명적

### 원인: git에 이미 서버 적용된 마이그레이션 파일 추가 → 서버에서 중복 실행 시도 → 충돌 → 백엔드 사망 → 502
1. **이미 서버에 적용된 마이그레이션 파일을 git에 새로 추가하면 안 됨**: `prisma migrate deploy`가 "이미 DB에 있는 테이블을 다시 만들려고" 시도 → 실패 → 백엔드 무한 재시작
2. **마이그레이션 파일은 로컬에서 `prisma migrate dev`로 생성 → 즉시 커밋해야 함**: 나중에 한꺼번에 추가하면 서버 DB 상태와 충돌
3. **배포 전 반드시 확인**: `git diff --cached` 에서 `prisma/migrations/` 폴더에 새 파일이 있으면, 서버 DB에 이미 적용된 건지 확인
4. **복구 방법**: `docker exec postgres psql -c "UPDATE _prisma_migrations SET finished_at=NOW(), applied_steps_count=1 WHERE finished_at IS NULL"` → 백엔드 재시작
5. **프론트엔드 컨테이너도 확인**: 백엔드가 죽으면 헬스체크 실패로 프론트엔드도 안 뜰 수 있음. `docker compose up -d frontend` 별도 실행

### 예방 규칙
- **커밋 전**: `git diff --cached --name-only | grep migrations` 로 마이그레이션 파일 포함 여부 확인
- **포함되면**: 서버에서 `SELECT migration_name FROM _prisma_migrations` 대조
- **이미 적용됐으면**: git에서 제외 (`git reset HEAD backend/prisma/migrations/해당폴더`)

## 인센티브 페이지 구조 교훈 (2026-03-19)

### 단일 HTML 파일의 한계
1. **frontend-incentive/index.html 한 파일에 모든 기능**: 로그인/검색/차트/시재관리/계정관리가 전부 한 파일 → 한 줄 에러 = 전체 페이지 마비
2. **장기적으로 Next.js 이전 필요**: 모듈 격리, 에러 바운더리, 코드 분할 → 한 기능 깨져도 다른 기능 정상

## 극동 자동 동기화 교훈 (2026-03-19)

### 윈도우 작업 스케줄러 불안정
1. **SYSTEM 계정 권한 문제**: 작업 스케줄러가 SYSTEM으로 실행해도 python 경로/네트워크 접근 실패 가능
2. **해결: 상주형 데몬으로 전환**: 파이썬 스크립트 내부에서 3분 루프 + watchdog.vbs로 시작 프로그램 등록 → 작업 스케줄러 완전 제거
3. **수동 업로드 바로가기**: 바탕화면에 `GD_ManualUpload` 아이콘 → 퇴근 전 더블클릭으로 수동 업로드

---

## 배포 캐시 교훈 (2026-03-21) 🚨 반복 발생

### Docker BuildKit 캐시 = 배포 반영 안 됨
1. **`--no-cache`만으로는 부족**: Dockerfile 레이어 캐시는 무시되지만 **BuildKit 내부 빌드 캐시**는 별도로 남아있음. `docker builder prune -af`로 완전 삭제 필요
2. **배포 후 반영 안 되면 의심 순서**:
   - ① 서버 소스코드 확인 (`grep` 으로 서버 파일 직접 확인)
   - ② Docker 컨테이너 안의 빌드 결과 확인 (`docker exec ... cat`)
   - ③ Nginx 캐시 삭제 (`sudo rm -rf /var/cache/nginx/*`)
   - ④ BuildKit 캐시 삭제 (`docker builder prune -af`)
   - ⑤ 브라우저 강제 새로고침 (Cmd+Shift+R)
3. **프론트엔드 배포 안전 명령어 (정석)**:
   ```bash
   docker builder prune -af
   docker compose -f docker-compose.prod.yml build --no-cache frontend
   docker compose -f docker-compose.prod.yml up -d frontend --force-recreate
   sudo rm -rf /var/cache/nginx/* && sudo nginx -s reload
   ```
4. **배포 후 반드시 직접 접속해서 확인**: 코드가 맞아도 캐시 때문에 반영 안 될 수 있음. Chrome에서 직접 페이지 열어서 눈으로 확인

### 마이그레이션 권한 교훈 (P3009 사고)
5. **`app_user`로 ALTER TABLE 불가**: CashFlow 테이블 소유자가 다르면 마이그레이션 실패 → 백엔드 무한 재시작 → 모든 API 죽음 → 로그인 불가
6. **마이그레이션 전 테이블 소유권 확인**: `\dt "테이블명"` 으로 소유자 확인 → `ALTER TABLE OWNER TO migration_user` 선행
7. **P3009 복구**: 실패한 마이그레이션을 수동 적용 후 `UPDATE _prisma_migrations SET finished_at=NOW(), applied_steps_count=1 WHERE migration_name='...'`

### 인센티브 계산 로직 중복 (3곳 복사 사고)
8. **같은 계산 로직이 3곳에 복사**: TeamService, ManagerService, DashboardService에 동일 로직 → 한 곳만 수정하면 나머지 불일치 → 숫자 오류
9. **해결: CalcEngine 단일 소스**: 모든 계산은 `calc-engine.service.ts` 한 곳에만. 다른 서비스는 호출만

## 오류 대응 루틴 (2026-03-21 제정) ⭐

> 문제 발생 시 반드시 이 순서로 처리:
> 1. **오류 파악** — 증상 확인 (스크린샷, 로그, 에러 메시지)
> 2. **핵심 원인 (워크플로우 관점)** — 왜 이 문제가 발생했는지 근본 원인
> 3. **비유적으로 대장에게 설명** — 정비소/군대 비유로 쉽게 설명
> 4. **문제 해결** — 코드 수정 + 배포 + 직접 접속 확인
> 5. **기록** — lessons.md에 기록하여 재발 방지

## 테스트 스크립트 안전 규칙 (2026-03-24 데이터 삭제 사고) 🚨 치명적

### 원인: 테스트 스크립트가 프로덕션 DB에서 WHERE 조건 없이 DELETE 실행
1. **DELETE 쿼리에 반드시 TEST_ 필터**: `DELETE FROM table WHERE slot = 'A'` (전체 삭제) → 금지. `DELETE FROM table WHERE slot = 'A' AND fno LIKE 'TEST_%'` (테스트 데이터만) → 필수
2. **프로덕션 DB에서 테스트 실행 시 트랜잭션 ROLLBACK 고려**: `BEGIN; ... ROLLBACK;` 으로 감싸거나, `--dry-run` 모드 기본값
3. **DELETE 전 COUNT 확인**: 삭제 대상 건수를 먼저 출력하고, 예상과 다르면 중단
4. **복원: 3단계 백업 덕분에 5분 내 복구 완료**: hourly 백업에서 `sed + COPY` 방식으로 특정 테이블만 추출 복원 가능

### 스키마 변경 연쇄 파괴 (같은 날)
5. **`@unique` → `@@unique([code, slot])` 변경 시**: `findUnique({ where: { code } })` 쓰는 **모든 파일** 검색 필수. `grep -r "findUnique.*code" backend/src/`
6. **관계(relation) 제거 시**: `include: { 관계명 }` 쓰는 모든 파일 검색. `grep -r "include.*reminders" backend/src/`
7. **공유 테이블 변경 = 양쪽 모듈 빌드 검증**: BRAIN.md 구조도의 "벽" 양쪽 모두 `tsc --noEmit` 확인

### 시소 테스트 세션 추가 교훈
8. **옛날 유니크 인덱스 잔존 문제**: Prisma 스키마에서 `@@unique([code, slot])` 추가해도, DB에 기존 `code_key` 유니크 인덱스가 남아있을 수 있음. `ALTER TABLE DROP CONSTRAINT` 뿐 아니라 `DROP INDEX`도 확인 필수. `pg_indexes` 테이블에서 직접 확인: `SELECT indexname FROM pg_indexes WHERE tablename='테이블명' AND indexdef LIKE '%UNIQUE%'`
9. **FK가 옛날 유니크를 참조**: 단일 유니크 인덱스를 삭제하려면 해당 인덱스를 참조하는 FK를 먼저 삭제해야 함. 순서: FK 삭제 → 옛날 인덱스 삭제 → 새 compound FK 생성
10. **테스트 4회 반복으로 안정성 확인**: 1회 통과는 우연일 수 있음. 최소 3회 연속 PASS + 데이터 무결성 변동 0건 확인이 "안정" 기준

*마지막 업데이트: 2026-03-24 (A/B 시소 테스트 사고 + 스키마 연쇄 파괴 + 시소 테스트 4회 ALL PASS)*
