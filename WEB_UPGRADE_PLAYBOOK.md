# 꿈꾸는정비사 — 웹사이트 업그레이드 플레이북

> Claude Code가 웹사이트 제작/업그레이드 시 참조하는 **실행 가이드**.
> 코드베이스 분석 + 기술 스택 조사 + 한국 시장 리서치 기반.

---

## 목차

1. [현재 상태 진단](#1-현재-상태-진단)
2. [우선순위 업그레이드 로드맵](#2-우선순위-업그레이드-로드맵)
3. [Next.js 16 활용법](#3-nextjs-16-활용법)
4. [React 19 새 기능 적용](#4-react-19-새-기능-적용)
5. [Tailwind CSS 4 고급 기능](#5-tailwind-css-4-고급-기능)
6. [Framer Motion 최적화](#6-framer-motion-최적화)
7. [한국 SEO 전략 (네이버 + 구글)](#7-한국-seo-전략)
8. [성능 최적화](#8-성능-최적화)
9. [전환율 최적화 (CRO)](#9-전환율-최적화)
10. [카카오 연동](#10-카카오-연동)

---

## 1. 현재 상태 진단

### 프로젝트 현황

```
총 코드량:        ~4,700 LOC (프론트 2,000 + 백엔드 2,700)
페이지 수:         27개 (공개 3 + 오너 5 + 어드민 12 + Sync 2 + 기타)
API 엔드포인트:    30+ 개
보안:             Phase 1 완료 (HttpOnly, CORS, Rate Limit, Bot Detection)
배포:             Docker Compose + AWS (EC2 서울, S3, 선택적 CloudFront)
```

### 기능 완성도

```
기능                    상태        비고
────────────────────────────────────────────
정비소 CRUD              ✅ 완료     드래그 정렬, 갤러리, 유튜브
지역 필터 (한국 지도)     ✅ 완료     SVG 인터랙티브 맵
정비소 상세 모달          ✅ 완료     영업상태, 전문분야, 지도, 리뷰
오너 인증 (카카오)        ✅ 완료     승인 워크플로우
어드민 대시보드           ✅ 완료     통계, TOP 5, 트래픽 차트
견적 요청               ✅ 완료     이미지 업로드, 상태 관리
리뷰 시스템              ✅ 완료     별점, 어드민 승인
분석/통계               ✅ 완료     클릭 추적, 페이지뷰, 월별 차트
문의 폼                 ✅ 완료     고객/정비사 탭
반응형 디자인            ✅ 완료     모바일 퍼스트
디자인 시스템            ✅ 완료     60-30-10, 모듈러 스케일, 토큰
```

### 주요 갭 (미구현)

```
영역                    갭                              임팩트
────────────────────────────────────────────────────────────────
SEO (치명적)           정비소 개별 상세 페이지 없음         네이버/구글 색인 불가
SEO                   LocalBusiness JSON-LD 없음         구조화 데이터 누락
SEO                   동적 사이트맵 없음 (3개만)          크롤링 커버리지 부족
SEO                   네이버 검색어드바이저 미등록          네이버 트래픽 0
검색                   키워드/전문분야 검색 없음            발견성 부족
알림                   알림톡(Solapi) 미구현              견적 알림 수동
성능                   이미지 압축/WebP 없음              로딩 느림
성능                   next/image 미사용 (img 태그)       최적화 누락
테스트                 테스트 코드 0%                     안정성 위험
모니터링               에러 트래킹 없음 (Sentry 등)        장애 감지 불가
CI/CD                 GitHub Actions 없음               수동 배포
```

---

## 2. 우선순위 업그레이드 로드맵

### Phase 9 — SEO 기반 (즉시)

```
번호  작업                                     파일/위치
─────────────────────────────────────────────────────────────
9-1   정비소 개별 상세 페이지 생성                app/mechanics/[id]/page.tsx
      → /mechanics/[id] 라우트
      → generateMetadata로 동적 메타 태그
      → LocalBusiness + AggregateRating JSON-LD

9-2   동적 사이트맵 생성                        app/sitemap.ts
      → 모든 정비소 URL 포함
      → lastmod, changefreq, priority

9-3   네이버 검색어드바이저 등록                  app/layout.tsx
      → naver-site-verification 실제 코드
      → 구글 서치 콘솔도 실제 코드

9-4   검색 기능 추가                            components/SearchBar.tsx
      → 키워드 검색 + 전문분야 필터
      → 모바일: 상단 검색바 + 필터 칩

9-5   next/image로 전환                        모든 img 태그
      → priority (히어로), sizes, placeholder="blur"
```

### Phase 10 — 알림 + 성능 (다음)

```
번호  작업                                     파일/위치
─────────────────────────────────────────────────────────────
10-1  알림톡(Solapi) 구현                       backend/notification
      → 견적 요청 시 정비소에 알림
      → 예약 확인 알림

10-2  이미지 최적화 파이프라인                    backend/upload
      → 업로드 시 서버사이드 WebP 변환
      → 썸네일 자동 생성 (400px, 800px)

10-3  Pretendard 로컬 폰트 전환                 app/layout.tsx
      → next/font/local 사용
      → CDN 외부 요청 제거

10-4  loading.tsx 스켈레톤 추가                  app/loading.tsx
      → 라우트별 로딩 UI
      → Suspense 경계 설정

10-5  에러 트래킹 (Sentry) 설정                 전체
```

### Phase 11 — 신뢰 + 전환율 (이후)

```
번호  작업                                     파일/위치
─────────────────────────────────────────────────────────────
11-1  카카오톡 채널 연동                         components/KakaoChat.tsx
      → 1:1 채팅, 알림톡
      → 카카오맵 연동

11-2  리뷰 강화                                components/ReviewSection.tsx
      → 사진 리뷰, 별점 집계 표시
      → AggregateRating 스키마

11-3  스티키 모바일 CTA 바                      components/StickyBottomCTA.tsx
      → "견적 받기" + "전화 문의" + "카카오 상담"

11-4  오너 성과 대시보드                         app/owner/analytics
      → 내 정비소 클릭수, 견적 수, 리뷰 수

11-5  GitHub Actions CI/CD                    .github/workflows/
      → 빌드 + 타입체크 + 린트 자동화
```

---

## 3. Next.js 16 활용법

### 3-1. "use cache" 캐싱 (next.config.ts에 활성화 필요)

```ts
// next.config.ts — 추가할 옵션
const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,     // ← "use cache" 활성화
  reactCompiler: true,       // ← React Compiler 활성화 (자동 메모이제이션)
  images: {
    qualities: [25, 50, 75, 100],
    remotePatterns: [/* 기존 S3, YouTube 패턴 */],
  },
};
```

```
캐싱 전략:
────────────────────────────────────────────
정비소 목록 페이지     "use cache" + cacheLife('hours')    1시간마다 갱신
정비소 상세 페이지     "use cache" + cacheLife('minutes')  5분마다 갱신
견적 요청/리뷰        캐싱 없음 (동적)                     항상 실시간
어드민 대시보드        캐싱 없음 (동적)                     항상 실시간
```

### 3-2. 서버 vs 클라이언트 컴포넌트 결정표

```
컴포넌트                서버/클라이언트    이유
────────────────────────────────────────────────
정비소 목록 (데이터)     Server           API 호출, 인터랙션 없음
정비소 카드 (표시)       Server           순수 표시, 훅 불필요
정비소 모달 (인터랙션)   Client           상태, 애니메이션, 이벤트
히어로 섹션             Client           Framer Motion, 비디오
KoreaMap               Client           SVG 인터랙션, 상태
NaverMapView           Client           브라우저 API
QuoteRequestForm       Client           폼 상태
ReviewList (표시)       Server           순수 데이터 표시
JsonLd                 Server           정적 스크립트
PageViewTracker        Client           브라우저 API
검색/필터 바            Client           사용자 입력, 상태
```

### 3-3. 정비소 상세 페이지 구현 패턴

```tsx
// app/mechanics/[id]/page.tsx
import type { Metadata } from 'next';

// Next.js 16: params는 Promise
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const mechanic = await fetchMechanic(id);

  return {
    title: `${mechanic.name} - ${mechanic.location} 정비소`,
    description: `${mechanic.location} ${mechanic.specialties.join(', ')} 전문. ${mechanic.description?.slice(0, 80)}`,
    openGraph: {
      images: [{ url: mechanic.mainImageUrl, width: 1200, height: 630 }],
    },
  };
}

export default async function MechanicDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mechanic = await fetchMechanic(id);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        name: mechanic.name,
        telephone: mechanic.phone,
        address: { '@type': 'PostalAddress', streetAddress: mechanic.address, addressCountry: 'KR' },
        geo: { '@type': 'GeoCoordinates', latitude: mechanic.mapLat, longitude: mechanic.mapLng },
        // aggregateRating, openingHoursSpecification 등
      }} />
      <MechanicDetail mechanic={mechanic} />
    </>
  );
}
```

### 3-4. 동적 사이트맵

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mechanics = await fetchAllMechanics();

  const mechanicUrls = mechanics.map((m) => ({
    url: `https://dreammechaniclab.com/mechanics/${m.id}`,
    lastModified: m.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: 'https://dreammechaniclab.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://dreammechaniclab.com/for-mechanics', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://dreammechaniclab.com/inquiry', changeFrequency: 'monthly', priority: 0.5 },
    ...mechanicUrls,
  ];
}
```

---

## 4. React 19 새 기능 적용

### 4-1. useActionState — 폼 처리

```
적용 대상:
  견적 요청 폼 (QuoteRequestForm)   → 서버 액션 + 로딩 상태
  문의 폼 (InquiryForm)             → 서버 액션 + 성공/에러 상태
  리뷰 작성 폼                      → 서버 액션 + 낙관적 업데이트
```

```tsx
const [state, formAction, isPending] = useActionState(submitAction, null);

// isPending → 버튼 "처리 중..." 표시, 중복 전송 방지
// state.success → 성공 메시지 표시
// state.error → 에러 메시지 표시
```

### 4-2. useOptimistic — 즉각 피드백

```
적용 대상:
  리뷰 작성     → 제출 즉시 리스트에 추가 (opacity-60으로 표시)
  즐겨찾기      → 탭 즉시 하트 토글 (서버 응답 대기 안함)
```

### 4-3. useFormStatus — 재사용 서밋 버튼

```tsx
// 모든 폼에서 재사용
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="bg-brand-500 ...">
      {pending ? '처리 중...' : children}
    </button>
  );
}
```

---

## 5. Tailwind CSS 4 고급 기능

### 5-1. 컨테이너 쿼리 (플러그인 없이 내장)

```tsx
// 카드가 컨테이너 크기에 따라 레이아웃 변경
<div className="@container">
  <div className="@sm:flex @sm:gap-4">
    <img className="@sm:w-1/3 aspect-[4/3] object-cover" />
    <div className="@sm:w-2/3">{/* 정보 */}</div>
  </div>
</div>
```

### 5-2. 유용한 새 유틸리티

```
not-*        → 호버 안된 형제 요소 스타일: not-hover:opacity-50
inert        → 비활성 요소: inert:opacity-40 inert:cursor-not-allowed
@starting-style → CSS-only 진입 애니메이션 (JS 없이)
```

---

## 6. Framer Motion 최적화

### 6-1. 스크롤 트리거 + 스태거

```tsx
// 카드 그리드에 적용: 순차적 등장
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-50px' }}
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  }}
>
  {mechanics.map(m => (
    <motion.div
      key={m.id}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
    >
      <MechanicCard mechanic={m} />
    </motion.div>
  ))}
</motion.div>
```

### 6-2. 레이아웃 애니메이션 (필터 변경 시)

```tsx
// 지역 필터 변경 → 카드 위치가 부드럽게 전환
<motion.div key={m.id} layout>
  <MechanicCard mechanic={m} />
</motion.div>
```

### 6-3. 성능 규칙

```
✓ transform + opacity만 애니메이션 (width, height, top, left 금지)
✓ duration은 프로젝트 토큰 사용:
  호버: 150ms (--duration-fast)
  전환: 200ms (--duration-normal)
  확장: 300ms (--duration-slow)
  스태거: 40~80ms
✓ prefers-reduced-motion 존중:
  useReducedMotion() → true면 애니메이션 비활성화
```

---

## 7. 한국 SEO 전략

### 7-1. 네이버 vs 구글 차이점

```
항목              네이버                          구글
─────────────────────────────────────────────────────────────
점유율            ~46.5%                         ~46%
봇 이름           Yeti                           Googlebot
JS 렌더링          ✗ 취약 (SSR 필수)               ✓ 양호
meta keywords     ✓ 참고함                        ✗ 무시
canonical 태그     ✗ 미지원                        ✓ 지원
백링크 가중치       낮음 (네이버 생태계 중요)          핵심 랭킹 요소
콘텐츠 신선도       매우 중요                        중요하지만 덜 지배적
색인 속도          수동 제출, 수일 소요               자동, 빠름
```

### 7-2. 필수 SEO 작업

```
작업                                    우선도    상태
──────────────────────────────────────────────────────
네이버 검색어드바이저 등록 + 인증           CRITICAL  미완
구글 서치 콘솔 등록 + 인증                CRITICAL  미완
정비소 개별 페이지 (/mechanics/[id])       CRITICAL  미완
동적 사이트맵 (sitemap.ts)               CRITICAL  미완
AutoRepair JSON-LD 스키마                HIGH      미완
BreadcrumbList 스키마                    HIGH      미완
AggregateRating 스키마 (리뷰)             HIGH      미완
FAQPage 스키마                          MEDIUM    미완
네이버 스마트플레이스 등록 (각 정비소)       HIGH      미완
네이버 공식 블로그 개설                    MEDIUM    미완
```

### 7-3. 한국 메타 태그 규칙

```
항목              네이버 규칙                       구글 규칙
─────────────────────────────────────────────────────────────
title            최대 40자 (한글)                   최대 60자
description      최대 80자                         최대 120자
keywords         5~10개 (네이버가 참고함)            무시됨 (넣어도 해 없음)
og:locale        ko_KR (카카오톡 공유 필수)          ko_KR
og:image         1200×630px (카카오톡 미리보기)       1200×630px
```

### 7-4. LocalBusiness JSON-LD 템플릿

```json
{
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  "name": "정비소 이름",
  "description": "전문분야 설명",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "도로명 주소",
    "addressLocality": "시/군/구",
    "addressRegion": "시/도",
    "addressCountry": "KR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "37.xxxx",
    "longitude": "127.xxxx"
  },
  "telephone": "+82-xxx-xxxx-xxxx",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "image": "메인 이미지 URL",
  "url": "정비소 상세 페이지 URL",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "128"
  }
}
```

---

## 8. 성능 최적화

### 8-1. Core Web Vitals 목표

```
지표      좋음         보통           나쁨
──────────────────────────────────────────
LCP      < 2.5초      2.5~4.0초      > 4.0초
INP      < 200ms      200~500ms      > 500ms
CLS      < 0.1        0.1~0.25       > 0.25
```

### 8-2. next/image 전환 패턴

```tsx
// 히어로 (LCP) — lazy loading 끄고 priority 설정
<Image
  src={mechanic.mainImageUrl}
  alt={`${mechanic.name} 정비소`}
  width={1200}
  height={675}
  priority
  className="aspect-[16/9] object-cover rounded-2xl"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
/>

// 카드 썸네일 — lazy loaded (기본)
<Image
  src={mechanic.mainImageUrl}
  alt={`${mechanic.name} 정비소`}
  width={400}
  height={300}
  className="aspect-[4/3] object-cover"
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
/>
```

### 8-3. Pretendard 로컬 폰트 전환

```tsx
// app/layout.tsx — CDN 제거하고 로컬 폰트 사용
import localFont from 'next/font/local';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

// <html lang="ko" className={pretendard.variable}>
```

```
효과:
  ✓ 외부 네트워크 요청 제거 (CDN → 로컬)
  ✓ FOIT(보이지 않는 텍스트) 방지 (display: swap)
  ✓ CLS 자동 보정 (next/font의 size-adjust)
  ✓ 가변 폰트 1개 파일로 모든 weight 커버
```

### 8-4. 이미지 최적화 파이프라인

```
현재:  원본 그대로 S3 업로드 → 모바일에서 느림
목표:  업로드 시 서버사이드 처리

처리 파이프라인:
  원본 → sharp 라이브러리 →
    ├─ 썸네일 (400px, WebP, quality 75) → 카드용
    ├─ 중간 (800px, WebP, quality 80)   → 상세 페이지용
    └─ 원본 (압축, WebP, quality 85)     → 갤러리용
```

---

## 9. 전환율 최적화

### 9-1. 한국 시장 CTA 규칙

```
위치                  CTA                     스타일
─────────────────────────────────────────────────────────
카드 호버/탭           자세히 보기 →            text-brand-500
모달 하단 (현재)        전화 문의 / 견적 요청     brand-500 / accent-500
정비소 상세 페이지      스티키 하단 바            모바일: fixed bottom

스티키 하단 CTA 바 구성:
┌─────────────────────────────────────────────────┐
│  📞 전화 문의      📝 견적 받기     💬 카카오 상담  │
│  (outlined)       (brand-500)     (kakao yellow)  │
└─────────────────────────────────────────────────┘

규칙:
  ✓ CTA 문구는 2~5글자: "견적 받기", "지금 예약", "전화 문의"
  ✓ CTA 주변 여백 충분히 (클릭률 ~25% 증가)
  ✓ 한 화면에 프라이머리 CTA 1개만
  ✓ "지금", "오늘" 같은 긴급성 단어 사용
```

### 9-2. 신뢰 요소 (한국 시장)

```
요소                    효과                     구현 우선도
─────────────────────────────────────────────────────────────
별점 + 리뷰 수          97% 사용자가 확인          HIGH
사진 리뷰 (수리 전/후)   가장 설득력 높음            HIGH
인증 뱃지               "검증된 정비소" 마크         HIGH (이미 isVerified 존재)
실시간 활동              "N명이 보는 중"            MEDIUM
최근 예약 수             "이번 달 N건 예약"         MEDIUM
응답 시간               "평균 15분 응답"           MEDIUM
정부 인증               자동차관리사업 등록          LOW (데이터 필요)
```

### 9-3. 전화 vs 온라인 예약 전략

```
한국 시장 현황 (2025~2026):
  ✓ 온라인/앱 예약으로 전환 중 (현대, 기아, 쉐보레 모두 온라인 예약 제공)
  ✓ 젊은 층은 전화 회피 경향 강함
  ✓ 복잡한 수리는 여전히 전화 선호

권장 접근:
  1순위: 온라인 견적 요청 (기본)
  2순위: 카카오톡 채팅 (중간 지점)
  3순위: 전화 문의 (항상 노출)
  → 세 가지 모두 항상 제공. 온라인을 기본으로 밀되, 전화 옵션 숨기지 않기
```

---

## 10. 카카오 연동

### 10-1. 연동 우선순위

```
기능                    효과              난이도    우선도
─────────────────────────────────────────────────────────
알림톡 (AlimTalk)        견적 도착 알림     중간     HIGH
카카오톡 채널 1:1 채팅    실시간 상담        낮음     HIGH
카카오맵 연동             정비소 찾기        낮음     MEDIUM
카카오 공유하기           바이럴            낮음     MEDIUM
카카오페이               결제 (미래)        높음     LOW
```

### 10-2. 알림톡 발송 시점

```
이벤트                  발송 대상          내용
─────────────────────────────────────────────────────────
견적 요청 접수           정비소 오너         "새 견적 요청이 도착했습니다"
견적 답변 완료           고객              "정비소에서 견적을 보내왔습니다"
예약 확인               고객 + 정비소       "예약이 확인되었습니다"
예약 리마인더            고객              "내일 예약이 있습니다" (D-1)
정비 완료               고객              "정비가 완료되었습니다. 리뷰를 남겨주세요"
```

---

## 부록: 빠른 참조

### 현재 기술 스택 버전

```
Next.js:        16.1.x
React:          19.2.x
Tailwind CSS:   4.x
Framer Motion:  12.26.x (Motion)
NestJS:         11.x
Prisma:         최신
PostgreSQL:     15
Node.js:        20.9+ 필수
```

### 핵심 파일 위치

```
프론트엔드:
  app/globals.css              → 디자인 토큰 (CSS 변수)
  app/layout.tsx               → 루트 레이아웃, SEO 메타
  app/page.tsx                 → 홈페이지
  components/Layout.tsx        → 네비 + 푸터
  components/MechanicCard.tsx  → 정비소 카드
  components/MechanicModal.tsx → 정비소 상세 모달
  components/KoreaMap.tsx      → 지역 필터 맵
  components/HeroSection.tsx   → 히어로 섹션
  lib/api.ts                   → API 클라이언트
  lib/store.ts                 → Zustand 스토어

백엔드:
  src/mechanic/               → 정비소 CRUD
  src/auth/                   → 인증 (어드민 + 카카오)
  src/owner/                  → 오너 관리
  src/analytics/              → 통계
  src/notification/           → 알림 (Solapi)
  prisma/schema.prisma        → DB 스키마
```

### 자주 쓰는 명령어

```bash
# 개발 서버
cd frontend && npm run dev

# 타입 체크
npx tsc --noEmit

# 프로덕션 빌드
npm run build

# Docker 배포
docker compose -f docker-compose.yml up -d --build

# Prisma 마이그레이션
cd backend && npx prisma migrate dev
```
