# 디자인 스킬트리 로드맵

> 꿈꾸는정비사 프로젝트의 웹 디자인 품질을 프로 수준으로 끌어올리기 위한 학습 로드맵.
> TV, 영화 포스터, 미디어 브랜딩에서 추출한 원칙을 기반으로 구성.

---

## 목차

1. [현재 진단](#1-현재-진단--어디가-프로답지-못한가)
2. [Lv.1 색감 마스터](#2-lv1-색감-마스터--color-system)
3. [Lv.2 타이포그래피](#3-lv2-타이포그래피--typography-scale)
4. [Lv.3 비율과 여백](#4-lv3-비율과-여백--spacing--layout)
5. [Lv.4 시각적 위계](#5-lv4-시각적-위계--visual-hierarchy)
6. [Lv.5 미디어급 연출](#6-lv5-미디어급-연출--cinematic-design)
7. [실전 치트시트](#7-실전-치트시트)
8. [프로젝트 적용 계획](#8-프로젝트-적용-계획)

---

## 1. 현재 진단 — 어디가 프로답지 못한가

### 발견된 문제점

| 영역 | 문제 | 심각도 |
|------|------|--------|
| **색감** | 퍼플 컬러가 3개 계열로 분산 (#7C4DFF, #7C3AED, #6D28D9) | CRITICAL |
| **색감** | 컴포넌트마다 색상값 하드코딩 (CSS변수 미사용) | CRITICAL |
| **색감** | 60-30-10 비율 미적용. 퍼플이 과다 사용 | HIGH |
| **타이포** | 폰트 사이즈 체계 없음 (text-sm → text-2xl 급격한 점프) | HIGH |
| **타이포** | line-height 거의 미지정 (한글은 1.6 필요) | HIGH |
| **비율** | 모바일→데스크탑 간격 점프 과격 (p-3 → p-6, 아이콘 20px → 48px) | HIGH |
| **비율** | 카드 이미지 비율 불통일 | MEDIUM |
| **위계** | 인라인 스타일과 Tailwind 혼용 | MEDIUM |
| **위계** | 그림자(shadow) 체계 없음 | MEDIUM |

### 현재 컬러 맵

```
현재                          문제
─────────────────────────────────────────
#7C4DFF (brand-primary)    ┐
#7C3AED (accent)           ├── 비슷한 퍼플 3개가 혼재
#5B3FBF (brand-primary-dark)┘
#F59E0B (brand-accent)     ── 액센트가 하나뿐
#F8F7FC (background)       ── 너무 연한 라벤더
#1A0A2E (foreground)       ── 어두운 네이비 (좋음)
```

---

## 2. Lv.1 색감 마스터 — Color System

### 2-1. 60-30-10 법칙

인테리어 디자인에서 온 황금 비율. 모든 프로 디자인의 기본.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              60% — 지배색 (Dominant)              │
│         배경, 여백, 기본 표면                      │
│         흰색, 연한 회색, 오프화이트                  │
│                                                 │
│    ┌──────────────────────────────┐              │
│    │    30% — 보조색 (Secondary)   │              │
│    │    카드, 네비게이션, 섹션 구분  │              │
│    │    브랜드의 메인 컬러          │              │
│    │  ┌────────────┐              │              │
│    │  │ 10% 강조색  │              │              │
│    │  │ CTA 버튼    │              │              │
│    │  │ 링크, 뱃지  │              │              │
│    │  └────────────┘              │              │
│    └──────────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

**현재 문제:** 퍼플이 배경부터 버튼까지 전부 차지 → 60-30-10이 무너짐

### 2-2. 프로 브랜드의 색감 전략

| 브랜드 | 메인 컬러 | Hex | 전달 감정 | 사용 비율 |
|--------|----------|-----|----------|----------|
| Netflix | 레드 | `#E50914` | 흥분, 열정 | 10% 미만 (로고+CTA만) |
| Spotify | 그린 | `#1DB954` | 신선함, 활력 | 10% 미만 |
| Apple | 블루 | `#0066CC` | 혁신, 신뢰 | 5% 미만 |
| 카카오 | 옐로우 | `#FEE500` | 친근함, 따뜻함 | 로고 + 포인트 |
| 토스 | 블루 | `#3182F6` | 신뢰, 안정 | CTA + 핵심 요소만 |

**핵심:** 프로 브랜드일수록 메인 컬러 사용을 **극도로 절제**한다. 10% 이하.

### 2-3. 영화 포스터의 색감 법칙

| 장르 | 색감 전략 | 예시 |
|------|----------|------|
| **액션/스릴러** | 블루+오렌지 보색 대비 | 다크나이트, 매드맥스 |
| **공포** | 검정+빨강, 극단적 명암 | 겟아웃, 조커 |
| **SF** | 네온 사이안, 일렉트릭 블루 | 블레이드 러너, 트론 |
| **로맨스** | 파스텔, 핑크, 따뜻한 골드 | 라라랜드, 노팅힐 |
| **드라마** | 채도 낮은 따뜻한 톤 | 기생충, 미나리 |

**포스터 핵심 원칙:**
- 차가운 색(블루, 그린) → 배경으로 깔림
- 따뜻한 색(레드, 오렌지) → 전경에서 시선 잡음
- 이 대비가 자연스러운 **깊이감**을 만든다

### 2-4. 접근성 대비율 (WCAG)

| 요소 | AA 최소 | AAA 최적 |
|------|---------|---------|
| 일반 텍스트 (16px 미만) | **4.5:1** | **7:1** |
| 큰 텍스트 (18px 이상) | **3:1** | **4.5:1** |
| UI 컴포넌트 | **3:1** | — |

**도구:** WebAIM Contrast Checker 사용

### 2-5. 꿈꾸는정비사 추천 컬러 시스템

```css
/* ── 제안: 통합 컬러 시스템 ── */

/* Neutral (60% 지배색) */
--color-bg-primary:    #FFFFFF;     /* 메인 배경 */
--color-bg-secondary:  #F9FAFB;     /* 섹션 구분 배경 */
--color-bg-tertiary:   #F3F4F6;     /* 카드 내부 배경 */

/* Brand (30% 보조색) */
--color-brand-50:      #F5F3FF;     /* 연한 퍼플 배경 */
--color-brand-100:     #EDE9FE;     /* 태그, 뱃지 배경 */
--color-brand-500:     #7C4DFF;     /* 메인 브랜드 (이것 하나만!) */
--color-brand-600:     #6D3FE0;     /* 호버 상태 */
--color-brand-700:     #5B2FC2;     /* 활성/프레스 상태 */

/* Accent (10% 강조색) */
--color-accent-400:    #FBBF24;     /* 강조 뱃지 */
--color-accent-500:    #F59E0B;     /* CTA 보조 버튼 */
--color-accent-600:    #D97706;     /* 호버 */

/* Text */
--color-text-primary:  #111827;     /* 기본 텍스트 */
--color-text-secondary:#6B7280;     /* 보조 텍스트 */
--color-text-tertiary: #9CA3AF;     /* 힌트, 플레이스홀더 */

/* Semantic */
--color-success:       #10B981;     /* 성공, 영업중 */
--color-error:         #EF4444;     /* 에러, 휴무 */
--color-warning:       #F59E0B;     /* 경고 */
--color-info:          #3B82F6;     /* 정보 */

/* Border & Shadow */
--color-border:        #E5E7EB;     /* 기본 보더 */
--color-border-focus:  #7C4DFF;     /* 포커스 보더 */
```

---

## 3. Lv.2 타이포그래피 — Typography Scale

### 3-1. 모듈러 스케일 (수학적 비율)

글자 크기를 "감"이 아닌 **수학적 비율**로 결정하는 것이 프로의 방법.

| 비율 | 이름 | 성격 | 적합한 곳 |
|------|------|------|----------|
| 1.125 | Major Second | 미세한 차이 | 데이터 테이블, 대시보드 |
| **1.200** | **Minor Third** | **균형잡힌** | **범용 웹사이트 (추천)** |
| 1.250 | Major Third | 뚜렷한 차이 | 블로그, 뉴스 |
| 1.333 | Perfect Fourth | 강한 대비 | 마케팅, 랜딩페이지 |
| 1.618 | Golden Ratio | 자연스러운 | 아트 디렉션 |

### 3-2. 추천 타이포 스케일 (base: 16px, ratio: 1.200)

```
레벨          계산              크기      용도
──────────────────────────────────────────────────
Display    16 × 1.2^6      ≈ 48px    히어로 타이틀
H1         16 × 1.2^5      ≈ 40px    페이지 타이틀
H2         16 × 1.2^4      ≈ 33px    주요 섹션
H3         16 × 1.2^3      ≈ 28px    서브 섹션
H4         16 × 1.2^2      ≈ 23px    카드 타이틀
H5         16 × 1.2^1      ≈ 19px    리드 텍스트
Body       16 × 1.2^0      = 16px    본문
Caption    16 / 1.2         ≈ 13px    캡션, 메타
Small      16 / 1.2^2       ≈ 11px    각주
```

### 3-3. line-height 법칙

| 요소 | line-height | 이유 |
|------|-------------|------|
| Display/H1 | **1.1** | 큰 글자는 촘촘하게 |
| H2, H3 | **1.2** | 약간의 여유 |
| H4, H5 | **1.3** | 중간 크기 전환부 |
| Body (영문) | **1.5** | WCAG 최소 기준 |
| **Body (한글)** | **1.6 ~ 1.7** | **한글은 획이 복잡해서 더 넓게** |
| Caption | **1.4** | 작은 글씨 가독성 |

**한글 핵심:** W3C klreq(한국어 레이아웃 요구사항)에서 line-height 160% 권장

### 3-4. letter-spacing 규칙

| 상황 | 설정 | 이유 |
|------|------|------|
| 본문 텍스트 | 기본값 유지 | 폰트가 이미 최적화됨 |
| 큰 제목 (소문자) | `-0.01em` ~ `-0.02em` | 약간 조여서 밀도감 |
| **대문자 텍스트 (ALL CAPS)** | **+0.05em ~ +0.12em** | **반드시 벌려야 함** |
| 작은 텍스트 (13px 미만) | `+0.01em` | 가독성 확보 |

### 3-5. 폰트 페어링

**원칙:**
1. **2~3개 폰트 제한** — 그 이상은 산만
2. **각 폰트에 역할 부여** — 제목용 / 본문용 / 강조용
3. **대비를 만들되 충돌은 피하라** — 비슷한 폰트 2개는 실수처럼 보임

**꿈꾸는정비사 추천 스택:**
```css
/* 제목 + 본문: Pretendard 하나로 통일 (weight로 차별화) */
--font-heading: 'Pretendard', system-ui, sans-serif;  /* weight: 700-900 */
--font-body:    'Pretendard', system-ui, sans-serif;  /* weight: 400-500 */

/* 또는 제목만 다른 폰트 사용 */
--font-heading: 'Noto Sans KR', sans-serif;   /* 700 */
--font-body:    'Pretendard', sans-serif;      /* 400 */
```

### 3-6. 추천 타이포 CSS 변수

```css
/* ── Typography Scale (Minor Third 1.200) ── */
--text-display:    3rem;       /* 48px - 히어로 */
--text-h1:         2.5rem;     /* 40px - 페이지 타이틀 */
--text-h2:         2.074rem;   /* 33px - 섹션 */
--text-h3:         1.728rem;   /* 28px - 서브섹션 */
--text-h4:         1.44rem;    /* 23px - 카드 타이틀 */
--text-h5:         1.2rem;     /* 19px - 리드 */
--text-body:       1rem;       /* 16px - 본문 */
--text-caption:    0.833rem;   /* 13px - 캡션 */
--text-small:      0.694rem;   /* 11px - 각주 */

/* Line Heights */
--leading-display:  1.1;
--leading-heading:  1.2;
--leading-subhead:  1.3;
--leading-body:     1.6;    /* 한글 기준 */
--leading-caption:  1.4;

/* Font Weights */
--weight-regular:   400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;
--weight-black:     900;
```

---

## 4. Lv.3 비율과 여백 — Spacing & Layout

### 4-1. 8px 그리드 시스템

Apple, Google Material Design이 사용하는 표준. 모든 간격을 8의 배수로.

```
토큰     값      용도
──────────────────────────────────────────
space-1   4px    아이콘 간격, 미세 조정
space-2   8px    인라인 요소 간격
space-3  12px    폼 필드 내부 패딩
space-4  16px    기본 컴포넌트 패딩
space-5  24px    카드 패딩, 거터
space-6  32px    섹션 간격
space-7  48px    큰 섹션 구분
space-8  64px    메이저 섹션 브레이크
space-9  96px    히어로 수직 패딩
```

**현재 문제:** `p-3(12px)` → `p-6(24px)` 로 2배 점프. 중간 단계 필요.

**수정 예시:**
```
Before: p-3 md:p-6            (12px → 24px, 2배 점프)
After:  p-3 sm:p-4 md:p-5 lg:p-6  (12 → 16 → 20 → 24, 점진적)
```

### 4-2. 콘텐츠 너비 제한

| 컨텍스트 | max-width | 이유 |
|---------|-----------|------|
| 본문 텍스트 | **600~720px** | 한 줄 60~80자 최적 |
| 콘텐츠 영역 | **960~1200px** | 표준 레이아웃 |
| 넓은 컨테이너 | **1280~1440px** | 사이드바 포함 |
| 페이지 최대 | **1920px** | 울트라와이드 대응 |

**최적 줄 길이:** 한 줄에 60~80자. 타이포그래피에서 가장 오래된 법칙 중 하나.

### 4-3. 카드 이미지 비율

| 비율 | 용도 |
|------|------|
| **16:9** | 동영상 썸네일, 미디어 카드 |
| **4:3** | 상품 카드, 전통적 레이아웃 |
| **3:2** | 사진, 매거진 스타일 |
| **1:1** | 프로필, 소셜 미디어 |
| **2:3** | 인물 사진, 영화 포스터 |

**꿈꾸는정비사 추천:**
- 정비소 메인 이미지: **16:9** (넓은 외관 사진)
- 정비소 카드: **4:3** (목록에서 균형잡힌 비율)
- CSS: `aspect-ratio: 16 / 9;` + `object-fit: cover;`

### 4-4. 여백 (White Space) 활용법

```
┌─────────────────────────────────────────┐
│          ← 매크로 여백 →                 │
│    (섹션 간 큰 간격: 48~96px)            │
│                                         │
│    ┌────────────────────────────┐        │
│    │    마이크로 여백              │        │
│    │    (요소 내부 간격: 4~16px)   │        │
│    │                            │        │
│    │    제목                     │        │
│    │    ↕ 8px                   │        │
│    │    부제목                   │        │
│    │    ↕ 16px                  │        │
│    │    본문 텍스트              │        │
│    └────────────────────────────┘        │
│                                         │
│          ↕ 48px (섹션 구분)              │
│                                         │
│    ┌────────────────────────────┐        │
│    │    다음 섹션                │        │
│    └────────────────────────────┘        │
└─────────────────────────────────────────┘
```

**핵심 법칙: 내부 ≤ 외부**
- 요소 안쪽 패딩 < 요소 바깥 마진
- 관련 있는 것은 가깝게, 관련 없는 것은 멀리 → Gestalt 근접성 원칙

### 4-5. 황금비 (1.618) 레이아웃

```
전체 너비 1200px
├── 콘텐츠 영역: 741px (1200 / 1.618)
└── 사이드바:    459px (나머지)

비율: 741 : 459 ≈ 1.614 ≈ φ
```

활용 예시:
- 타이포: `본문 16px × 1.618 ≈ 26px 제목`
- 패딩: `요소 높이 56px / 1.618 ≈ 35px → 상하 17px 패딩`
- 영상 비율: 16:9도 사실상 황금비에 가까움 (1.778)

---

## 5. Lv.4 시각적 위계 — Visual Hierarchy

### 5-1. 시선 패턴

**F-패턴 (텍스트 중심 페이지)**
```
━━━━━━━━━━━━━━━━━━━━━━  ← 1차 수평 스캔 (상단)
━━━━━━━━━━━━              ← 2차 수평 스캔 (짧게)
┃                         ← 수직 스캔 (좌측)
┃
┃
```
적합: 목록, 검색 결과, 블로그

**Z-패턴 (미니멀 랜딩)**
```
1 ━━━━━━━━━━━━━━━ 2
          ╲
           ╲
            ╲
3 ━━━━━━━━━━━━━━━ 4
```
적합: 랜딩페이지, 홈페이지

**꿈꾸는정비사:** 홈페이지는 Z-패턴 → 정비소 목록은 F-패턴

### 5-2. 크기 대비로 중요도 표현

```
나쁜 예:                    좋은 예:
──────────                 ──────────
제목 (20px)               제목 (40px)        ← 확실한 차이
본문 (18px)  ← 거의 차이 없음  본문 (16px)
캡션 (16px)               캡션 (13px)

비율: 1.1:1               비율: 2.5:1        ← 명확한 위계
```

**법칙:** 제목과 본문의 크기 비율이 최소 **1.5:1** 이상이어야 위계가 보인다.

### 5-3. 색상 무게감

```
시선을 끄는 순서 (높음 → 낮음):
──────────────────────────────
1. 채도 높은 따뜻한 색 (빨강, 주황)   ← 전진
2. 채도 높은 차가운 색 (파랑, 초록)   ← 중립
3. 채도 낮은 색 (파스텔)              ← 후퇴
4. 무채색 (회색)                      ← 배경화
5. 흰색                               ← 보이지 않음
```

**CTA 버튼 주변에 넉넉한 여백 → 클릭률 ~25% 증가** (측정된 수치)

### 5-4. Gestalt 원칙 적용

| 원칙 | 설명 | 웹 적용 |
|------|------|--------|
| **근접성** | 가까운 것은 한 그룹 | 관련 필드 모으기, 섹션 간격 벌리기 |
| **유사성** | 비슷한 것은 관련됨 | 버튼 스타일 통일, 카드 디자인 통일 |
| **연속성** | 시선은 매끄러운 선을 따름 | 그리드 정렬 일관성 유지 |
| **폐합** | 뇌가 빈 부분을 채움 | 미니멀 아이콘, 로고 |
| **전경/배경** | 전경과 배경 분리 | 모달 오버레이, 카드 그림자 |
| **공통 영역** | 같은 영역 안 = 같은 그룹 | 카드, 배경색 영역 |

---

## 6. Lv.5 미디어급 연출 — Cinematic Design

### 6-1. 스트리밍 서비스 UI 패턴 (Netflix, Disney+, Apple TV+)

**공통 패턴:**
- 상단: 대형 히어로 배너 (자동 재생 프리뷰)
- 중단: 수평 캐러셀 ("선반") — 카테고리별 정리
- 배경: 어두운 색 → 콘텐츠 이미지가 돋보임
- 텍스트 최소화 — 이미지가 네비게이션 역할

**Netflix 디자인 시스템:**
```
색상: 블랙 + 레드(#E50914) + 화이트
      레드는 전체의 5% 미만 (로고, CTA만)
      나머지 95%는 블랙+그레이+화이트

타일: 호버 시 확대 + 자동 프리뷰
레이아웃: 수평 스크롤 캐러셀
폰트: 자체 폰트 Netflix Sans
```

**핵심 교훈:** 프로 서비스는 브랜드 컬러를 **극소량**만 사용한다.

### 6-2. 영화 포스터 구도 법칙

**3분할 법칙 (Rule of Thirds)**
```
┌──────┬──────┬──────┐
│      │      │      │
│      │  ●   │      │  ← 교차점에 핵심 요소 배치
├──────┼──────┼──────┤
│      │      │      │
│      │      │      │
├──────┼──────┼──────┤
│      │      │      │
│      │      │      │
└──────┴──────┴──────┘
```

**포스터 타이포그래피:**
- 타이틀: 가장 큰 텍스트 (앵커 역할)
- 태그라인: 감정적 맥락 전달
- 크레딧: 하단에 극도로 축소된 폰트
- 폰트 선택이 장르를 암시 (우아한 필기체 = 로맨스, 굵은 각진 서체 = 액션)

### 6-3. 매거진 레이아웃 → 웹 전환

| 매거진 원칙 | 웹 적용 |
|------------|--------|
| 그리드 파괴로 임팩트 | 풀블리드 이미지, 비대칭 레이아웃 |
| 콘텐츠 청킹 | 짧은 문단 + 이미지 + 인용구 |
| 점진적 위계 | 스크롤 시 시각적 무게 감소 → 주기적 리셋 |
| 일관된 구조 | 모든 페이지에 같은 그리드+타이포 |

---

## 7. 실전 치트시트

### 디자인 퀵 체크리스트

```
□ 색상이 3가지 이하인가? (브랜드 + 강조 + 중립)
□ 60-30-10 비율을 따르는가?
□ 모든 색상이 CSS 변수로 관리되는가?
□ 텍스트 대비율이 AA(4.5:1) 이상인가?
□ 폰트 사이즈가 모듈러 스케일을 따르는가?
□ 한글 line-height가 1.6 이상인가?
□ 간격이 8px 배수인가?
□ 카드 이미지 비율이 통일되어 있는가?
□ 제목과 본문의 크기 비율이 1.5:1 이상인가?
□ CTA 버튼 주변에 충분한 여백이 있는가?
□ 모바일→데스크탑 전환이 점진적인가?
□ 그림자 체계가 정의되어 있는가?
```

### 그림자 (Shadow) 체계

```css
/* ── Shadow Scale ── */
--shadow-xs:   0 1px 2px rgba(0,0,0,0.05);
--shadow-sm:   0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--shadow-md:   0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg:   0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl:   0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);

/* 용도 */
/* xs: 인풋 필드, 작은 요소 */
/* sm: 카드 기본 상태 */
/* md: 카드 호버 */
/* lg: 드롭다운, 모달 */
/* xl: 플로팅 요소, 팝업 */
```

### 반응형 브레이크포인트 전략

```
Mobile First 접근:

sm:   640px   (큰 모바일, 소형 태블릿)
md:   768px   (태블릿)
lg:  1024px   (작은 데스크탑)
xl:  1280px   (데스크탑)
2xl: 1536px   (큰 데스크탑)

간격 전환 예시:
패딩:  p-4 → sm:p-5 → md:p-6 → lg:p-8
간격:  gap-3 → sm:gap-4 → md:gap-6
폰트:  text-sm → sm:text-base → md:text-lg
```

### 트랜지션 체계

```css
/* ── Transition Tokens ── */
--duration-fast:    150ms;   /* 호버, 포커스 */
--duration-normal:  200ms;   /* 일반 전환 */
--duration-slow:    300ms;   /* 확장, 슬라이드 */
--duration-slower:  500ms;   /* 페이지 전환 */

--ease-default:     cubic-bezier(0.4, 0, 0.2, 1);   /* 일반 */
--ease-in:          cubic-bezier(0.4, 0, 1, 1);      /* 진입 */
--ease-out:         cubic-bezier(0, 0, 0.2, 1);      /* 퇴장 */
--ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1); /* 바운스 */
```

---

## 8. 프로젝트 적용 계획

### Phase 1: 디자인 토큰 통합 (기반 작업)

| 작업 | 파일 | 내용 |
|------|------|------|
| 컬러 통합 | `globals.css` | 3개 퍼플 → 1개 브랜드 컬러 시스템으로 통합 |
| 하드코딩 제거 | 모든 컴포넌트 | `text-[#7C4DFF]` → `text-brand-500` |
| 타이포 토큰 | `globals.css` | 모듈러 스케일 CSS 변수 추가 |
| 간격 토큰 | `globals.css` | 8px 그리드 기반 간격 변수 |

### Phase 2: 컴포넌트 개선

| 작업 | 대상 | 내용 |
|------|------|------|
| 카드 비율 통일 | `MechanicCard.tsx` | `aspect-ratio: 4/3` 적용 |
| 반응형 점진화 | 전체 | `p-3 md:p-6` → `p-3 sm:p-4 md:p-5 lg:p-6` |
| 타이포 위계 | 전체 | 모듈러 스케일 적용 |
| 그림자 체계 | 전체 | shadow 토큰 적용 |

### Phase 3: 프로 터치

| 작업 | 대상 | 내용 |
|------|------|------|
| 60-30-10 적용 | 전체 레이아웃 | 배경 화이트 60%, 퍼플 30%, 앰버 10% |
| 여백 최적화 | 섹션 간격 | 매크로/마이크로 여백 체계화 |
| 한글 line-height | 본문 텍스트 | 1.6~1.7 적용 |
| 트랜지션 통일 | 인터랙션 | duration/easing 토큰 적용 |

---

## 참고 자료

### 색감
- [60-30-10 Rule — WP Mayor](https://wpmayor.com/the-60-30-10-rule-made-our-website-designs-infinitely-better/)
- [Color Theory — Elementor](https://elementor.com/blog/color-theory-web-design/)
- [Color Psychology — Flux Academy](https://www.flux-academy.com/blog/the-psychology-of-color-how-valuable-web-designers-choose-colors)
- [Movie Poster Color Schemes — No Film School](https://nofilmschool.com/Movie-Poster-Color-Schemes)

### 타이포그래피
- [Modular Type Scale — Prototypr](https://blog.prototypr.io/defining-a-modular-type-scale-for-web-ui-51acd5df31aa)
- [Type Scale Calculator](https://type-scale.com)
- [W3C Korean Layout Requirements](https://w3c.github.io/klreq/)
- [Pretendard GitHub](https://github.com/orioncactus/pretendard)

### 레이아웃
- [8-Point Grid System — Medium](https://medium.com/built-to-adapt/intro-to-the-8-point-grid-system-d2573cde8632)
- [Spacing Best Practices — Cieden](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)
- [Golden Ratio in UI — NN/g](https://www.nngroup.com/articles/golden-ratio-ui-design/)

### 시각적 위계
- [Visual Hierarchy — IxDF](https://www.interaction-design.org/literature/article/visual-hierarchy-organizing-content-to-follow-natural-eye-movement-patterns)
- [Gestalt Principles — Damteq](https://www.damteq.co.uk/articles/what-are-gestalt-principles-and-how-do-they-influence-ux/)
- [F and Z Patterns — 99designs](https://99designs.com/blog/tips/visual-hierarchy-landing-page-designs/)

### 미디어/브랜딩
- [Netflix Design — CXL](https://cxl.com/blog/netflix-design/)
- [Streaming UI Wars — Wix](https://www.wix.com/studio/blog/streaming-wars-ui)
- [Movie Poster Design — Webflow](https://webflow.com/blog/movie-poster-design)
- [WCAG Contrast — WebAIM](https://webaim.org/articles/contrast/)
