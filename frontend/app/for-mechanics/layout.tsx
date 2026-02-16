import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

export const metadata: Metadata = {
  title: '정비소 사장님을 위한 안내',
  description:
    '꿈꾸는정비사 플랫폼에 정비소를 등록하세요. 유튜브 구독자 5.3만, 월 61만 조회수 채널과 연결된 자동차 정비소 마케팅 플랫폼. 5분이면 등록 완료.',
  keywords: [
    '정비소 등록', '정비소 마케팅', '자동차 정비소 홍보',
    '카센터 마케팅', '정비사 플랫폼', '꿈꾸는정비사 등록',
  ],
  openGraph: {
    title: '정비소 사장님을 위한 안내 | 꿈꾸는정비사',
    description:
      '유튜브 5.3만 구독자 채널과 함께하는 정비소 마케팅 플랫폼. 월 61만 조회수의 트래픽을 활용하세요.',
    url: `${SITE_URL}/for-mechanics`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: `${SITE_URL}/for-mechanics`,
  },
};

export default function ForMechanicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD: FAQPage Schema - AI 인용 최적화 */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '꿈꾸는정비사 플랫폼에 정비소를 어떻게 등록하나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네이버 또는 카카오로 간편 가입 후, 사업자등록증 확인을 거쳐 승인되면 사진, 위치, 소개글을 직접 등록할 수 있습니다. 5분이면 등록이 완료됩니다.',
              },
            },
            {
              '@type': 'Question',
              name: '꿈꾸는정비사 유튜브 채널의 구독자와 조회수는 얼마인가요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '꿈꾸는 정비사 유튜브 채널은 구독자 약 53,000명, 월간 조회수 약 61만의 트래픽을 가지고 있습니다.',
              },
            },
            {
              '@type': 'Question',
              name: '정비소 등록 시 어떤 혜택이 있나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '유튜브 영상과 연동 가능하며, 조회수와 클릭수 실시간 통계가 제공됩니다. 사장님이 직접 사진, 소개글, 위치를 관리할 수 있습니다.',
              },
            },
            {
              '@type': 'Question',
              name: '정비소 등록 비용은 얼마인가요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '꿈꾸는정비사 플랫폼은 정비소 등록 및 노출을 무료로 제공합니다. 유튜브 채널의 트래픽을 활용하여 추가 비용 없이 고객을 유치할 수 있습니다.',
              },
            },
          ],
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
              name: '정비소 사장님 안내',
              item: `${SITE_URL}/for-mechanics`,
            },
          ],
        }}
      />

      {children}
    </>
  );
}
