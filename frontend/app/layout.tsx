import type { Metadata } from "next";
import Script from "next/script";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import JsonLd from "@/components/seo/JsonLd";
import "./globals.css";

const SITE_URL = 'https://dreammechaniclab.com';
const SITE_NAME = '꿈꾸는정비사';
const DEFAULT_DESCRIPTION =
  '유튜브 구독자 5.3만 꿈꾸는 정비사가 직접 검증한 전국 자동차 정비소를 한 곳에서 만나보세요. 지역별 정비소 검색, 실시간 정비사 정보, 위치 안내까지.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: '꿈꾸는정비사 | 검증된 전국 자동차 정비소 찾기',
    template: '%s | 꿈꾸는정비사',
  },

  description: DEFAULT_DESCRIPTION,

  keywords: [
    '자동차 정비소', '자동차 수리', '정비소 추천', '검증된 정비사',
    '전국 정비소', '꿈꾸는 정비사', '자동차 정비 유튜브',
    '정비소 찾기', '내 근처 정비소', '자동차 점검',
    '엔진오일 교환', '타이어 교체', '브레이크 정비',
    '카센터 추천', '믿을 수 있는 정비소',
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],

  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: '꿈꾸는정비사 | 검증된 전국 자동차 정비소 찾기',
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: '꿈꾸는정비사 - 검증된 전국 자동차 정비소',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: '꿈꾸는정비사 | 검증된 전국 자동차 정비소 찾기',
    description: DEFAULT_DESCRIPTION,
    images: ['/opengraph-image'],
  },

  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
    other: {
      'naver-site-verification': 'YOUR_NAVER_VERIFICATION_CODE',
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const naverMapClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  return (
    <html lang="ko">
      <head>
        {/* Google Analytics - admin/owner 페이지 제외, 수동 페이지뷰 관리 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PPK8Y8EZ43"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PPK8Y8EZ43', { send_page_view: false });
            if (!window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/owner')) {
              gtag('event', 'page_view', { page_path: window.location.pathname });
            }
          `}
        </Script>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        {/* JSON-LD: Organization Schema */}
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/opengraph-image`,
            description:
              '유튜브 구독자 5.3만 꿈꾸는 정비사가 직접 검증한 전국 자동차 정비소 디렉토리 플랫폼',
            sameAs: [
              'https://www.youtube.com/@dreaming-mechanic',
            ],
          }}
        />

        {/* JSON-LD: WebSite Schema + SearchAction */}
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            description: DEFAULT_DESCRIPTION,
            publisher: {
              '@id': `${SITE_URL}/#organization`,
            },
          }}
        />

        {/* Naver Maps API - 전역 로드 */}
        {naverMapClientId && (
          <Script
            src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverMapClientId}`}
            strategy="beforeInteractive"
          />
        )}
        <PageViewTracker />
        {children}
      </body>
    </html>
  );
}
