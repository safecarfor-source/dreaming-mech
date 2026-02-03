'use client';

import { useEffect, useState } from 'react';
import { mechanicsApi } from '@/lib/api';
import { useModalStore } from '@/lib/store';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import MechanicCard from '@/components/MechanicCard';
import MechanicModal from '@/components/MechanicModal';
import CardSkeleton from '@/components/ui/CardSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { Mechanic } from '@/types';

export default function Home() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const openModal = useModalStore((state) => state.open);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await mechanicsApi.getAll();
      setMechanics(data);
    } catch (error) {
      console.error(error);
      setError('정비사 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const totalClicks = mechanics.reduce((sum, m) => sum + m.clickCount, 0);

  return (
    <Layout>
      <HeroSection
        totalMechanics={mechanics.length}
        totalClicks={totalClicks}
      />

      {/* 다크 → 흰색 그라데이션 전환 */}
      <div className="h-40 bg-gradient-to-b from-black/60 via-black/30 via-30% to-white" />

      {/* 정비사 목록 섹션 - 흰색 배경 */}
      <section className="bg-white pb-24">
        <div className="container mx-auto px-6">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <p className="text-[#bf00ff] text-sm font-medium tracking-widest mb-4">
              MECHANICS
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-[#111111] mb-4">
              전국 <span className="text-[#bf00ff]">팔도</span> 정비사
            </h2>
            <p className="text-[#666666] text-lg">
              실력과 신뢰를 갖춘 전문가들을 만나보세요
            </p>
          </div>

          {/* 카드 그리드 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchMechanics} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mechanics.map((mechanic) => (
                <MechanicCard
                  key={mechanic.id}
                  mechanic={mechanic}
                  onClick={() => openModal(mechanic)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 모달 */}
      <MechanicModal />
    </Layout>
  );
}
