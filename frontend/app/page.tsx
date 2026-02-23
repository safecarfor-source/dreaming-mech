'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
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

  // 선택된 지역 + 검색 + 전문분야 필터링
  const filteredMechanics = useMemo(() => {
    let result = mechanics;

    // 지역 필터
    if (selectedRegion) {
      result = getMechanicsByRegion(result, selectedRegion);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(query) ||
        m.address.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query)
      );
    }

    // 전문분야 필터
    if (selectedSpecialty) {
      result = result.filter((m) =>
        m.specialties?.some((s) => s.includes(selectedSpecialty))
      );
    }

    return result;
  }, [mechanics, selectedRegion, searchQuery, selectedSpecialty]);

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
      <div className="h-32 md:h-40 bg-gradient-to-b from-black/60 via-black/30 via-30% to-[#F8F7FC]" />

      {/* 정비사 목록 섹션 */}
      <section id="map" className="bg-[#F8F7FC] pb-16 md:pb-24">
        <div className="container mx-auto px-4 md:px-6">
          {/* 섹션 헤더 */}
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center mb-10 md:mb-16">
              <p className="text-[#F59E0B] text-xs md:text-sm font-semibold tracking-widest mb-3 md:mb-4">
                MECHANICS
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 md:mb-4">
                전국 <span className="text-[#7C4DFF]">팔도</span> 정비사
              </h2>
              <p className="text-gray-500 text-base md:text-lg">
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

          {/* 검색 & 필터 */}
          <div ref={mechanicListRef} />
          <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8 mt-10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="정비소명 또는 지역 검색..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/20 transition-colors"
              />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="sm:w-48 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 appearance-none focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF]/20 transition-colors"
            >
              <option value="">전체 분야</option>
              <option value="엔진">엔진</option>
              <option value="미션">미션</option>
              <option value="판금도색">판금도색</option>
              <option value="타이어">타이어</option>
              <option value="브레이크">브레이크</option>
              <option value="에어컨">에어컨</option>
              <option value="전기전자">전기전자</option>
            </select>
          </div>

          {/* 선택된 지역 표시 + 전체 보기 버튼 */}
          <AnimatePresence mode="wait">
            {selectedRegionInfo && (
              <motion.div
                key="region-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-[#7C4DFF]/8 to-[#F5F3FF] rounded-2xl p-4 md:p-6 mb-4 md:mb-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#7C4DFF] rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg md:text-xl font-black">
                      {filteredMechanics.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base md:text-2xl font-black text-gray-900">
                      {selectedRegionInfo.fullName}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      등록된 정비소
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-xs md:text-sm font-semibold text-[#7C4DFF] hover:bg-[#7C4DFF] hover:text-white transition-all
                    border-2 border-[#7C4DFF] rounded-full px-3 md:px-4 py-1.5 md:py-2"
                >
                  전체 보기
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 카드 그리드 */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
              className="text-center py-12 md:py-16"
            >
              <p className="text-gray-500 text-base md:text-lg mb-2">
                이 지역에 등록된 정비소가 없습니다.
              </p>
              <p className="text-gray-400 text-sm">
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
                className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
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
