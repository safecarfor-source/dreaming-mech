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

      {/* 다크 → 라이트 그라데이션 전환 */}
      <div className="h-24 sm:h-32 md:h-40 bg-gradient-to-b from-black/60 via-black/20 via-40% to-white" />

      {/* 정비사 목록 섹션 — 60% 화이트 배경 */}
      <section id="map" className="bg-white pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          {/* 섹션 헤더 */}
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <p className="text-accent-500 text-[var(--text-caption)] font-semibold tracking-[0.12em] uppercase mb-3">
                MECHANICS
              </p>
              <h2 className="text-[var(--text-h2)] md:text-[var(--text-h1)] font-black text-text-primary mb-3">
                전국 <span className="text-brand-500">팔도</span> 정비사
              </h2>
              <p className="text-text-tertiary text-[var(--text-body)] md:text-[var(--text-h5)]">
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
                className="bg-brand-50 border border-brand-200 rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-[var(--shadow-sm)]">
                    <span className="text-white text-[var(--text-h5)] md:text-[var(--text-h4)] font-black">
                      {filteredMechanics.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[var(--text-body)] md:text-[var(--text-h4)] font-bold text-text-primary">
                      {selectedRegionInfo.fullName}
                    </h3>
                    <p className="text-[var(--text-caption)] text-text-tertiary">
                      등록된 정비소
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-[var(--text-caption)] md:text-[var(--text-body)] font-semibold text-brand-500 hover:bg-brand-500 hover:text-white
                    border-2 border-brand-500 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-[var(--duration-normal)]"
                >
                  전체 보기
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 카드 그리드 */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
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
              className="text-center py-16 md:py-24"
            >
              <p className="text-text-secondary text-[var(--text-body)] md:text-[var(--text-h5)] mb-2">
                이 지역에 등록된 정비소가 없습니다.
              </p>
              <p className="text-text-muted text-[var(--text-caption)] md:text-[var(--text-body)]">
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
                className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
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
