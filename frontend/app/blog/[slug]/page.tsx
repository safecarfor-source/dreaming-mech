import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS, findBlogPost } from '@/data/blog-posts';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findBlogPost(slug);
  if (!post) return { title: '블로그 | 꿈꾸는정비사' };

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      type: 'article',
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.publishedAt,
      ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
  };
}

// 간단한 마크다운 → HTML 변환 (## 헤더, 빈 줄 = 단락, 숫자. = 리스트)
function renderContent(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let paragraphLines: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      elements.push(
        <p
          key={key++}
          className="text-[16px] md:text-[17px] text-gray-700 leading-[1.8] mb-4"
        >
          {paragraphLines.join('\n')}
        </p>,
      );
      paragraphLines = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      elements.push(
        <h2
          key={key++}
          className="text-[22px] font-bold text-gray-900 mt-8 mb-4"
        >
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }

    if (/^\d+단계/.test(trimmed)) {
      flushParagraph();
      elements.push(
        <div
          key={key++}
          className="pl-4 border-l-4 border-[#E4015C] py-1 mb-3 text-[16px] text-gray-700"
        >
          {trimmed}
        </div>,
      );
      continue;
    }

    paragraphLines.push(trimmed);
  }

  flushParagraph();
  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = findBlogPost(slug);

  if (!post) notFound();

  // Article 구조화 데이터
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: '꿈꾸는 정비사',
      url: 'https://www.youtube.com/@%EA%BF%88%EA%BE%B8%EB%8A%94%EC%A0%95%EB%B9%84%EC%82%AC',
    },
    publisher: {
      '@type': 'Organization',
      name: '꿈꾸는정비사',
      url: SITE_URL,
      logo: `${SITE_URL}/opengraph-image`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
    ...(post.ogImage ? { image: post.ogImage } : {}),
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="min-h-screen bg-white">
        {/* 헤더 */}
        <header className="px-5 pt-10 pb-6 border-b border-gray-100">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[13px] px-3 py-1 bg-[#FFF0F5] text-[#E4015C] rounded-full font-semibold">
                {post.category}
              </span>
              <span className="text-[13px] text-gray-400">
                {post.readTime}분 읽기
              </span>
              <span className="text-[13px] text-gray-400">
                {post.publishedAt}
              </span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight mb-2">
              {post.title}
            </h1>
            <p className="text-[17px] text-gray-500">{post.subtitle}</p>
          </div>
        </header>

        {/* 유튜브 임베드 */}
        {post.youtubeVideoId && (
          <section className="px-5 py-6 bg-gray-50">
            <div className="max-w-2xl mx-auto">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${post.youtubeVideoId}`}
                  title={post.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <p className="text-[13px] text-gray-400 text-center mt-3">
                꿈꾸는 정비사 유튜브에서 영상으로도 확인하세요
              </p>
            </div>
          </section>
        )}

        {/* 본문 */}
        <section className="px-5 py-8">
          <div className="max-w-2xl mx-auto">{renderContent(post.content)}</div>
        </section>

        {/* CTA */}
        <section className="px-5 py-10 bg-[#FFF0F5]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-[22px] font-bold text-gray-900 mb-3">
              내 차도 점검받고 싶다면
            </h2>
            <p className="text-[15px] text-gray-600 mb-6">
              꿈꾸는 정비사가 검증한 정비소에서 상담받으세요
            </p>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center bg-[#E4015C] hover:bg-[#C70150] text-white rounded-xl px-8 py-4 text-[17px] font-semibold transition-colors"
            >
              무료 상담 신청하기
            </Link>
          </div>
        </section>

        {/* 관련 서비스 내부 링크 */}
        {post.relatedServiceSlugs.length > 0 && (
          <section className="px-5 py-8 border-t border-gray-100">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-[16px] font-bold text-gray-700 mb-3">
                관련 서비스 정비소 찾기
              </h3>
              <div className="flex gap-2 flex-wrap">
                {post.relatedServiceSlugs.map((s) => (
                  <Link
                    key={s}
                    href={`/services/${s}`}
                    className="text-[14px] px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-[#E4015C] hover:text-[#E4015C] transition-colors"
                  >
                    {post.relatedServices[post.relatedServiceSlugs.indexOf(s)] || s}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}
