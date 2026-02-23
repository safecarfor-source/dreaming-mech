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
import QuickInquiry from '@/components/QuickInquiry';
import CardSkeleton from '@/components/ui/CardSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import AnimatedSection from '@/components/animations/AnimatedSection';
import CountUp from '@/components/animations/CountUp';
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
      <div className="h-20 sm:h-28 md:h-36 bg-gradient-to-b from-black/60 via-black/20 via-40% to-bg-secondary" />

      {/* 신뢰 지표 섹션 */}
      <section className="bg-bg-secondary py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {[
                { value: mechanics.length, suffix: '곳+', label: '검증된 정비소' },
                { value: 5.3, suffix: '만', label: '유튜브 구독자', decimals: 1 },
                { value: totalClicks, suffix: '+', label: '누적 조회수' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-[var(--text-h3)] sm:text-[var(--text-h2)] md:text-[var(--text-h1)] font-black text-brand-500">
                    <CountUp end={stat.value} duration={1800} delay={i * 200} suffix={stat.suffix} decimals={stat.decimals || 0} />
                  </p>
                  <p className="text-[var(--text-caption)] sm:text-[var(--text-body)] text-text-tertiary font-medium mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 빠른 문의 섹션 */}
      <QuickInquiry
        mechanics={mechanics}
        onSelectMechanic={openModal}
      />

      {/* 이용 방법 섹션 */}
      <section className="bg-white py-16 sm:py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center mb-10 sm:mb-14">
              <p className="text-accent-500 text-[var(--text-caption)] font-semibold tracking-[0.12em] uppercase mb-3">
                HOW IT WORKS
              </p>
              <h2 className="text-[var(--text-h3)] sm:text-[var(--text-h2)] font-black text-text-primary">
                간단한 3단계로 시작하세요
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: '지역 선택',
                desc: '지도에서 원하는 지역을 탭하세요',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: '정비소 확인',
                desc: '검증된 정비소의 상세 정보를 확인하세요',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: '견적 요청',
                desc: '간편하게 견적을 요청하고 연락받으세요',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <AnimatedSection key={i} animation="slideUp" delay={i * 0.15} duration={0.6}>
                <div className="relative bg-bg-secondary rounded-2xl p-6 sm:p-8 text-center
                  border border-transparent hover:border-brand-200 hover:shadow-[var(--shadow-md)]
                  transition-all duration-[var(--duration-slow)] group">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-50 text-brand-500
                    flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white
                    transition-colors duration-[var(--duration-slow)]">
                    {item.icon}
                  </div>
                  <p className="text-[var(--text-caption)] font-bold text-brand-400 mb-2">{item.step}</p>
                  <h3 className="text-[var(--text-h5)] sm:text-[var(--text-h4)] font-bold text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-caption)] sm:text-[var(--text-body)] text-text-tertiary">
                    {item.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 정비사 목록 섹션 */}
      <section id="map" className="bg-bg-secondary py-16 sm:py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          {/* 섹션 헤더 — Hims 스타일: 임팩트 카피 */}
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <p className="text-accent-500 text-[var(--text-caption)] font-semibold tracking-[0.12em] uppercase mb-3 sm:mb-4">
                FIND YOUR MECHANIC
              </p>
              <h2 className="text-[var(--text-h2)] md:text-[var(--text-h1)] font-black text-text-primary mb-3 sm:mb-4">
                믿을 수 있는 <span className="text-brand-500">정비소</span>, 한눈에
              </h2>
              <p className="text-text-tertiary text-[var(--text-body)] md:text-[var(--text-h5)] max-w-xl mx-auto">
                지도에서 지역을 선택하면 검증된 정비소를 바로 확인할 수 있어요
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
          <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 mt-12">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="정비소명 또는 지역 검색..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)]"
              />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="sm:w-48 px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary appearance-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)]"
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
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
                className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8"
              >
                {filteredMechanics.map((mechanic, index) => (
                  <AnimatedSection
                    key={mechanic.id}
                    animation="slideUp"
                    delay={index * 0.08}
                    duration={0.6}
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

      {/* 타이어 문의 CTA */}
      <section className="bg-white py-14 sm:py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <h2 className="text-[var(--text-h3)] sm:text-[var(--text-h2)] font-black text-text-primary mb-3 sm:mb-4">
              타이어 교체, 어디서 하지?
            </h2>
            <p className="text-[var(--text-body)] sm:text-[var(--text-h5)] text-text-tertiary mb-8 sm:mb-10">
              지역과 타이어 사이즈만 입력하면<br className="sm:hidden" /> 검증된 정비소를 매칭해드려요
            </p>
            <a
              href="/tire-inquiry"
              className="inline-flex items-center gap-2.5 bg-accent-500 text-white rounded-full
                font-bold px-8 sm:px-10 py-4 sm:py-5
                text-[var(--text-body)] sm:text-[var(--text-h5)]
                shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)]
                hover:bg-accent-600 transition-all duration-[var(--duration-normal)]"
            >
              무료 견적 받기
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* 정비사 모집 CTA 배너 */}
      <section className="bg-brand-500 py-14 sm:py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <h2 className="text-[var(--text-h3)] sm:text-[var(--text-h2)] font-black text-white mb-3 sm:mb-4">
              정비사 사장님이신가요?
            </h2>
            <p className="text-[var(--text-body)] sm:text-[var(--text-h5)] text-white/70 mb-8 sm:mb-10">
              꿈꾸는정비사에 정비소를 등록하고<br className="sm:hidden" /> 더 많은 고객을 만나보세요
            </p>
            <a
              href="/for-mechanics"
              className="inline-flex items-center gap-2.5 bg-white text-brand-600 rounded-full
                font-bold px-8 sm:px-10 py-4 sm:py-5
                text-[var(--text-body)] sm:text-[var(--text-h5)]
                shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)]
                hover:bg-brand-50 transition-all duration-[var(--duration-normal)]"
            >
              무료로 등록하기
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* 모달 */}
      <MechanicModal />
    </Layout>
  );
}
