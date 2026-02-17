# 꿈꾸는정비사 — 디자인 실행 스펙

> 이 문서는 Claude Code가 웹 디자인 작업 시 **즉시 참조하는 규칙서**입니다.
> 모든 값은 `frontend/app/globals.css`의 CSS 변수와 1:1 매핑됩니다.

---

## 1. 색상 토큰 매핑표

### 사용할 Tailwind 클래스 ↔ CSS 변수 ↔ Hex 값

```
용도               Tailwind 클래스       CSS 변수           Hex
─────────────────────────────────────────────────────────────────────
[60% 지배색 — 배경/여백/표면]
메인 배경           bg-white              --background       #FFFFFF
섹션 구분 배경       bg-bg-secondary       --bg-secondary     #F9FAFB
카드 내부/인풋 배경   bg-bg-tertiary        --bg-tertiary      #F3F4F6

[30% 보조색 — 브랜드 퍼플]
연한 퍼플 배경       bg-brand-50           --brand-50         #F5F3FF
태그/뱃지 배경       bg-brand-100          --brand-100        #EDE9FE
보더/디바이더        border-brand-200      --brand-200        #DDD6FE
보조 텍스트/아이콘    text-brand-400        --brand-400        #A78BFA
★ 메인 브랜드       text-brand-500        --brand-500        #7C4DFF
호버 상태           bg-brand-600          --brand-600        #6D3FE0
프레스/활성 상태     bg-brand-700          --brand-700        #5B2FC2

[10% 강조색 — 앰버/골드]
강조 뱃지           bg-accent-400         --accent-400       #FBBF24
CTA 보조 버튼       bg-accent-500         --accent-500       #F59E0B
호버 상태           bg-accent-600         --accent-600       #D97706

[텍스트]
기본 텍스트         text-text-primary      --text-primary     #111827
보조 텍스트         text-text-secondary    --text-secondary   #4B5563
힌트/라벨          text-text-tertiary     --text-tertiary    #6B7280
비활성/플레이스홀더  text-text-muted        --text-muted       #9CA3AF

[보더]
기본 보더           border-border          --border           #E5E7EB
경량 보더           border-border-light    --border-light     #F3F4F6
포커스 보더         border-border-focus    --border-focus     #7C4DFF

[시맨틱]
성공/영업중         text-[var(--color-success)]               #10B981
에러/휴무           text-[var(--color-error)]                 #EF4444
경고              text-[var(--color-warning)]                #F59E0B
정보/인증          text-[var(--color-info)]                   #3B82F6
```

### 색상 금지 목록

```
절대 사용 금지 (하드코딩 금지):
✗ text-[#7C4DFF]      → ✓ text-brand-500
✗ bg-[#F59E0B]        → ✓ bg-accent-500
✗ border-[#E5E7EB]    → ✓ border-border
✗ text-gray-900       → ✓ text-text-primary
✗ text-gray-500       → ✓ text-text-tertiary
✗ bg-gray-100         → ✓ bg-bg-tertiary
✗ bg-gray-50          → ✓ bg-bg-secondary
✗ bg-[#F8F7FC]        → ✓ bg-white (또는 bg-bg-secondary)
✗ bg-[#1A0A2E]        → ✓ bg-[#111827] (다크 배경)
✗ #7C3AED, #6D28D9    → 존재하지 않는 퍼플. brand-500만 사용
```

---

## 2. 타이포그래피 매핑표

### 폰트 크기 — 모듈러 스케일 (base 16px × 1.200)

```
레벨     CSS 변수            값        Tailwind 사용법                         용도
──────────────────────────────────────────────────────────────────────────────────────
Display  --text-display     48px/3rem   text-[var(--text-display)]             히어로 타이틀
H1       --text-h1          40px/2.5rem text-[var(--text-h1)]                  페이지 타이틀
H2       --text-h2          33px/2.074rem text-[var(--text-h2)]                섹션 타이틀
H3       --text-h3          28px/1.728rem text-[var(--text-h3)]                서브 섹션
H4       --text-h4          23px/1.44rem text-[var(--text-h4)]                 카드 타이틀, 모달 제목
H5       --text-h5          19px/1.2rem  text-[var(--text-h5)]                 리드 텍스트, 작은 제목
Body     --text-body        16px/1rem   text-[var(--text-body)]                본문, 버튼, 네비
Caption  --text-caption     13px/0.833rem text-[var(--text-caption)]            메타정보, 라벨
Small    --text-small       11px/0.694rem text-[var(--text-small)]              각주, 법적 고지
```

### 반응형 폰트 크기 패턴

```
요소 유형                   모바일(기본)                    데스크탑(md:)
─────────────────────────────────────────────────────────────────────────
섹션 타이틀                 text-[var(--text-h2)]          md:text-[var(--text-h1)]
서브 섹션 타이틀             text-[var(--text-h4)]          md:text-[var(--text-h3)]
카드 제목                   text-[var(--text-body)]         md:text-[var(--text-h5)]
모달 내 섹션 제목            text-[var(--text-h5)]          md:text-[var(--text-h4)]
본문 텍스트                 text-[var(--text-body)]         (변경 없음)
메타/라벨                   text-[var(--text-caption)]      md:text-[var(--text-body)]
```

### line-height 규칙

```
요소                 값        적용 방법
──────────────────────────────────────
Display, H1         1.1       leading-[1.1] (또는 globals.css h1~h6 기본값 1.2)
H2, H3              1.2       (globals.css 기본값)
H4, H5              1.3       leading-[1.3]
본문 (한글)          1.7       (globals.css p 태그 기본값)
Caption             1.4       leading-[1.4]
```

### font-weight 규칙

```
용도                 weight    Tailwind
──────────────────────────────────────
본문                 400       font-normal
중요 본문/네비        500       font-medium
서브 제목/라벨        600       font-semibold
제목/카드명           700       font-bold
히어로/큰 제목        800~900   font-extrabold / font-black
```

### letter-spacing 규칙

```
상황                 값            Tailwind
──────────────────────────────────────────────
큰 제목              -0.02em       tracking-tight (globals.css 기본)
본문                 -0.01em       (globals.css body 기본)
ALL CAPS 텍스트      +0.05em 이상   tracking-[0.05em] 또는 tracking-widest
MECHANICS 같은 라벨  +0.12em       tracking-[0.12em]
```

---

## 3. 간격 규칙

### 8px 그리드 토큰

```
Tailwind    px      용도
──────────────────────────────────────
p-1 / gap-1   4px   아이콘 내부 간격
p-2 / gap-2   8px   인라인 요소 사이
p-3 / gap-3  12px   모바일 카드 패딩
p-4 / gap-4  16px   sm: 카드 패딩, 기본 거터
p-5 / gap-5  20px   md: 카드 패딩
p-6 / gap-6  24px   lg: 카드 패딩, 섹션 내부
p-8 / gap-8  32px   섹션 간격
p-12        48px    큰 섹션 구분
p-16        64px    메이저 섹션 브레이크
p-24        96px    히어로 수직 패딩
```

### 반응형 점진적 전환 (필수 패턴)

```
✗ 금지: p-3 md:p-6             (12px → 24px = 2배 점프)
✓ 필수: p-3 sm:p-4 md:p-5      (12 → 16 → 20 = 점진적)

✗ 금지: gap-3 md:gap-6
✓ 필수: gap-4 sm:gap-5 md:gap-6

✗ 금지: py-8 md:py-24
✓ 필수: py-8 sm:py-12 md:py-16 lg:py-24

✗ 금지: text-sm md:text-2xl     (14px → 24px = 급격한 점프)
✓ 필수: text-[var(--text-body)] md:text-[var(--text-h5)]  (16px → 19px = 모듈러 스케일 1단계)
```

### 아이콘 크기 규칙

```
✗ 금지: 모바일/데스크탑용 아이콘 2개 렌더링
  <MapPin size={12} className="md:hidden" />
  <MapPin size={16} className="hidden md:block" />

✓ 필수: 단일 아이콘, 단일 크기
  <MapPin size={14} />                    (카드 내부 메타정보)
  <MapPin size={16} />                    (목록 아이템)
  <MapPin size={20} />                    (모달 정보 블록)
  <MapPin size={24} />                    (히어로/빈 상태)
```

### 컨테이너 너비

```
용도                 클래스
───────────────────────────────
기본 콘텐츠          max-w-6xl mx-auto px-4 sm:px-6 md:px-8
모달 내부 콘텐츠      max-w-3xl mx-auto px-5 sm:px-6
본문 텍스트          max-w-2xl
넓은 레이아웃        max-w-7xl mx-auto
```

---

## 4. 이미지 비율 규칙

```
컨텍스트                 비율         Tailwind 클래스         object-fit
──────────────────────────────────────────────────────────────────────
정비소 카드 썸네일        4:3          aspect-[4/3]           object-cover
정비소 메인 이미지(모달)   16:9         aspect-[16/9]          object-cover
프로필/아바타             1:1          aspect-square          object-cover
유튜브 임베드             16:9         aspect-video           —
갤러리 이미지             4:3 또는 3:2  aspect-[4/3]          object-cover
```

**규칙: 같은 목록 내 모든 카드는 동일 비율 사용. 혼합 금지.**

---

## 5. 그림자 체계

```
토큰         CSS 변수          Tailwind 사용법                    용도
──────────────────────────────────────────────────────────────────────
xs          --shadow-xs        shadow-[var(--shadow-xs)]          인풋 필드
sm          --shadow-sm        shadow-[var(--shadow-sm)]          카드 기본 상태
md          --shadow-md        shadow-[var(--shadow-md)]          카드 호버, 드롭다운
lg          --shadow-lg        shadow-[var(--shadow-lg)]          플로팅 요소
xl          --shadow-xl        shadow-[var(--shadow-xl)]          모달
```

---

## 6. 트랜지션 체계

```
토큰         CSS 변수             값        용도
──────────────────────────────────────────────────────
fast        --duration-fast     150ms     호버 색상 변경, 포커스 링
normal      --duration-normal   200ms     일반 상태 전환, 토글
slow        --duration-slow     300ms     확장/축소, 슬라이드, 모달

Tailwind 사용법:
  duration-[var(--duration-fast)]
  duration-[var(--duration-normal)]
  duration-[var(--duration-slow)]

easing (기본):
  cubic-bezier(0.4, 0, 0.2, 1) — Tailwind ease-in-out와 유사
```

---

## 7. 컴포넌트별 스펙

### 7-1. 카드 (MechanicCard)

```
구조:
┌──────────────────────┐
│   이미지 (4:3)        │  bg-bg-tertiary, object-cover
│                      │  group-hover:scale-105 duration-500
├──────────────────────┤
│ p-3 sm:p-4 md:p-5    │
│                      │
│ 제목 (body→h5)  bold │  text-text-primary, group-hover:text-brand-500
│ mb-2 sm:mb-3         │
│                      │
│ 📍 위치  caption→body │  text-text-secondary, icon 14px text-text-muted
│ 📞 전화  caption→body │  text-text-secondary, icon 14px text-text-muted
│                      │
│ ─── (md만) ────────── │  border-border-light
│ 자세히 보기 →         │  text-text-tertiary → brand-500
└──────────────────────┘

외곽: rounded-2xl, border border-[var(--border)]
그림자: shadow-[var(--shadow-xs)] → hover:shadow-[var(--shadow-lg)]
호버: whileHover={{ y: -6 }}, border-brand-400/40
```

### 7-2. 모달 (MechanicModal)

```
구조:
- 오버레이: bg-black/60 backdrop-blur-sm
- 모달: rounded-t-3xl, spring(damping:25, stiffness:200)
- 헤더: px-5 sm:px-6 py-4 sm:py-5, border-b border-[var(--border)]
  - 제목: text-h4 → md:text-h3, font-bold
  - 닫기: p-2 bg-bg-tertiary rounded-full, X size={20}
- 콘텐츠: max-w-3xl mx-auto px-5 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8
  - 대표 이미지: aspect-[16/9] rounded-2xl object-cover
  - 정보 아이콘: 전부 size={20}, p-2.5 bg-bg-secondary rounded-xl
  - 섹션 제목: text-h5 → md:text-h4, font-bold, text-text-primary
  - 본문: text-body, text-text-secondary, leading-[1.7]
- CTA 버튼:
  - 전화: bg-brand-500 hover:bg-brand-600 text-white
  - 견적: bg-accent-500 hover:bg-accent-600 text-white
  - 길찾기: border-2 border-[var(--border)] text-text-secondary → hover:border-brand-500
  - 공통: py-3.5 sm:py-4 rounded-xl font-bold text-body
```

### 7-3. 네비게이션 (Layout header)

```
- fixed top-0, bg-white/95 backdrop-blur-md
- border-b border-[var(--border)]
- max-w-6xl mx-auto px-4 sm:px-6 md:px-8
- h-14 md:h-16
- 로고: text-h5 md:text-h4 font-extrabold
  "꿈꾸는" text-text-primary + "정비사" text-brand-500
- 네비 링크: text-body text-text-secondary
  hover: text-brand-500 bg-brand-50
  duration: var(--duration-fast)
- 모바일 메뉴: bg-white, py-3.5 text-body
- 로그인 CTA: bg-brand-500 text-white rounded-xl
```

### 7-4. 히어로 섹션

```
- min-h-screen, 비디오 배경 + bg-black/65 오버레이
- max-w-5xl mx-auto px-6 sm:px-8
- 서브타이틀: text-[var(--accent-400)] text-body→h5→h4 tracking-[0.08em]
- 헤드라인: font-black leading-[1.1] clamp(1.75rem, 5vw, 5rem)
  첫줄: white, 둘째줄: text-brand-400
- 설명: text-white/60 text-body→h5→h4
```

### 7-5. 섹션 헤더 패턴

```
<div className="text-center mb-10 sm:mb-12 md:mb-16">
  <p className="text-accent-500 text-[var(--text-caption)] font-semibold tracking-[0.12em] uppercase mb-3">
    ENGLISH LABEL
  </p>
  <h2 className="text-[var(--text-h2)] md:text-[var(--text-h1)] font-black text-text-primary mb-3">
    한글 <span className="text-brand-500">강조</span> 제목
  </h2>
  <p className="text-text-tertiary text-[var(--text-body)] md:text-[var(--text-h5)]">
    설명 텍스트
  </p>
</div>
```

### 7-6. 카드 스켈레톤

```
- 카드와 동일 구조: rounded-2xl, border border-[var(--border)], animate-pulse
- 이미지: aspect-[4/3] bg-bg-tertiary
- 텍스트: p-3 sm:p-4 md:p-5 (카드와 동일)
- 바: h-5 bg-bg-tertiary rounded (제목), h-3.5 (본문)
```

### 7-7. 푸터

```
- bg-[#111827] py-10 sm:py-12 md:py-14
- max-w-6xl mx-auto px-6 sm:px-8 text-center
- 로고: text-h5 font-bold text-white/90 + 정비사 text-brand-400
- 카피라이트: text-caption text-white/40
```

---

## 8. 체크리스트 — 코드 작성 전 확인

```
□ 색상에 하드코딩 hex 값이 없는가? (토큰/변수만 사용)
□ 퍼플은 brand-500(#7C4DFF) 단일 계열인가? (유사 퍼플 혼용 금지)
□ 60-30-10 비율: 배경 흰색(60%), 퍼플 강조(30%), 앰버 CTA(10%)
□ 폰트 크기가 var(--text-*) 모듈러 스케일인가?
□ 반응형 전환이 점진적인가? (2배 점프 없음)
□ 아이콘이 단일 크기인가? (모바일/데스크탑 2개 렌더 금지)
□ 이미지에 aspect-ratio + object-cover가 있는가?
□ 같은 목록의 카드 이미지 비율이 통일되어 있는가?
□ 그림자가 var(--shadow-*) 토큰인가?
□ 트랜지션이 var(--duration-*) 토큰인가?
□ 한글 본문 line-height 1.6~1.7인가?
□ CTA 버튼 주변 여백이 충분한가?
□ 컨테이너가 max-w-6xl(기본) 또는 max-w-3xl(모달)인가?
□ WCAG AA 대비율 4.5:1 이상인가?
```

---

## 9. 빠른 결정 테이블

### "이 배경색은 뭘 쓰지?"

```
상황                     → 사용할 클래스
────────────────────────────────────────
페이지 전체 배경           → bg-white
섹션 구분이 필요할 때       → bg-bg-secondary
카드/인풋 내부 배경         → bg-bg-tertiary
퍼플 강조 배경 (뱃지 등)    → bg-brand-50 또는 bg-brand-100
다크 배경 (푸터 등)         → bg-[#111827]
오버레이                   → bg-black/60
히어로 오버레이             → bg-black/65
```

### "이 텍스트 색은 뭘 쓰지?"

```
상황                     → 사용할 클래스
────────────────────────────────────────
제목, 이름                → text-text-primary
본문, 설명               → text-text-secondary
라벨, 힌트               → text-text-tertiary
비활성, 플레이스홀더       → text-text-muted
브랜드 강조 텍스트        → text-brand-500
링크/전화번호            → text-brand-500
히어로 설명 (다크 배경)   → text-white/60
```

### "이 버튼은 어떻게 만들지?"

```
유형                     → 스타일
────────────────────────────────────────
프라이머리 CTA            → bg-brand-500 hover:bg-brand-600 text-white
세컨더리 CTA             → bg-accent-500 hover:bg-accent-600 text-white
고스트/아웃라인           → border-2 border-[var(--border)] text-text-secondary
                           hover:border-brand-500 hover:text-brand-500
텍스트 버튼              → text-brand-500 hover:bg-brand-50
비활성                   → bg-bg-tertiary text-text-muted cursor-not-allowed
공통                     → rounded-xl font-bold py-3.5 sm:py-4 text-body
```

### "이 간격은 얼마나?"

```
상황                     → 값
────────────────────────────────────────
아이콘과 텍스트 사이       → gap-1.5 sm:gap-2
카드 내부 패딩            → p-3 sm:p-4 md:p-5
카드 간 간격              → gap-4 sm:gap-5 md:gap-6
섹션 타이틀 → 콘텐츠      → mb-10 sm:mb-12 md:mb-16
섹션 간 간격              → py-16 sm:py-20 md:py-24
모달 내부 패딩            → px-5 sm:px-6 py-6 sm:py-8
모달 섹션 간              → space-y-6 sm:space-y-8
```
