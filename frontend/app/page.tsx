'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { mechanicsApi } from '@/lib/api';
import { useModalStore } from '@/lib/store';
import {
  countMechanicsByRegion,
  getMechanicsByRegion,
  getRegionById,
} from '@/lib/regionMap';
import { POPULAR_REGIONS, searchRegions } from '@/lib/regions';
import type { Region } from '@/lib/regions';
import Layout from '@/components/Layout';
import KoreaMap from '@/components/KoreaMap';
import MechanicCard from '@/components/MechanicCard';
import MechanicModal from '@/components/MechanicModal';
import CardSkeleton from '@/components/ui/CardSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import AnimatedSection from '@/components/animations/AnimatedSection';
import type { Mechanic, ServiceType } from '@/types';

const SERVICE_OPTIONS = [
  { type: 'TIRE' as ServiceType, label: '타이어', icon: '🛞' },
  { type: 'OIL' as ServiceType, label: '엔진오일', icon: '🛢️' },
  { type: 'BRAKE' as ServiceType, label: '브레이크', icon: '🔴' },
  { type: 'MAINTENANCE' as ServiceType, label: '경정비', icon: '🔧' },
  { type: 'CONSULT' as ServiceType, label: '종합상담', icon: '💬' },
];

// URL 파라미터 체크 컴포넌트
function InquiryStatusChecker({ setStep }: { setStep: (step: 1 | 2 | 3 | 4) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const inquiryStatus = searchParams.get('inquiry');
    if (inquiryStatus === 'success') {
      setStep(4);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router, setStep]);

  return null;
}

function HomeContent() {
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMechanicRegion, setSelectedMechanicRegion] = useState<string | null>(null);
  const openModal = useModalStore((state) => state.open);
  const mechanicListRef = useRef<HTMLDivElement>(null);

  // 퍼널 상태
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [regionSearchQuery, setRegionSearchQuery] = useState('');

  // 지역 검색 결과
  const regionSearchResults = useMemo(() => {
    if (!regionSearchQuery) return [];
    return searchRegions(regionSearchQuery);
  }, [regionSearchQuery]);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mechanicsApi.getAll();
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
    if (!selectedMechanicRegion) return mechanics;
    return getMechanicsByRegion(mechanics, selectedMechanicRegion);
  }, [mechanics, selectedMechanicRegion]);

  // 선택된 지역 정보
  const selectedRegionInfo = selectedMechanicRegion
    ? getRegionById(selectedMechanicRegion)
    : null;

  const handleRegionClick = (regionId: string) => {
    const newRegion = regionId === selectedMechanicRegion ? null : regionId;
    setSelectedMechanicRegion(newRegion);

    if (newRegion && mechanicListRef.current) {
      setTimeout(() => {
        mechanicListRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

  // 전화번호 자동 포맷
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  // Step 1: 지역 선택
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setRegionSearchQuery('');
    setStep(2);
  };

  // Step 2: 서비스 선택
  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setStep(3);
  };

  // Step 3: 카카오 로그인 후 접수
  const handleSubmit = () => {
    if (!selectedRegion || !selectedService || !phone) return;

    // sessionStorage에 데이터 저장
    const tempData = {
      regionSido: selectedRegion.sido,
      regionSigungu: selectedRegion.sigungu,
      serviceType: selectedService,
      phone: phone.replace(/[^\d]/g, ''),
      description: description || undefined,
    };
    sessionStorage.setItem('temp-inquiry-data', JSON.stringify(tempData));

    // 카카오 로그인으로 이동
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/auth/kakao/customer`;
  };

  const resetFunnel = () => {
    setStep(1);
    setSelectedRegion(null);
    setSelectedService(null);
    setPhone('');
    setDescription('');
    setRegionSearchQuery('');
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#7C4DFF] to-[#5B2FC2] text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-[#FBBF24] text-sm md:text-base font-semibold tracking-widest mb-4">
              꿈꾸는정비사 52K 구독자 직접 검증
            </p>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              전국 검증 정비소를<br />연결해드립니다
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              타이어부터 경정비까지, 믿을 수 있는 정비소를 빠르게 찾아드립니다
            </p>
            <button
              onClick={() => {
                const funnelEl = document.getElementById('inquiry-funnel');
                funnelEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#FBBF24] text-gray-900 px-8 py-4 rounded-full text-lg font-bold
                hover:bg-[#F59E0B] transition-all transform hover:scale-105 shadow-xl"
            >
              바로 시작하기
            </button>
          </motion.div>
        </div>
      </section>

      {/* 다크 → 라이트 그라데이션 전환 */}
      <div className="h-16 md:h-24 bg-gradient-to-b from-[#5B2FC2] via-[#7C4DFF]/30 to-[#F8F7FC]" />

      {/* 문의 퍼널 섹션 */}
      <section id="inquiry-funnel" className="bg-[#F8F7FC] py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          {/* 스텝 인디케이터 */}
          <div className="flex items-center justify-center mb-8 md:mb-12 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all ${
                    step >= s
                      ? 'bg-[#7C4DFF] text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-8 md:w-12 h-1 mx-1 transition-all ${
                      step > s ? 'bg-[#7C4DFF]' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
              >
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                  어느 지역이신가요?
                </h2>
                <p className="text-gray-500 mb-6">정비소를 찾고 계신 지역을 선택해주세요</p>

                {/* 검색창 */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={regionSearchQuery}
                    onChange={(e) => setRegionSearchQuery(e.target.value)}
                    placeholder="지역명 검색 (예: 수원시, 강남구)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#7C4DFF] focus:outline-none"
                  />
                  {regionSearchResults.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {regionSearchResults.map((region, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRegionSelect(region)}
                          className="w-full text-left px-4 py-3 hover:bg-[#F5F3FF] transition-colors border-b border-gray-100 last:border-0"
                        >
                          {region.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 인기 지역 칩 */}
                <p className="text-sm font-semibold text-gray-700 mb-3">인기 지역</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {POPULAR_REGIONS.slice(0, 8).map((region, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRegionSelect(region)}
                      className="px-4 py-3 border-2 border-[#7C4DFF] text-[#7C4DFF] rounded-lg
                        hover:bg-[#7C4DFF] hover:text-white transition-all font-semibold text-sm"
                    >
                      {region.display}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
              >
                <button
                  onClick={() => setStep(1)}
                  className="text-[#7C4DFF] text-sm font-semibold mb-4 hover:underline"
                >
                  ← 지역 변경
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                  어떤 서비스가 필요하신가요?
                </h2>
                <p className="text-gray-500 mb-6">
                  선택하신 지역: <span className="font-bold text-[#7C4DFF]">{selectedRegion?.display}</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SERVICE_OPTIONS.map((service) => (
                    <button
                      key={service.type}
                      onClick={() => handleServiceSelect(service.type)}
                      className="p-6 border-2 border-gray-300 rounded-xl hover:border-[#7C4DFF] hover:bg-[#F5F3FF]
                        transition-all group"
                    >
                      <div className="text-4xl mb-2">{service.icon}</div>
                      <div className="text-lg font-bold text-gray-900 group-hover:text-[#7C4DFF]">
                        {service.label}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
              >
                <button
                  onClick={() => setStep(2)}
                  className="text-[#7C4DFF] text-sm font-semibold mb-4 hover:underline"
                >
                  ← 서비스 변경
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                  연락처를 입력해주세요
                </h2>
                <p className="text-gray-500 mb-6">
                  {selectedRegion?.display} · {SERVICE_OPTIONS.find(s => s.type === selectedService)?.label}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      전화번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000"
                      maxLength={13}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#7C4DFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      추가 설명 (선택)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="예: 타이어 사이즈, 차량 모델 등"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#7C4DFF] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!phone || phone.length < 12}
                    className="w-full bg-[#FEE500] text-gray-900 px-6 py-4 rounded-lg font-bold text-lg
                      hover:bg-[#FDD835] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    카카오로 문의 접수
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    카카오 로그인 후 문의가 접수됩니다
                  </p>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center"
              >
                <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                  문의 접수 완료!
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  꿈꾸는정비사가 빠르게 연락드리겠습니다
                </p>

                <div className="bg-[#F5F3FF] rounded-xl p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">접수 내용</p>
                  <div className="space-y-1 text-left">
                    <p className="font-semibold">📍 지역: {selectedRegion?.display || '확인 중'}</p>
                    <p className="font-semibold">
                      🔧 서비스: {SERVICE_OPTIONS.find(s => s.type === selectedService)?.label || '확인 중'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetFunnel}
                  className="bg-[#7C4DFF] text-white px-8 py-3 rounded-lg font-bold
                    hover:bg-[#6D3FE0] transition-all"
                >
                  새로운 문의하기
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 신뢰 요소 섹션 */}
      <section className="bg-white py-12 md:py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-[#F5F3FF] px-4 py-2 rounded-full mb-4">
              <p className="text-[#7C4DFF] font-bold text-sm">
                YouTube 52,000+ 구독자
              </p>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
              꿈꾸는정비사가 직접 검증한 정비소
            </h3>
            <p className="text-gray-600 leading-relaxed">
              20년 경력 정비사가 직접 방문하고, 실력을 검증한 정비소만 소개합니다.<br />
              합리적인 가격과 정직한 정비를 약속드립니다.
            </p>
          </div>
        </div>
      </section>

      {/* 다크 → 라이트 그라데이션 전환 */}
      <div className="h-16 md:h-20 bg-gradient-to-b from-white via-gray-100 to-[#F8F7FC]" />

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
              selectedRegion={selectedMechanicRegion}
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
                  onClick={() => setSelectedMechanicRegion(null)}
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
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchMechanics} />
          ) : filteredMechanics.length === 0 && selectedMechanicRegion ? (
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
                key={selectedMechanicRegion || 'all'}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3"
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

      {/* URL 파라미터 체크 */}
      <Suspense fallback={null}>
        <InquiryStatusChecker setStep={setStep} />
      </Suspense>
    </Layout>
  );
}

export default function Home() {
  return <HomeContent />;
}
