# SOLAPI 카카오 알림톡 설정 가이드

> 고객 문의 접수 시 해당 지역 정비사에게 카카오 알림톡 자동 발송

---

## 📋 전체 흐름

```
고객 문의 접수
    ↓
1. 운영자 텔레그램 알림 (즉시)
2. 해당 지역 정비사에게 카카오 알림톡 자동 발송 ← 이 기능
```

---

## STEP 1 — SOLAPI 가입

👉 https://solapi.com 접속 → 회원가입

- 법인/개인 사업자 등록 필요
- 가입 후 대시보드에서 **API Key** 발급

---

## STEP 2 — 카카오 채널 연결 (플러스친구)

1. 카카오 비즈니스 채널 개설: https://business.kakao.com
2. SOLAPI 대시보드 → **카카오 채널** → 채널 연결
3. 연결 후 **pfId** (채널 ID) 복사

---

## STEP 3 — 알림톡 템플릿 등록 및 승인

SOLAPI 대시보드 → **알림톡 템플릿** → 새 템플릿 만들기

### 문의 알림용 템플릿 (SOLAPI_INQUIRY_TEMPLATE_ID)

**템플릿 제목:** 새 고객 문의 알림

**템플릿 내용 (승인 요청할 텍스트):**
```
[꿈꾸는정비사] 새 고객 문의가 접수됐어요 🔔

정비소: #{정비소명}
지역: #{지역}
서비스: #{서비스}
내용: #{내용}

👉 고객 연락처 확인:
#{링크}
```

**변수 설명:**
| 변수 | 예시 |
|------|------|
| `#{정비소명}` | 김사장 타이어 |
| `#{지역}` | 경기도 수원시 |
| `#{서비스}` | 타이어 |
| `#{내용}` | 앞 타이어 2개 교체 필요합니다 |
| `#{링크}` | https://dreammechaniclab.com/inquiry/123 |

> ⚠️ 템플릿 승인까지 1~3 영업일 소요됩니다.

---

## STEP 4 — 발신 번호 등록

SOLAPI 대시보드 → **발신번호 관리** → 번호 등록

- 실제 운영 전화번호 등록 (사업자 번호 확인 필요)
- 인증 후 `SOLAPI_SENDER_PHONE`에 입력

---

## STEP 5 — .env 파일 설정

`backend/.env` 파일에서 아래 주석 해제 후 실제 값 입력:

```bash
SOLAPI_API_KEY="콘솔에서_복사한_API_KEY"
SOLAPI_API_SECRET="콘솔에서_복사한_API_SECRET"
SOLAPI_SENDER_PHONE="01012345678"      # 하이픈 없이
SOLAPI_KAKAO_CHANNEL_ID="pfXXXXXXXX"  # 카카오 채널 ID
SOLAPI_INQUIRY_TEMPLATE_ID="TXXXXXXXX" # 문의 알림 템플릿 ID
```

---

## STEP 6 — 사장님 전화번호 등록

사장님들이 알림을 받으려면:

1. 사장님이 `https://dreammechaniclab.com/owner` 접속
2. **알림톡 수신 설정** 섹션에서 전화번호 입력 및 저장
3. 이후 해당 지역 문의 시 자동 발송

---

## 알림 발송 조건 (코드 로직)

새 고객 문의 접수 시:
- ✅ `Mechanic.isActive = true` (활성 정비소)
- ✅ `Mechanic.phone` 있음 (전화번호 등록됨)
- ✅ `Owner.status = APPROVED` 또는 독립 정비소 (ownerId 없음)
- ✅ `Mechanic.location`이 문의 지역(`regionSigungu` 또는 `regionSido`)을 포함

---

## 비용

| 항목 | 비용 |
|------|------|
| 알림톡 1건 | 약 8원 |
| 월 100명 정비사 × 평균 30건 문의 | 약 24,000원 |
| 월 100명 × 100건 문의 | 약 80,000원 |

> 건당 비용이 낮아 초기에는 큰 부담 없음

---

## 현재 구현 상태

- [x] NotificationService.sendServiceInquiryAlimtalk() 구현 완료
- [x] ServiceInquiry 생성 시 자동 발송 로직 연결 완료
- [x] Owner 대시보드 전화번호 입력 UI 완료
- [ ] SOLAPI 가입 및 API 키 발급 (사용자 직접)
- [ ] 카카오 채널 연결 (사용자 직접)
- [ ] 템플릿 등록 및 승인 대기 (사용자 직접)
- [ ] .env에 실제 키 입력 (사용자 직접)

---

*마지막 업데이트: 2026-02-24*
