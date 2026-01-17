'use client';

import { useEffect, useState } from 'react';
import { mechanicsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import MechanicCard from '@/components/MechanicCard';
import type { Mechanic } from '@/types';

export default function Home() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const { data } = await mechanicsApi.getAll();
        setMechanics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, []);

  const totalClicks = mechanics.reduce((sum, m) => sum + m.clickCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  return (
    <Layout>
      <HeroSection
        totalMechanics={mechanics.length}
        totalClicks={totalClicks}
      />

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">정비사 목록</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mechanics.map((mechanic) => (
            <MechanicCard
              key={mechanic.id}
              mechanic={mechanic}
              onClick={() => {
                // Phase 5에서 모달 열기 구현
                console.log('Open modal:', mechanic.id);
              }}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
}
