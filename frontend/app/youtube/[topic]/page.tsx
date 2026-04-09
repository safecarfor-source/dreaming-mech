import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { YOUTUBE_BRIDGES, findBridgeBySlug } from '@/data/youtube-bridge';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

interface Props {
  params: Promise<{ topic: string }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return YOUTUBE_BRIDGES.map((b) => ({ topic: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const bridge = findBridgeBySlug(topic);
  if (!bridge) return { title: '영상 | 꿈꾸는정비사' };

  return {
    title: bridge.seoTitle,
    description: bridge.seoDescription,
    openGraph: {
      title: bridge.seoTitle,
      description: bridge.seoDescription,
      type: 'website',
      url: `${SITE_URL}/youtube/${topic}`,
    },
    alternates: {
      canonical: `${SITE_URL}/youtube/${topic}`,
    },
  };
}

export default async function YoutubeBridgePage({ params }: Props) {
  const { topic } = await params;
  const bridge = findBridgeBySlug(topic);

  if (!bridge) notFound();

  // VideoObject 구조화 데이터
  const videoJsonLd = bridge.videoId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: bridge.title,
        description: bridge.seoDescription,
        thumbnailUrl: `https://img.youtube.com/vi/${bridge.videoId}/maxresdefault.jpg`,
        uploadDate: new Date().toISOString(),
        contentUrl: `https://www.youtube.com/watch?v=${bridge.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${bridge.videoId}`,
        publisher: {
          '@type': 'Organization',
          name: '꿈꾸는정비사',
          url: SITE_URL,
        },
      }
    : null;

  return (
    <>
      {videoJsonLd && <JsonLd data={videoJsonLd} />}

      <div className="min-h-screen bg-white">
        {/* 히어로 */}
        <section className="bg-gradient-to-b from-gray-900 to-gray-800 px-5 pt-10 pb-8">
          <div className="max-w-2xl mx-auto">
            <span className="text-4xl mb-3 block text-center">{bridge.icon}</span>
            <h1 className="text-[24px] md:text-[28px] font-bold text-white text-center leading-tight mb-6">
              {bridge.title}
            </h1>

            {/* 영상 임베드 or 플레이스홀더 */}
            {bridge.videoId ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${bridge.videoId}`}
                  title={bridge.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 text-[16px] mb-2">🎬 영상 준비 중</p>
                  <a
                    href="https://www.youtube.com/@%EA%BF%88%EA%BE%B8%EB%8A%94%EC%A0%95%EB%B9%84%EC%82%AC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E4015C] text-[14px] font-semibold hover:underline"
                  >
                    유튜브 채널 방문하기 →
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 핵심 요약 */}
        <section className="px-5 py-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[20px] font-bold text-gray-900 mb-5 text-center">
              영상 핵심 정리
            </h2>
            <div className="space-y-4">
              {bridge.summary.map((line, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FFF0F5] text-[#E4015C] text-[14px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[16px] text-gray-700 leading-[1.7]">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 전환 CTA */}
        <section className="px-5 py-10 bg-gradient-to-b from-[#FFF0F5] to-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-[22px] font-bold text-gray-900 mb-3">
              그래서 어떻게 하면 되나?
            </h2>
            <p className="text-[16px] text-gray-600 leading-[1.7] mb-6">
              {bridge.hook}
            </p>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center gap-2 bg-[#E4015C] hover:bg-[#C70150] text-white rounded-xl px-8 py-4 text-[17px] font-semibold transition-colors"
            >
              {bridge.ctaText}
            </Link>
          </div>
        </section>

        {/* 다른 영상 */}
        <section className="px-5 py-8 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-[18px] font-bold text-gray-900 mb-4 text-center">
              다른 정비 가이드 영상
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {YOUTUBE_BRIDGES.filter((b) => b.slug !== bridge.slug).map((b) => (
                <Link
                  key={b.slug}
                  href={`/youtube/${b.slug}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#E4015C] hover:shadow-sm transition-all"
                >
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-[14px] font-semibold text-gray-700 line-clamp-2">
                    {b.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 채널 링크 */}
        <section className="px-5 py-8 text-center">
          <a
            href="https://www.youtube.com/@%EA%BF%88%EA%BE%B8%EB%8A%94%EC%A0%95%EB%B9%84%EC%82%AC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[15px] text-gray-500 hover:text-[#E4015C] transition-colors"
          >
            🎬 꿈꾸는 정비사 유튜브에서 더 많은 정비 영상 보기 →
          </a>
        </section>
      </div>
    </>
  );
}
