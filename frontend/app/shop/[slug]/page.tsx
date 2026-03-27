import { Metadata } from 'next';
import ShopDetailClient from './ShopDetailClient';
import { parseSlug } from '@/lib/slug';
import JsonLd from '@/components/seo/JsonLd';

interface Props {
  params: Promise<{ slug: string }>;
}

interface MechanicData {
  name: string;
  address: string;
  location: string;
  phone: string;
  mainImageUrl: string | null;
  mapLat: number | null;
  mapLng: number | null;
}

async function fetchMechanic(slug: string): Promise<MechanicData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/mechanics/by-slug/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locationKeyword, nameKeyword } = parseSlug(slug);

  const title = nameKeyword
    ? `${nameKeyword} | 꿈꾸는정비사 검증 정비소`
    : '정비소 상세 | 꿈꾸는정비사';

  const description = locationKeyword
    ? `${locationKeyword} 지역 ${nameKeyword} — 꿈꾸는정비사가 직접 검증한 정비소입니다. 전문 정비사가 운영하는 믿을 수 있는 정비소를 만나보세요.`
    : '꿈꾸는정비사가 직접 검증한 정비소입니다.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function ShopDetailPage({ params }: Props) {
  const { slug } = await params;

  const mechanic = await fetchMechanic(slug);

  const jsonLd = mechanic
    ? {
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        name: mechanic.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: mechanic.address,
          addressLocality: mechanic.location,
          addressCountry: 'KR',
        },
        telephone: mechanic.phone,
        ...(mechanic.mapLat && mechanic.mapLng
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: mechanic.mapLat,
                longitude: mechanic.mapLng,
              },
            }
          : {}),
        ...(mechanic.mainImageUrl ? { image: mechanic.mainImageUrl } : {}),
        url: `https://dreammechaniclab.com/shop/${slug}`,
        isPartOf: {
          '@type': 'WebSite',
          name: '꿈꾸는정비사',
          url: 'https://dreammechaniclab.com',
        },
      }
    : null;

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <ShopDetailClient slug={slug} />
    </>
  );
}
