import { Metadata } from 'next';
import ShopDetailClient from './ShopDetailClient';
import { parseSlug } from '@/lib/slug';

interface Props {
  params: Promise<{ slug: string }>;
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
  return <ShopDetailClient slug={slug} />;
}
