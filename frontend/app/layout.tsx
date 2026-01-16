import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "정비사 웹사이트",
  description: "정비사 정보 관리 웹사이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
