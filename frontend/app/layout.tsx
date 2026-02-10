import type { Metadata } from "next";
import Script from "next/script";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "꿈꾸는정비사",
  description: "검증된 정비사를 한 곳에서 만나보세요",
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
