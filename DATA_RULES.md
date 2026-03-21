# 데이터 코드 규칙 (수학의 정석)

> 꿈꾸는정비사 데이터를 다루는 모든 코드에 적용되는 불변 규칙.
> 이 규칙은 예외 없이 적용된다. 새 기능 추가 시에도 동일.
> 최종 수정: 2026-03-21

---

## 규칙 1: BigInt 처리

### 원칙
PostgreSQL의 `BigInt` 타입은 JavaScript의 `number` 범위를 초과할 수 있다.
JSON 직렬화 시 오류가 발생하므로, 전역 변환을 등록해야 한다.

### 등록 위치
`backend/src/main.ts` (앱 부트스트랩 시 1회)

```typescript
(BigInt.prototype as any).toJSON = function() { return Number(this); };
```

### 규칙

| 위치 | 처리 방법 |
|------|-----------|
| `main.ts` | 전역 `toJSON` 등록 (이미 설정됨) |
| Prisma Service | BigInt 필드 반환 시 `Number()` 변환 |
| 프론트엔드 | 모든 금액 필드는 `number` 타입으로 사용 |
| API 응답 | JSON 직렬화 시 자동 변환됨 (전역 설정) |

### 금지 사항
- `BigInt` 값을 `String()`으로 변환하여 프론트에 보내지 말 것
- 프론트에서 `BigInt()` 직접 사용 금지
- Prisma 쿼리 결과를 변환 없이 그대로 응답에 넣지 말 것 (BigInt 필드 확인)

---

## 규칙 2: 시간대 (KST)

### 원칙
서버 시간은 UTC. 한국 시간(KST, UTC+9)이 필요한 모든 곳에서
반드시 `utils/kst.ts` 유틸리티만 사용한다.

### 유틸리티 함수

| 함수 | 반환 타입 | 용도 |
|------|-----------|------|
| `nowKST()` | `Date` | 현재 한국 시각 (Date 객체) |
| `todayKST()` | `string` | 오늘 날짜 `'YYYY-MM-DD'` |
| `getYearMonthKST()` | `{ year, month }` | 현재 연도/월 |

파일 위치: `backend/src/incentive/utils/kst.ts`

### 규칙

| 상황 | 올바른 코드 | 잘못된 코드 |
|------|------------|------------|
| 오늘 날짜 필요 | `todayKST()` | `new Date().toISOString().slice(0,10)` |
| 현재 시각 필요 | `nowKST()` | `new Date()` |
| 연/월 필요 | `getYearMonthKST()` | `new Date().getMonth()+1` |
| DB 저장 | ISO 문자열(UTC) 또는 `'YYYY-MM-DD'` | KST Date 객체 직접 저장 |
| 화면 표시 | 프론트에서 KST 변환 | 서버에서 포맷팅된 문자열 전송 |

### 금지 사항
- `new Date()`를 한국 날짜 판단에 직접 사용 금지
- 날짜 비교 시 시간대 미고려 금지
- 서버에서 `'오전'`, `'오후'` 같은 로케일 문자열 생성 금지 (프론트 담당)

---

## 규칙 3: 상수 관리

### 원칙
모든 비즈니스 상수는 한 곳에서 관리한다.
코드에 숫자가 직접 등장하면 그것은 버그다.

### 상수 파일
`backend/src/incentive/constants/rates.ts`

```typescript
// 현재 정의된 상수
ITEM_RATES       // 품목별 인센티브 요율 (%)
BASE_SALARY      // 기본급 (3,300,000원)
DEFAULT_DIRECTOR_RATES  // 이사 인센티브 기본값
```

### 규칙

| 상황 | 올바른 방법 | 잘못된 방법 |
|------|------------|------------|
| 인센티브 요율 | `ITEM_RATES.brake_oil` | `2.8` |
| 기본급 | `BASE_SALARY` | `3300000` |
| 손익분기점 | `DEFAULT_DIRECTOR_RATES.breakeven` | `145000000` |
| 새 상수 추가 | `rates.ts`에 추가 후 import | 서비스 파일에 직접 선언 |

### 2곳 규칙
같은 값이 2곳 이상에서 사용되면 **반드시** 상수로 추출한다.
예외 없음. `0`, `1`, `100` 같은 자명한 값도 비즈니스 의미가 있으면 상수화.

### 금지 사항
- 매직 넘버 (의미 없는 숫자 리터럴) 금지
- 상수를 서비스 파일 내부에 `const`로 선언 금지 (반드시 `rates.ts`로)
- 프론트에서 비즈니스 상수 하드코딩 금지 (API로 받거나 `constants/` 폴더에 관리)

---

## 규칙 4: API 계약 (DTO)

### 원칙
프론트와 백엔드 사이의 데이터 형식은 DTO(Data Transfer Object)로 명시한다.
암묵적 계약은 버그의 원천이다.

### 규칙

| 요청 방향 | 필수 사항 |
|-----------|----------|
| POST/PUT 요청 | DTO 클래스 + `class-validator` 데코레이터 |
| GET 응답 | 타입 정의 (DTO 또는 interface) |
| 프론트 타입 | `frontend/types/` 폴더에 동기화 |

### DTO 작성 규칙

```typescript
// backend/src/incentive/auth/dto/login.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '아이디를 입력해주세요' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요' })
  password: string;
}
```

### 변경 시 동기화 절차
1. 백엔드 DTO 수정
2. 프론트엔드 `types/` 타입 수정
3. 프론트엔드 API 호출부 수정
4. 양쪽 빌드 확인

### 금지 사항
- DTO 없이 `@Body() body: any` 사용 금지
- `class-validator` 데코레이터 없는 DTO 금지
- 프론트 타입과 백엔드 DTO 불일치 상태로 배포 금지

---

## 규칙 5: 에러 처리

### 원칙
사용자에게 보여주는 에러 메시지는 한국어.
HTTP 상태 코드는 의미에 맞게 사용한다.

### HTTP 상태 코드 규칙

| 코드 | 의미 | 사용 시점 | 메시지 예시 |
|------|------|----------|------------|
| 400 | 잘못된 입력 | DTO 검증 실패, 잘못된 파라미터 | `'날짜 형식이 올바르지 않습니다'` |
| 401 | 인증 실패 | 토큰 없음/만료/잘못됨 | `'로그인이 필요합니다'` |
| 403 | 권한 없음 | 역할 부족 (일반 사용자가 관리자 API) | `'접근 권한이 없습니다'` |
| 404 | 리소스 없음 | ID로 조회했는데 없음 | `'데이터를 찾을 수 없습니다'` |
| 409 | 충돌 | 중복 데이터 등록 시도 | `'이미 등록된 데이터입니다'` |
| 500 | 서버 오류 | 예상치 못한 에러 | `'서버 오류가 발생했습니다'` |

### 에러 필터
`IncentiveExceptionFilter`가 전역 등록되어 있음.
모든 에러는 이 필터를 통해 일관된 형식으로 응답된다.

### 금지 사항
- 영문 에러 메시지를 사용자에게 노출 금지
- 500 에러에 스택 트레이스 노출 금지
- `throw new Error()` 대신 NestJS 예외 클래스 사용 (`BadRequestException` 등)
- 에러 무시 (`catch(e) {}`) 금지 -- 최소한 로그는 남길 것

---

## 규칙 6: 인증

### 원칙
인증되지 않은 요청은 데이터에 접근할 수 없다.
모든 API 엔드포인트는 기본적으로 인증이 필요하다.

### 가드 적용 규칙

| API 유형 | 필수 가드 |
|----------|----------|
| 일반 API | `@UseGuards(IncentiveJwtGuard)` |
| 관리자 전용 | `@UseGuards(IncentiveJwtGuard)` + `@Roles('admin')` |
| 로그인/공개 | 가드 없음 (예외적으로 허용) |

### 인증 흐름

```
1. 로그인: POST /incentive/auth/login → JWT 발급 (7일 만료)
2. 저장: localStorage (zustand persist)
3. 요청: Authorization: Bearer {token}
4. 검증: IncentiveJwtGuard → RolesGuard
5. 만료: 401 응답 → interceptor → 자동 logout → /incentive/login
```

### 프론트엔드 인증 규칙
- 401 응답 시 자동 로그아웃 (axios interceptor에서 처리)
- 토큰 만료 시간(`expiresAt`)을 함께 저장하여 사전 체크 가능
- 로그인 페이지 외 모든 페이지에서 토큰 존재 확인

### 금지 사항
- 인증 가드 없는 데이터 API 생성 금지
- JWT 시크릿을 코드에 하드코딩 금지
- 프론트에서 토큰을 쿠키에 저장 금지 (localStorage 사용)
- 비밀번호를 평문으로 저장/전송 금지

---

## 규칙 7: 데이터 의존성

### 원칙
인센티브 계산은 정해진 순서가 있다.
상위 데이터가 없으면 하위 계산을 시도하지 않는다.

### 의존성 순서

```
1. 극동 ERP 동기화 (GdSaleDetail, GdRepair, GdVehicle)
     ↓
2. 팀 인센티브 (TeamIncentive) ← CSV 업로드 또는 자동계산
     ↓
3. 매니저 인센티브 (ManagerIncentive) ← 팀 데이터 필요
     ↓
4. 부장 인센티브 (DirectorIncentive) ← 매니저 데이터 필요
     ↓
5. 대시보드 (Dashboard) ← 전체 집계
```

### 규칙

| 상황 | 처리 |
|------|------|
| 상위 데이터 없이 하위 계산 요청 | 에러 반환 (`'팀 데이터를 먼저 등록해주세요'`) |
| 상위 데이터 변경 시 | 하위 데이터 재계산 필요 (자동 또는 수동) |
| 여러 테이블 동시 수정 | `$transaction` 사용 필수 |
| CSV 업로드 | 기존 월 데이터 있으면 덮어쓰기 (upsert) |

### 트랜잭션 규칙
데이터 일관성이 필요한 작업은 반드시 Prisma `$transaction` 사용.

```typescript
// 올바른 예시
await this.prisma.$transaction(async (tx) => {
  await tx.teamIncentive.upsert({ ... });
  await tx.managerIncentive.upsert({ ... });
});

// 잘못된 예시 (중간에 실패하면 불일치)
await this.prisma.teamIncentive.upsert({ ... });
await this.prisma.managerIncentive.upsert({ ... });
```

### 금지 사항
- 의존성 순서 무시하고 계산 금지
- 트랜잭션 없이 다중 테이블 수정 금지
- 상위 데이터 삭제 시 하위 데이터 고아 상태 방치 금지

---

## 규칙 8: 환경변수

### 원칙
앱이 필요한 환경변수가 없으면 시작하지 않는다.
런타임에 `undefined` 환경변수로 인한 오류는 있어서는 안 된다.

### 검증 시스템
`backend/src/config/env.validation.ts`에서 앱 부트스트랩 시 검증.

### 필수 환경변수

| 변수명 | 용도 | 검증 |
|--------|------|------|
| `DATABASE_URL` | DB 연결 (app_user) | `postgresql://` 형식 확인 |
| `MIGRATION_DATABASE_URL` | 마이그레이션 (migration_user) | docker-compose에서만 사용 |
| `JWT_SECRET` | 토큰 서명 | 32자 이상 + 약한 값 거부 |
| `NAVER_MAP_CLIENT_ID` | 네이버 지도 | 필수 |
| `NAVER_MAP_CLIENT_SECRET` | 네이버 지도 | 필수 |
| `ALLOWED_ORIGINS` | CORS 허용 도메인 | 쉼표 구분 |

### 선택적 환경변수 (기능별)

| 변수명 | 용도 | 미설정 시 |
|--------|------|----------|
| `USE_S3` | S3 사용 여부 | `false`면 로컬 저장소 |
| `AWS_*` | S3 설정 4종 | `USE_S3=false`면 스킵 |
| `KAKAO_*` | 카카오 OAuth | 카카오 로그인 불가 |
| `TELEGRAM_*` | 텔레그램 알림 | 알림 발송 안 됨 |
| `SOLAPI_*` | 알림톡 | 알림톡 발송 안 됨 |

### 금지 사항
- `.env` 파일을 git에 커밋 금지 (`.gitignore`에 등록됨)
- 코드에 환경변수 기본값 하드코딩 금지 (`process.env.X || '기본값'`)
- `JWT_SECRET`에 32자 미만 또는 약한 값 사용 금지
- `DATABASE_URL`에 `postgres` 슈퍼유저 사용 금지 (반드시 `app_user`)

---

## 부록: 규칙 위반 시 체크리스트

코드 리뷰에서 다음을 확인한다:

- [ ] BigInt 필드가 변환 없이 응답에 포함되지 않는가?
- [ ] `new Date()`가 한국 날짜 판단에 사용되지 않는가?
- [ ] 매직 넘버가 없는가?
- [ ] POST/PUT API에 DTO가 있는가?
- [ ] 에러 메시지가 한국어인가?
- [ ] 인증 가드가 적용되어 있는가?
- [ ] 다중 테이블 수정에 트랜잭션이 사용되는가?
- [ ] 환경변수가 `env.validation.ts`에 등록되어 있는가?
