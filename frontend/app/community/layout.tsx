import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

export const metadata: Metadata = {
  title: '정비 Q&A | 자동차 정비 질문·답변 커뮤니티',
  description:
    '자동차 정비 관련 궁금한 점을 질문하고, 검증된 정비사에게 직접 답변 받으세요. 타이어, 엔진오일, 브레이크, 일반 정비 등 모든 질문 가능.',
  keywords: [
    '자동차 정비 질문', '정비사 답변', '자동차 수리 상담',
    '타이어 교체 질문', '엔진오일 교환 시기', '브레이크 점검',
    '자동차 정비 커뮤니티', '카센터 질문', '정비 Q&A',
  ],
  openGraph: {
    title: '정비 Q&A | 꿈꾸는정비사 커뮤니티',
    description:
      '자동차 정비 궁금증을 해결하세요. 검증된 정비사가 직접 답변해 드립니다.',
    url: `${SITE_URL}/community`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD: DiscussionForumPosting 컬렉션 (커뮤니티 게시판) */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${SITE_URL}/community`,
          name: '정비 Q&A - 자동차 정비 질문·답변 커뮤니티',
          description:
            '자동차 정비 관련 궁금한 점을 질문하고, 검증된 정비사에게 직접 답변 받는 커뮤니티.',
          url: `${SITE_URL}/community`,
          isPartOf: {
            '@id': `${SITE_URL}/#website`,
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
              name: '정비 Q&A',
              item: `${SITE_URL}/community`,
            },
          ],
        }}
      />

      {children}
    </>
  );
}
