import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '꿈꾸는정비사 소개 | 유튜브 52K 정비사가 만든 정비소 매칭 플랫폼',
  description:
    '20년 경력 자동차 정비사이자 유튜브 구독자 5.3만의 꿈꾸는 정비사가 직접 만든 정비소 매칭 플랫폼. 검증된 정비소에 30초 만에 문의하세요.',
  openGraph: {
    title: '꿈꾸는정비사 | 유튜브 52K 정비사가 만든 플랫폼',
    description:
      '20년 경력 정비사가 직접 검증한 전국 정비소. 30초 만에 문의, 정비사가 직접 연락드립니다.',
    url: 'https://dreammechaniclab.com/about',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: '꿈꾸는정비사 - 유튜브 52K 구독자가 만든 정비소 매칭 플랫폼',
      },
    ],
  },
  alternates: {
    canonical: 'https://dreammechaniclab.com/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
