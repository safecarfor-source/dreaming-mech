import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  parseServiceRegionSlug,
  getAllServiceRegionSlugs,
  SERVICES,
  REGIONS,
} from '@/data/service-regions';
import JsonLd from '@/components/seo/JsonLd';

const SITE_URL = 'https://dreammechaniclab.com';

interface Props {
  params: Promise<{ slug: string }>;
}

// ISR: 1시간마다 재생성
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllServiceRegionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { service, region } = parseServiceRegionSlug(slug);
  if (!service || !region) return { title: '서비스 | 꿈꾸는정비사' };

  const regionDisplay = region.slug === 'incheon' ? '인천' : region.name;
  const title = `${regionDisplay} ${service.name} | 꿈꾸는 정비사 추천 정비소`;
  const description = `${regionDisplay} ${service.name} 전문 정비소를 찾으세요. 20년 경력 꿈꾸는 정비사가 직접 검증한 믿을 수 있는 정비소. 가격 투명, 기술력 확인.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/services/${slug}`,
    },
    alternates: {
      canonical: `${SITE_URL}/services/${slug}`,
    },
  };
}

interface MechanicItem {
  id: number;
  name: string;
  address: string;
  location: string;
  mainImageUrl: string | null;
  specialties?: string[];
  phone: string;
}

async function fetchMechanicsByRegion(
  sido: string,
  sigungu: string,
): Promise<MechanicItem[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url =
      sigungu === sido
        ? `${apiUrl}/mechanics?sido=${encodeURIComponent(sido)}&limit=50`
        : `${apiUrl}/mechanics?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}&limit=50`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

function generateSlugForMechanic(location: string, name: string): string {
  const locationPart = location.split(' ').pop()?.replace(/시$|군$|구$/, '') ?? location;
  const namePart = name.replace(/\s+/g, '');
  return `${locationPart}-${namePart}`;
}

export default async function ServiceRegionPage({ params }: Props) {
  const { slug } = await params;
  const { service, region, content } = parseServiceRegionSlug(slug);

  if (!service || !region || !content) notFound();

  const regionDisplay = region.slug === 'incheon' ? '인천' : region.name;
  const sigunguParam = region.slug === 'incheon' ? region.sidoShort : region.name;

  const mechanics = await fetchMechanicsByRegion(region.sido, sigunguParam);

  // FAQ 구조화 데이터
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // Service 구조화 데이터
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${regionDisplay} ${service.name}`,
    provider: {
      '@type': 'Organization',
      name: '꿈꾸는정비사',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: regionDisplay,
    },
    description: service.description,
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd data={serviceJsonLd} />

      <div className="min-h-screen bg-white">
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-b from-[#FFF0F5] to-white px-5 pt-12 pb-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-4xl mb-3 block">{service.icon}</span>
            <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight mb-4">
              {regionDisplay} {service.name}
            </h1>
            <p className="text-[16px] md:text-[17px] text-gray-600 leading-[1.7]">
              {content.opening}
            </p>
          </div>
        </section>

        {/* 왜 꿈꾸는 정비사인가 */}
        <section className="px-5 py-8 border-b border-gray-100">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[22px] font-bold text-gray-900 mb-4 text-center">
              왜 꿈꾸는 정비사인가
            </h2>
            <p className="text-[16px] text-gray-600 leading-[1.7] text-center">
              {content.whyUs}
            </p>
          </div>
        </section>

        {/* 서비스 상세 */}
        <section className="px-5 py-8 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[22px] font-bold text-gray-900 mb-4 text-center">
              {service.name}, 왜 중요한가
            </h2>
            <p className="text-[16px] text-gray-600 leading-[1.7]">
              {service.description}
            </p>
          </div>
        </section>

        {/* 정비소 목록 */}
        <section className="px-5 py-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[22px] font-bold text-gray-900 mb-6 text-center">
              {regionDisplay} 검증된 정비소
            </h2>
            {mechanics.length > 0 ? (
              <div className="space-y-4">
                {mechanics.map((m) => {
                  const shopSlug = generateSlugForMechanic(m.location, m.name);
                  return (
                    <Link
                      key={m.id}
                      href={`/shop/${shopSlug}`}
                      className="block border border-gray-200 rounded-2xl p-5 hover:border-[#E4015C] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {m.mainImageUrl ? (
                          <img
                            src={m.mainImageUrl}
                            alt={m.name}
                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl">
                            🔧
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[17px] font-bold text-gray-900 truncate">
                            {m.name}
                          </h3>
                          <p className="text-[14px] text-gray-500 mt-1 truncate">
                            {m.address}
                          </p>
                          {m.specialties && m.specialties.length > 0 && (
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {m.specialties.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="text-[12px] px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <p className="text-[16px]">아직 등록된 정비소가 없어요.</p>
                <p className="text-[14px] mt-2">곧 {regionDisplay} 지역 정비소를 추가할 예정이에요.</p>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-8 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[22px] font-bold text-gray-900 mb-6 text-center">
              자주 묻는 질문
            </h2>
            <div className="space-y-4">
              {content.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden group"
                >
                  <summary className="px-5 py-4 cursor-pointer text-[16px] font-semibold text-gray-900 list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-[14px]">
                      ▼
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-[15px] text-gray-600 leading-[1.7]">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[22px] font-bold text-gray-900 mb-3">
              내 근처 믿을 수 있는 정비소 찾기
            </h2>
            <p className="text-[15px] text-gray-500 mb-6">
              꿈꾸는 정비사가 직접 검증한 정비소에서 {service.name} 상담받으세요
            </p>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center gap-2 bg-[#E4015C] hover:bg-[#C70150] text-white rounded-xl px-8 py-4 text-[17px] font-semibold transition-colors"
            >
              무료 상담 신청하기
            </Link>
          </div>
        </section>

        {/* 내부 링크: 다른 서비스, 다른 지역 */}
        <section className="px-5 py-8 bg-gray-50 border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-[16px] font-bold text-gray-700 mb-3">
              다른 서비스
            </h3>
            <div className="flex gap-2 flex-wrap mb-6">
              {SERVICES.filter((s) => s.slug !== service.slug).map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}-${region.slug}`}
                  className="text-[14px] px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-[#7C4DFF] hover:text-[#7C4DFF] transition-colors"
                >
                  {regionDisplay} {s.shortName}
                </Link>
              ))}
            </div>
            <h3 className="text-[16px] font-bold text-gray-700 mb-3">
              다른 지역
            </h3>
            <div className="flex gap-2 flex-wrap">
              {REGIONS.filter((r) => r.slug !== region.slug).map((r) => {
                const rDisplay = r.slug === 'incheon' ? '인천' : r.name;
                return (
                  <Link
                    key={r.slug}
                    href={`/services/${service.slug}-${r.slug}`}
                    className="text-[14px] px-4 py-2 border border-gray-200 rounded-full text-gray-600 hover:border-[#E4015C] hover:text-[#E4015C] transition-colors"
                  >
                    {rDisplay} {service.shortName}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
