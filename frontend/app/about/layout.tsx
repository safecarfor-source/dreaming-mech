import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

export const metadata: Metadata = {
  title: '꿈꾸는정비사 소개 | 유튜브 52K 정비사가 만든 정비소 매칭 플랫폼',
  description:
    '20년 경력 자동차 정비사이자 유튜브 구독자 5.3만의 꿈꾸는 정비사가 직접 만든 정비소 매칭 플랫폼. 검증된 정비소에 30초 만에 문의하세요.',
  keywords: [
    '꿈꾸는정비사', '정비소 매칭', '자동차 정비소 추천',
    '검증된 정비소', '정비사 유튜브', '자동차 수리 플랫폼',
    '내 근처 정비소 찾기', '정비소 예약',
  ],
  openGraph: {
    title: '꿈꾸는정비사 | 유튜브 52K 정비사가 만든 플랫폼',
    description:
      '20년 경력 정비사가 직접 검증한 전국 정비소. 30초 만에 문의, 정비사가 직접 연락드립니다.',
    url: `${SITE_URL}/about`,
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
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* JSON-LD: Service Schema — 정비소 매칭 서비스 */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          '@id': `${SITE_URL}/about/#service`,
          name: '꿈꾸는정비사 정비소 매칭 서비스',
          description:
            '20년 경력 정비사가 직접 검증한 전국 자동차 정비소를 무료로 매칭해 드리는 서비스. 30초 문의로 검증된 정비사가 직접 연락드립니다.',
          provider: {
            '@id': `${SITE_URL}/#organization`,
          },
          serviceType: '자동차 정비소 매칭',
          areaServed: {
            '@type': 'Country',
            name: '대한민국',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'KRW',
            description: '고객 문의 무료',
          },
        }}
      />

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
              name: '플랫폼 소개',
              item: `${SITE_URL}/about`,
            },
          ],
        }}
      />

      {children}
    </>
  );
}
