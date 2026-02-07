'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mechanicsApi } from '@/lib/api';
import { useModalStore } from '@/lib/store';
import {
  countMechanicsByRegion,
  getMechanicsByRegion,
  getRegionById,
} from '@/lib/regionMap';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import KoreaMap from '@/components/KoreaMap';
import MechanicCard from '@/components/MechanicCard';
import MechanicModal from '@/components/MechanicModal';
import CardSkeleton from '@/components/ui/CardSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import AnimatedSection from '@/components/animations/AnimatedSection';
import type { Mechanic } from '@/types';

export default function Home() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const openModal = useModalStore((state) => state.open);
  const mechanicListRef = useRef<HTMLDivElement>(null);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mechanicsApi.getAll();
      // API 응답: { data: { data: [], meta: {} } }
      setMechanics(response.data.data || []);
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

  // 지역별 정비소 수 계산
  const regionCounts = useMemo(
    () => countMechanicsByRegion(mechanics),
    [mechanics],
  );

  // 선택된 지역 정비소 필터링
  const filteredMechanics = useMemo(() => {
    if (!selectedRegion) return mechanics;
    return getMechanicsByRegion(mechanics, selectedRegion);
  }, [mechanics, selectedRegion]);

  // 선택된 지역 정보
  const selectedRegionInfo = selectedRegion
    ? getRegionById(selectedRegion)
    : null;

  const handleRegionClick = (regionId: string) => {
    const newRegion = regionId === selectedRegion ? null : regionId;
    setSelectedRegion(newRegion);

    // 지역 선택 시 정비소 목록으로 자동 스크롤
    if (newRegion && mechanicListRef.current) {
      setTimeout(() => {
        mechanicListRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

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
          <AnimatedSection animation="slideUp" duration={0.8}>
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
          </AnimatedSection>

          {/* 대한민국 지도 */}
          <AnimatedSection animation="slideUp" delay={0.2} duration={0.8}>
            <KoreaMap
              regionCounts={regionCounts}
              selectedRegion={selectedRegion}
              onRegionClick={handleRegionClick}
            />
          </AnimatedSection>

          {/* 선택된 지역 표시 + 전체 보기 버튼 */}
          <div ref={mechanicListRef} />
          <AnimatePresence mode="wait">
            {selectedRegionInfo && (
              <motion.div
                key="region-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-[#bf00ff]/10 to-purple-50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#bf00ff] rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg md:text-xl font-black">
                      {filteredMechanics.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-2xl font-black text-[#111111]">
                      {selectedRegionInfo.fullName}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      등록된 정비소
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-sm font-semibold text-[#bf00ff] hover:bg-[#bf00ff] hover:text-white transition-all
                    border-2 border-[#bf00ff] rounded-full px-4 py-2"
                >
                  전체 보기
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 카드 그리드 */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchMechanics} />
          ) : filteredMechanics.length === 0 && selectedRegion ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-400 text-lg mb-2">
                이 지역에 등록된 정비소가 없습니다.
              </p>
              <p className="text-gray-300 text-sm">
                곧 믿을 수 있는 정비소를 찾아 등록하겠습니다!
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRegion || 'all'}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8"
              >
                {filteredMechanics.map((mechanic, index) => (
                  <AnimatedSection
                    key={mechanic.id}
                    animation="slideUp"
                    delay={index * 0.1}
                    duration={0.5}
                  >
                    <MechanicCard
                      mechanic={mechanic}
                      onClick={() => openModal(mechanic)}
                    />
                  </AnimatedSection>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* 모달 */}
      <MechanicModal />
    </Layout>
  );
}
