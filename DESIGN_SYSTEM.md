# 디자인 시스템 — dreammechaniclab.com
> 이 섹션의 모든 규칙은 UI 컴포넌트를 만들거나 수정할 때 반드시 따른다.
> 디자인 판단이 필요할 때 이 문서가 기본 기준이다.
-----
## 1. 브랜드 아이덴티티
- 브랜드명: 꿈꾸는정비사 (전국 팔도 정비사)
- 포지셔닝: "검증된 정비소를 연결하는 신뢰 플랫폼"
- 톤: 전문적이되 따뜻함, 깔끔하되 차갑지 않음
- 키워드: 신뢰, 검증, 전문성, 접근성
-----
## 2. 컬러 시스템
### 브랜드 컬러 (CSS 변수명 필수 사용)
```css
:root {
  /* Primary — 보라 계열 (브랜드 메인) */
  --color-primary: #7C3AED;
  --color-primary-dark: #6D28D9;
  --color-primary-light: #A78BFA;
  --color-primary-50: #F5F3FF;    /* 배경 틴트 */
  --color-primary-100: #EDE9FE;   /* 호버 배경 */
  /* Accent — 레드 계열 (CTA, 유튜브, 강조) */
  --color-accent: #EF4444;
  --color-accent-dark: #DC2626;
  /* Neutral — 텍스트 & 배경 */
  --color-text-primary: #111827;    /* 제목, 본문 강조 */
  --color-text-secondary: #6B7280;  /* 설명, 부가 정보 */
  --color-text-tertiary: #9CA3AF;   /* 비활성, 힌트 */
  --color-bg-page: #F9FAFB;         /* 페이지 배경 */
  --color-bg-card: #FFFFFF;          /* 카드 배경 */
  --color-border: #E5E7EB;          /* 기본 테두리 */
  --color-border-light: #F3F4F6;    /* 연한 구분선 */
  /* Semantic — 상태 표시 */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```
### 컬러 사용 규칙
- Primary(보라)는 로고, 주요 버튼, 활성 탭, 선택 상태에만 사용
- Accent(레드)는 CTA 버튼, 유튜브 관련 요소, 긴급/강조에만 사용
- 본문 텍스트에 컬러 사용 금지 (--color-text-primary 또는 --color-text-secondary만 사용)
- 배경에 진한 컬러 직접 사용 금지 → 50/100 단계 틴트 사용
- 그라데이션은 버튼, 뱃지 등 소형 요소에만 허용. 큰 영역에 그라데이션 금지
-----
## 3. 타이포그래피
### 폰트
```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```
- 한글: Pretendard (필수 — CDN: https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css)
- 영문/숫자: Pretendard가 커버 (별도 영문 폰트 불필요)
- 시스템 기본 폰트(맑은고딕, 굴림 등) 절대 사용 금지
### 텍스트 크기 체계
| 용도 | 크기 | 굵기 | line-height |
|------|------|------|-------------|
| 페이지 타이틀 (H1) | 28px | 800 (ExtraBold) | 1.3 |
| 섹션 타이틀 (H2) | 22px | 700 (Bold) | 1.35 |
| 서브 타이틀 (H3) | 18px | 700 (Bold) | 1.4 |
| 카드 제목 | 15px | 600 (SemiBold) | 1.4 |
| 본문 | 14px | 400 (Regular) | 1.6 |
| 캡션/보조텍스트 | 12px | 400 (Regular) | 1.5 |
| 뱃지/태그 | 11px | 600 (SemiBold) | 1 |
### 타이포 규칙
- 제목에만 Bold 이상 사용. 본문에서 Bold 남용 금지
- 자간(letter-spacing): 한글은 0 ~ -0.01em, 영문 대문자 태그는 0.05em
- 줄간격(line-height): 본문 최소 1.5 이상
- 텍스트 길이: 카드 제목 최대 2줄, 설명 최대 3줄 → 넘으면 ellipsis 처리
-----
## 4. 간격 시스템 (8px 그리드)
모든 간격은 4px 또는 8px 배수로만 사용한다.
```
4px   — 아이콘과 텍스트 사이, 뱃지 내부 패딩
8px   — 관련 요소 간 간격 (같은 그룹 내)
12px  — 카드 내부 패딩
16px  — 섹션 내 요소 간 간격
24px  — 카드 간 간격 (그리드 gap)
32px  — 섹션 간 간격 (소)
48px  — 섹션 간 간격 (대)
64px  — 페이지 상하 여백
```
### 간격 규칙
- 5px, 7px, 10px, 15px 같은 비정규 값 사용 금지
- 패딩과 마진은 반드시 위 체계에서 선택
- 모바일에서 좌우 패딩 최소 16px 보장
-----
## 5. 카드 컴포넌트
카드는 이 플랫폼의 핵심 UI다. 모든 정비소 카드는 아래 규격을 따른다.
### 기본 카드 스타일
```css
.shop-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  border: 1px solid var(--color-border-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.shop-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```
### 카드 내부 구조
```
+---------------------------+
|  썸네일 (16:9 비율)        | <- 뱃지는 여기 위에 absolute
|  aspect-ratio: 16/9       |
|  object-fit: cover         |
+---------------------------+
|  [12px padding]            |
|  매장명 (15px, 600)        |
|  [4px gap]                 |
|  지역 (12px, #6B7280)      |
|  [8px gap]                 |
|  전화번호 (12px, 보라)      |
|  [12px padding]            |
+---------------------------+
```
### 유튜브 영상 뱃지 (확정)
```css
.video-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11.5px;
  font-weight: 600;
}
.video-badge__icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #FF0000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```
- 뱃지 텍스트: "영상보기"
- 아이콘: 빨간 원(#FF0000) 안에 흰색 재생 삼각형
- 이전의 빨간 직사각형 뱃지 스타일 사용 금지
### 카드 그리드
```css
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
@media (max-width: 640px) {
  .shop-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
```
-----
## 6. 버튼 시스템
### Primary 버튼 (주요 CTA)
```css
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
}
.btn-primary:active {
  transform: scale(0.98);
}
```
### Secondary 버튼 (보조)
```css
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  border-radius: 10px;
  padding: 11px 24px;
  font-size: 14px;
  font-weight: 600;
}
```
### 버튼 규칙
- border-radius: 항상 10px (둥글되 완전 pill 형태 아님)
- 최소 높이: 44px (모바일 터치 영역 보장)
- 최소 좌우 패딩: 24px
- disabled 상태: opacity 0.5, cursor not-allowed
- 그림자 버튼 금지 (box-shadow로 버튼 강조하지 않음)
-----
## 7. 아이콘 & 이미지
### 아이콘
- 라이브러리: Lucide Icons 사용 (https://lucide.dev)
- 기본 크기: 16px (텍스트 옆), 20px (버튼 내), 24px (독립)
- 색상: 텍스트 색상과 동일하게 맞춤 (currentColor)
- 아이콘 + 텍스트 간격: 4~6px
### 썸네일 이미지
- 비율: 16:9 고정 (aspect-ratio: 16/9)
- object-fit: cover (찌그러짐 방지)
- 로딩: lazy loading 적용
- fallback: 회색 배경(#E5E7EB) + 카메라 아이콘
-----
## 8. 반응형 브레이크포인트
```css
/* Mobile first 접근 */
/* sm */  @media (min-width: 640px)  { ... }
/* md */  @media (min-width: 768px)  { ... }
/* lg */  @media (min-width: 1024px) { ... }
/* xl */  @media (min-width: 1280px) { ... }
```
### 컨테이너
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
@media (min-width: 768px) {
  .container { padding: 0 24px; }
}
```
### 반응형 규칙
- 모바일 최우선 설계 (mobile-first)
- 터치 타겟 최소 44x44px
- 모바일에서 좌우 패딩 16px 이하 금지
- 카드 그리드: 모바일 2열, 태블릿 3열, 데스크톱 4열
- 텍스트 크기: 모바일에서 H1은 24px로 축소 허용
-----
## 9. 모션 & 트랜지션
### 허용되는 트랜지션
```css
/* 기본 트랜지션 */
transition: all 0.2s ease;
/* 호버 효과 */
transition: box-shadow 0.2s ease, transform 0.2s ease;
/* 페이드인 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```
### 모션 규칙
- duration: 0.15s ~ 0.3s 범위만 사용 (0.5s 이상 금지)
- easing: ease 또는 ease-out만 사용
- hover에서 transform: translateY(-2px) 까지만 허용 (과도한 이동 금지)
- 로딩 스피너: 브랜드 보라색 사용
- 스크롤 애니메이션은 subtle하게 (fadeIn + 짧은 translateY만)
- 번쩍이는 효과, 바운스 효과, 회전 효과 금지
-----
## 10. 절대 금지 사항
아래 항목은 어떤 상황에서도 사용하지 않는다:
### 스타일 금지
- `border: 1px solid #ccc` (올드한 회색 테두리) → `var(--color-border)` 사용
- `box-shadow: 0 2px 4px rgba(0,0,0,0.3)` (과한 그림자) → 최대 0.1 투명도
- 시스템 기본 폰트 (맑은고딕, 굴림, sans-serif 단독)
- 그라데이션 배경 남용 (특히 보라→파랑 같은 AI슬롭 그라데이션)
- 지나치게 둥근 모서리 (border-radius: 20px 이상은 pill 버튼/뱃지만)
- 네온/글로우 효과 (text-shadow glow, box-shadow glow)
- 컬러풀한 테두리 (border에 밝은 색 직접 사용)
### 레이아웃 금지
- 중앙 정렬 텍스트 블록 (제목만 허용, 본문은 항상 좌측 정렬)
- 좌우 패딩 없는 모바일 레이아웃
- 44px 미만 터치 타겟
- 수평 스크롤 (캐러셀 제외)
### 컬러 금지
- 순수 검정(#000000) → #111827 사용
- 순수 흰색(#FFFFFF) 배경에 그림자 없이 카드 배치 → border-light 또는 약한 그림자 필수
- 브랜드 컬러 이외의 보라/파랑/초록 임의 사용
-----
## 11. 컴포넌트 빠른 참조
| 컴포넌트 | border-radius | 그림자 | 패딩 |
|---------|---------------|--------|------|
| 카드 | 12px | 0 1px 3px rgba(0,0,0,0.06) | 12px |
| 버튼 | 10px | 없음 | 12px 24px |
| 입력필드 | 10px | 없음 (focus: ring) | 12px 16px |
| 뱃지/태그 | 8px | 없음 | 4px 8px |
| 모달 | 16px | 0 8px 32px rgba(0,0,0,0.12) | 24px |
| 툴팁 | 8px | 0 4px 12px rgba(0,0,0,0.1) | 8px 12px |
| 네비게이션 | 0 | 0 1px 0 var(--color-border) | 16px 24px |
-----
## 12. 디자인 의사결정 원칙
새로운 UI를 만들 때 판단 기준:
1. **단순함 우선**: 장식보다 정보 전달이 먼저. 요소를 추가할 때마다 "이게 없으면 사용자가 불편한가?" 질문
2. **일관성**: 이 문서에 정의된 값만 사용. 임의의 색상/크기/간격 생성 금지
3. **모바일 우선**: 항상 모바일 화면부터 설계하고 확장
4. **신뢰감**: 40~60대 남성 사용자가 "제대로 된 사이트"라고 느낄 수 있는 안정감
5. **속도**: 무거운 애니메이션, 대형 이미지 배제. 성능이 디자인보다 우선
