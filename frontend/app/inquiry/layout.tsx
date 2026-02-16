import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

export const metadata: Metadata = {
  title: '문의하기',
  description:
    '꿈꾸는정비사에 궁금한 점을 문의하세요. 일반 고객 문의, 정비소 사장님 문의 모두 가능합니다. 빠른 시간 내에 답변드립니다.',
  keywords: [
    '꿈꾸는정비사 문의', '정비소 문의', '자동차 정비 상담',
    '정비소 등록 문의', '카센터 상담',
  ],
  openGraph: {
    title: '문의하기 | 꿈꾸는정비사',
    description:
      '꿈꾸는정비사에 궁금한 점을 문의하세요. 일반 고객 문의, 정비소 사장님 문의 모두 가능합니다.',
    url: `${SITE_URL}/inquiry`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: `${SITE_URL}/inquiry`,
  },
};

export default function InquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD: BreadcrumbList */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: '홈',
              item: SITE_URL,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '문의하기',
              item: `${SITE_URL}/inquiry`,
            },
          ],
        }}
      />

      {children}
    </>
  );
}
