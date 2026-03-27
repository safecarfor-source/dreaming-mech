import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import {
  SIDO_FULL_NAMES,
  SIDO_SHORT_NAMES,
  getSigungusBySido,
} from '@/lib/regions';
import { Mechanic } from '@/types';
import RegionClient from './RegionClient';

interface Props {
  params: Promise<{ sido: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sido: sidoParam } = await params;
  const sidoShort = decodeURIComponent(sidoParam);

  if (!SIDO_FULL_NAMES[sidoShort]) {
    return { title: '지역을 찾을 수 없습니다 | 꿈꾸는정비사' };
  }

  const title = `${sidoShort} 자동차 정비소 추천 | 꿈꾸는정비사`;
  const description = `${sidoShort} 지역 검증된 자동차 정비소를 찾아보세요. 꿈꾸는정비사가 직접 검증한 믿을 수 있는 정비소를 추천합니다.`;

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

export default async function SidoPage({ params }: Props) {
  const { sido: sidoParam } = await params;
  const sidoShort = decodeURIComponent(sidoParam);
  const sidoFull = SIDO_FULL_NAMES[sidoShort];

  if (!sidoFull) {
    notFound();
  }

  // 서버에서 직접 fetch
  let mechanics: Mechanic[] = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(
      `${apiUrl}/mechanics?sido=${encodeURIComponent(sidoFull)}&limit=100`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      mechanics = Array.isArray(json) ? json : (json.data ?? []);
    }
  } catch {
    // API 실패 시 빈 목록으로 계속
  }

  const sigunguList = getSigungusBySido(sidoFull);

  // JSON-LD: ItemList 스키마
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${sidoShort} 자동차 정비소`,
    description: `${sidoShort} 지역 꿈꾸는정비사 검증 정비소 목록`,
    numberOfItems: mechanics.length,
    itemListElement: mechanics.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'AutoRepair',
        name: m.name,
        address: m.address,
        telephone: m.phone,
      },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <RegionClient
        sidoShort={sidoShort}
        sidoFull={sidoFull}
        mechanics={mechanics}
        sigunguList={sigunguList}
      />
    </>
  );
}
