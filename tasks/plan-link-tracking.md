# 기능: 링크 추적 + 회원가입(문의) 전환 추적 시스템

## 배경
- 사장님이 단톡방에 링크를 공유할 때, 몇 명이 클릭했는지 알 수 없음
- 특정 링크를 통해 누가 문의(회원가입)까지 했는지 추적 불가
- 링크가 활성화되는지(반응이 있는지) 확인할 방법 없음

## 핵심 컨셉
- Admin이 **추적 링크**를 생성 (예: "강남맘카페", "수원정비단톡방")
- 각 링크는 고유 코드 → `dreammechaniclab.com?ref=abc123`
- 누군가 클릭하면 `LinkClick` 기록
- 해당 링크로 들어온 사람이 **문의 접수**까지 하면 전환(Conversion)으로 기록
- Admin 대시보드에서 링크별 클릭수, 전환수, 전환율 확인

---

## 영향 분석

### 변경 필요 파일
| 파일 | 변경 내용 |
|------|----------|
| `backend/prisma/schema.prisma` | TrackingLink, LinkClick 모델 추가, ServiceInquiry에 trackingCode 추가 |
| `backend/src/app.module.ts` | TrackingLinkModule 등록 |
| `frontend/lib/api.ts` | trackingLinkApi 추가 |
| `frontend/types/index.ts` | TrackingLink, LinkClick 타입 추가 |
| `frontend/components/analytics/PageViewTracker.tsx` | ref 파라미터 캡처 + 클릭 기록 |
| `frontend/app/page.tsx` | 문의 접수 시 trackingCode 포함 |
| `backend/src/service-inquiry/service-inquiry.service.ts` | trackingCode 저장 로직 |
| `backend/src/service-inquiry/dto/create-service-inquiry.dto.ts` | trackingCode 필드 추가 |

### 새로 생성할 파일
| 파일 | 내용 |
|------|------|
| `backend/src/tracking-link/tracking-link.module.ts` | 모듈 정의 |
| `backend/src/tracking-link/tracking-link.controller.ts` | CRUD + 통계 API |
| `backend/src/tracking-link/tracking-link.service.ts` | 비즈니스 로직 |
| `frontend/lib/tracking.ts` | ref 캡처/복원 유틸 |
| `frontend/app/admin/tracking/page.tsx` | 추적 링크 관리 대시보드 |

### DB 스키마 변경: 있음
- `TrackingLink` 모델 신규
- `LinkClick` 모델 신규
- `ServiceInquiry.trackingCode` 필드 추가

---

## 구현 계획

### 1단계: DB 스키마 확장
**파일:** `backend/prisma/schema.prisma`

```prisma
// 추적 링크 모델
model TrackingLink {
  id          Int      @id @default(autoincrement())
  code        String   @unique  // 고유 코드 (예: "abc123")
  name        String             // 관리용 이름 (예: "강남맘카페")
  description String?            // 설명 (선택)
  targetUrl   String   @default("/")  // 도착 페이지 (기본: 홈)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  clicks      LinkClick[]
  inquiries   ServiceInquiry[]

  @@index([code])
  @@index([isActive])
}

// 링크 클릭 로그
model LinkClick {
  id             Int          @id @default(autoincrement())
  trackingLinkId Int
  trackingLink   TrackingLink @relation(fields: [trackingLinkId], references: [id], onDelete: Cascade)
  ipAddress      String?
  userAgent      String?      @db.Text
  isBot          Boolean      @default(false)
  clickedAt      DateTime     @default(now())

  @@index([trackingLinkId, clickedAt])
  @@index([ipAddress])
}
```

**ServiceInquiry 확장:**
```prisma
model ServiceInquiry {
  // ... 기존 필드 ...
  trackingCode    String?           // 어떤 추적 링크에서 왔는지
  trackingLink    TrackingLink?     @relation(fields: [trackingCode], references: [code])
}
```

### 2단계: 백엔드 — TrackingLink 모듈
**파일:** `backend/src/tracking-link/`

**API 엔드포인트:**
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/tracking-links` | 추적 링크 생성 | Admin |
| GET | `/tracking-links` | 전체 목록 (통계 포함) | Admin |
| GET | `/tracking-links/:id` | 상세 + 일별 클릭 추이 | Admin |
| PATCH | `/tracking-links/:id` | 수정 (이름, 활성화) | Admin |
| DELETE | `/tracking-links/:id` | 삭제 | Admin |
| POST | `/tracking-links/click` | 클릭 기록 (프론트에서 호출) | 공개 |

**통계 응답 예시:**
```json
{
  "id": 1,
  "code": "abc123",
  "name": "강남맘카페",
  "totalClicks": 156,
  "uniqueClicks": 89,
  "totalInquiries": 12,
  "conversionRate": 13.5,
  "isActive": true,
  "dailyClicks": [
    { "date": "2026-02-25", "clicks": 23 },
    { "date": "2026-02-26", "clicks": 45 }
  ]
}
```

### 3단계: 프론트엔드 — ref 캡처 유틸
**파일:** `frontend/lib/tracking.ts`

```typescript
// URL에서 ref 파라미터 캡처 → sessionStorage 저장
export function captureTrackingCode(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    sessionStorage.setItem('tracking_code', ref);
  }
  return ref || sessionStorage.getItem('tracking_code');
}

// 저장된 tracking code 반환
export function getTrackingCode(): string | null {
  return sessionStorage.getItem('tracking_code');
}
```

### 4단계: 프론트엔드 — 클릭 기록
**파일:** `frontend/components/analytics/PageViewTracker.tsx`

- 페이지 로드 시 `ref` 파라미터 감지
- 있으면 `POST /tracking-links/click` 호출 + sessionStorage에 저장
- 이후 문의 접수 시 해당 코드 함께 전송

### 5단계: 문의 접수에 trackingCode 포함
**파일:** `frontend/app/page.tsx` + `backend/src/service-inquiry/`

- 프론트: 문의 submit 시 `getTrackingCode()` 결과를 payload에 포함
- 백엔드: `CreateServiceInquiryDto`에 `trackingCode` 추가
- 백엔드: `ServiceInquiryService.create()`에서 trackingCode 저장

### 6단계: Admin 추적 링크 대시보드
**파일:** `frontend/app/admin/tracking/page.tsx`

**화면 구성:**
- 링크 생성 폼 (이름 + 설명)
- 링크 목록 테이블:
  - 이름 | 링크 URL | 클릭수 | 유니크 | 전환수 | 전환율 | 활성 | 생성일
  - 링크 복사 버튼
- 링크 클릭 시 상세 (일별 클릭 추이 차트)

---

## 사용자 플로우

```
[Admin] 추적 링크 생성 ("강남맘카페")
    ↓
코드 자동 생성: abc123
    ↓
공유 URL: dreammechaniclab.com?ref=abc123
    ↓
[Admin] 단톡방에 URL 공유
    ↓
[소비자] 링크 클릭 → 홈페이지 도착
    ↓
PageViewTracker: ref=abc123 감지 → POST /tracking-links/click
    ↓
sessionStorage에 "abc123" 저장
    ↓
[소비자] 4단계 문의 퍼널 진행 → 문의 접수
    ↓
trackingCode: "abc123" 함께 전송
    ↓
ServiceInquiry.trackingCode = "abc123" 저장
    ↓
[Admin] 대시보드에서 확인:
  - 강남맘카페: 89명 클릭, 12명 문의 → 전환율 13.5%
```

---

## 주의사항

1. **sessionStorage 사용** — 탭 닫으면 초기화. 같은 탭 내에서만 추적 (개인정보 보호)
2. **봇 필터링** — 기존 BotDetectionGuard 재활용
3. **코드 생성** — nanoid 6자리 (중복 방지 + 짧은 URL)
4. **기존 코드 최소 변경** — 새 모듈 중심, 기존 모듈은 trackingCode 필드만 추가
5. **성능** — LinkClick은 비동기 기록 (실패해도 사용자 경험 무관)
6. **활성/비활성** — isActive=false인 링크는 클릭 기록하지 않음 (expired link)
