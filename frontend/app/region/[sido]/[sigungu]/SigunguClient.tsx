'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import MechanicCard from '@/components/MechanicCard';
import { generateSlug } from '@/lib/slug';
import { getSidoSlug } from '@/lib/regions';
import type { Mechanic } from '@/types';

interface Props {
  sidoShort: string;
  sigungu: string;
  mechanics: Mechanic[];
}

export default function SigunguClient({ sidoShort, sigungu, mechanics }: Props) {
  const router = useRouter();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E4015C] transition-colors">홈</Link>
          <span>/</span>
          <Link
            href={`/region/${getSidoSlug(sidoShort)}`}
            className="hover:text-[#E4015C] transition-colors"
          >
            {sidoShort}
          </Link>
          <span>/</span>
          <span className="text-[#111827] font-medium">{sigungu}</span>
        </nav>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2" style={{ lineHeight: '1.6' }}>
            {sidoShort} {sigungu} 자동차 정비소
          </h1>
          <p className="text-[#6B7280] text-sm" style={{ lineHeight: '1.7' }}>
            꿈꾸는정비사가 직접 검증한 {sidoShort} {sigungu} 지역 정비소입니다.
          </p>
        </div>

        {/* 정비소 목록 */}
        {mechanics.length > 0 ? (
          <>
            <p className="text-sm text-[#6B7280] mb-4">
              총 <span className="font-semibold text-[#111827]">{mechanics.length}</span>개의 정비소
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mechanics.map((mechanic) => (
                <MechanicCard
                  key={mechanic.id}
                  mechanic={mechanic}
                  isPremium={mechanic.isPremium}
                  onClick={() =>
                    router.push(`/shop/${generateSlug(mechanic.location, mechanic.name)}`)
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center bg-[#F9FAFB] rounded-xl">
            <p className="text-[#6B7280] text-sm mb-4" style={{ lineHeight: '1.7' }}>
              {sidoShort} {sigungu} 지역에 아직 등록된 정비소가 없습니다.
            </p>
            <Link
              href="/#inquiry"
              className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#E4015C] hover:bg-[#C70150] transition-colors"
            >
              정비소 추천 요청하기
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
