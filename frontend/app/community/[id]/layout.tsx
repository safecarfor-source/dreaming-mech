import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: '일반 질문',
  TIRE: '타이어',
  ENGINE_OIL: '엔진오일',
  BRAKE: '브레이크',
  REPAIR: '정비',
};

// 동적 메타데이터 — 글 제목을 OG title로
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/community/posts/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error('Post not found');

    const post = await res.json();
    const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
    const title = `${post.title} | 정비 Q&A`;
    const description = post.content
      ? post.content.slice(0, 150).replace(/\n/g, ' ')
      : `${categoryLabel} 관련 정비 질문 - 꿈꾸는정비사 커뮤니티`;

    return {
      title,
      description,
      openGraph: {
        title: `${post.title} | 꿈꾸는정비사 정비 Q&A`,
        description,
        url: `${SITE_URL}/community/${id}`,
        images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
      },
      alternates: {
        canonical: `${SITE_URL}/community/${id}`,
      },
    };
  } catch {
    return {
      title: '정비 Q&A | 꿈꾸는정비사',
      description: '자동차 정비 관련 질문과 답변을 확인하세요.',
    };
  }
}

export default async function CommunityPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
              name: '정비 Q&A',
              item: `${SITE_URL}/community`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: '게시글',
              item: `${SITE_URL}/community/${id}`,
            },
          ],
        }}
      />

      {children}
    </>
  );
}
