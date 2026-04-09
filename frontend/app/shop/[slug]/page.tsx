import { Metadata } from 'next';
import ShopDetailClient from './ShopDetailClient';
import { parseSlug } from '@/lib/slug';
import ShopJsonLd from '@/components/seo/ShopJsonLd';
import { getShortLocation, getPrimaryService } from '@/lib/seo-utils';
import type { Mechanic } from '@/types';

const SITE_URL = 'https://dreammechaniclab.com';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchMechanic(slug: string): Promise<Mechanic | null> {
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
  const mechanic = await fetchMechanic(slug);

  if (!mechanic) {
    const { locationKeyword, nameKeyword } = parseSlug(slug);
    const fallbackTitle = nameKeyword
      ? `${nameKeyword} | 꿈꾸는정비사 검증 정비소`
      : '정비소 상세 | 꿈꾸는정비사';
    return { title: fallbackTitle };
  }

  const shortLoc = getShortLocation(mechanic.location);
  const primaryService = getPrimaryService(mechanic.specialties);
  const title = `${mechanic.name} | ${shortLoc} ${primaryService} | 꿈꾸는정비사 추천`;

  const descBase = mechanic.description
    ? mechanic.description.slice(0, 80)
    : `${shortLoc} 지역 ${primaryService} 전문`;
  const description = `${mechanic.name}은 ${descBase}. 꿈꾸는정비사가 직접 검증한 믿을 수 있는 정비소입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/shop/${slug}`,
      ...(mechanic.mainImageUrl
        ? {
            images: [
              {
                url: mechanic.mainImageUrl,
                width: 1200,
                height: 630,
                alt: `${mechanic.name} - ${shortLoc} ${primaryService}`,
              },
            ],
          }
        : {}),
    },
    alternates: {
      canonical: `${SITE_URL}/shop/${slug}`,
    },
  };
}

export default async function ShopDetailPage({ params }: Props) {
  const { slug } = await params;
  const mechanic = await fetchMechanic(slug);

  return (
    <>
      {mechanic && <ShopJsonLd mechanic={mechanic} slug={slug} />}
      <ShopDetailClient slug={slug} />
    </>
  );
}
