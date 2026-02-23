# 카카오 로그인 설정 가이드
> KOE101 오류 해결을 위한 단계별 설정 방법

---

## STEP 1: 카카오 개발자 콘솔 접속

1. https://developers.kakao.com 접속 (Chrome)
2. **로그인** → **내 애플리케이션** 클릭
3. 기존 앱이 있으면 선택, 없으면 **애플리케이션 추가하기** 클릭
   - 앱 이름: `꿈꾸는정비사`
   - 사업자명: 본인 이름 또는 사업자명

---

## STEP 2: 앱 키 확인

**앱 설정 → 앱 키** 메뉴에서:
- **REST API 키** 복사 → `KAKAO_CLIENT_ID`에 입력
- (Client Secret은 보안 > Client Secret 메뉴에서 생성 필요)

---

## STEP 3: 카카오 로그인 활성화

1. **제품 설정 → 카카오 로그인** 클릭
2. **활성화 설정** → ON으로 변경

---

## STEP 4: Redirect URI 등록 (핵심!)

**제품 설정 → 카카오 로그인 → Redirect URI** 에서 **아래 4개** 모두 등록:

```
# 로컬 개발 (백엔드 직접)
http://localhost:3001/auth/kakao/callback
http://localhost:3001/auth/kakao/customer/callback

# 프로덕션
https://dreammechaniclab.com/auth/kakao/callback
https://dreammechaniclab.com/auth/kakao/customer/callback
```

> ⚠️ 4개 다 등록 안 하면 KOE101 오류 발생!

---

## STEP 5: 동의항목 설정

**제품 설정 → 카카오 로그인 → 동의항목** 에서:
- **닉네임**: 필수 동의
- **프로필 사진**: 선택 동의
- **카카오계정(이메일)**: 선택 동의

---

## STEP 6: Client Secret 생성 (선택이지만 권장)

**앱 설정 → 보안 → Client Secret** 메뉴에서:
1. **코드 생성** 클릭 → 시크릿 코드 복사 → `KAKAO_CLIENT_SECRET`에 입력
2. **활성화 상태**: 사용함으로 변경

---

## STEP 7: backend/.env 파일에 입력

```bash
# /Users/shinjeayoun/dreaming-mech/backend/.env 파일 열어서 수정

KAKAO_CLIENT_ID="발급받은_REST_API_키_여기_입력"
KAKAO_CLIENT_SECRET="발급받은_시크릿_여기_입력"
KAKAO_CALLBACK_URL="http://localhost:3001/auth/kakao/callback"
KAKAO_CUSTOMER_CALLBACK_URL="http://localhost:3001/auth/kakao/customer/callback"
FRONTEND_URL="http://localhost:3000"
```

---

## STEP 8: 백엔드 서버 시작

```bash
# 터미널에서:
cd /Users/shinjeayoun/dreaming-mech/backend
npm run start:dev
```

---

## 테스트 방법

1. http://localhost:3000 접속
2. 지역 선택 → 서비스 선택 → 전화번호 입력
3. **카카오로 문의 접수** 클릭
4. 카카오 로그인 완료
5. 문의 접수 완료 화면 확인
6. 텔레그램에 알림 도착 확인 (텔레그램 설정 완료 시)

---

## 자주 발생하는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| KOE101 | KAKAO_CLIENT_ID 미설정 또는 Redirect URI 미등록 | STEP 2, 4 재확인 |
| KOE006 | Redirect URI 불일치 | 코드의 callback URL과 콘솔 등록 URL 일치 여부 확인 |
| 401 Unauthorized | JWT 토큰 없음 | 카카오 로그인 완료 후 다시 시도 |

---

*작성일: 2026-02-23*
