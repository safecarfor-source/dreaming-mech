'use client';

import { useMemo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mechanicsApi, serviceInquiryApi } from '@/lib/api';
import { getTrackingCode } from '@/lib/tracking';
import { gtagEvent } from '@/lib/gtag-events';
import { POPULAR_REGIONS, searchRegions } from '@/lib/regions';
import type { Region } from '@/lib/regions';
import type { ServiceType } from '@/types';

const SERVICE_OPTIONS = [
  { type: 'TIRE' as ServiceType, label: '타이어', icon: '🛞' },
  { type: 'OIL' as ServiceType, label: '엔진오일', icon: '🛢️' },
  { type: 'BRAKE' as ServiceType, label: '브레이크', icon: '🔴' },
  { type: 'MAINTENANCE' as ServiceType, label: '경정비', icon: '🔧' },
  { type: 'CONSULT' as ServiceType, label: '종합상담', icon: '💬' },
];

interface ServiceInquiryFunnelProps {
  /** 컴팩트 모드: 소개 페이지 임베드용 (패딩 축소, 배경색 투명) */
  compact?: boolean;
  /** 완료 후 콜백 */
  onComplete?: () => void;
}

export default function ServiceInquiryFunnel({ compact = false, onComplete }: ServiceInquiryFunnelProps) {
  // 퍼널 상태
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [regionSearchQuery, setRegionSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState<number | null>(null);
  const [localMechanics, setLocalMechanics] = useState<Array<{ id: number; name: string; address: string; location: string }>>([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  // 지역 검색 결과
  const regionSearchResults = useMemo(() => {
    if (!regionSearchQuery) return [];
    return searchRegions(regionSearchQuery);
  }, [regionSearchQuery]);

  // STEP3 진입 시 지역 정비소 로드
  useEffect(() => {
    if (step === 3 && selectedRegion) {
      setLoadingMechanics(true);
      mechanicsApi.getByRegion(selectedRegion.sido, '')
        .then(res => setLocalMechanics(res.data.data || []))
        .catch(() => setLocalMechanics([]))
        .finally(() => setLoadingMechanics(false));
    }
  }, [step, selectedRegion]);

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
    gtagEvent.inquiryStepComplete(1, region.display);
  };

  // Step 2: 서비스 선택
  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setStep(3);
    gtagEvent.inquiryStepComplete(2, selectedRegion?.display, service);
  };

  // Step 3: 접수
  const handleSubmit = async () => {
    if (!selectedRegion || !selectedService || !phone || !privacyAgreed) return;
    setSubmitting(true);
    try {
      const trackingCode = getTrackingCode() || undefined;
      await serviceInquiryApi.create({
        name: name || undefined,
        regionSido: selectedRegion.sido,
        regionSigungu: selectedRegion.sigungu,
        serviceType: selectedService,
        phone: phone.replace(/[^\d]/g, ''),
        vehicleNumber: vehicleNumber.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        description: description || undefined,
        trackingCode,
        ...(selectedMechanicId && { mechanicId: selectedMechanicId }),
      });
      setStep(4);
      // GA4 전환 이벤트: 문의 접수 완료
      gtagEvent.inquiryStepComplete(3, selectedRegion.display, selectedService);
      gtagEvent.inquirySubmit({
        serviceType: selectedService,
        region: `${selectedRegion.sido} ${selectedRegion.sigungu}`,
        hasTrackingCode: !!trackingCode,
        hasMechanicId: !!selectedMechanicId,
      });
      onComplete?.();
    } catch (error) {
      console.error('문의 접수 실패:', error);
      alert('문의 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFunnel = () => {
    setStep(1);
    setSelectedRegion(null);
    setSelectedService(null);
    setPhone('');
    setName('');
    setDescription('');
    setVehicleNumber('');
    setVehicleModel('');
    setPrivacyAgreed(false);
    setRegionSearchQuery('');
    setSelectedMechanicId(null);
    setLocalMechanics([]);
  };

  const cardClass = compact
    ? 'bg-white rounded-2xl shadow-md p-5 md:p-7'
    : 'bg-white rounded-2xl shadow-lg p-6 md:p-8';

  return (
    <div className={compact ? '' : 'max-w-4xl mx-auto'}>
      {/* 스텝 인디케이터 */}
      <div className="flex items-center justify-center mb-6 md:mb-8 gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all ${
                step >= s
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`w-8 md:w-12 h-1 mx-1 transition-all ${
                  step > s ? 'bg-brand-500' : 'bg-gray-300'
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
            className={cardClass}
          >
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
              어느 지역이신가요?
            </h2>
            <p className="text-gray-500 text-sm mb-5">정비소를 찾고 계신 지역을 선택해주세요</p>

            {/* 검색창 */}
            <div className="relative mb-5">
              <input
                type="text"
                value={regionSearchQuery}
                onChange={(e) => setRegionSearchQuery(e.target.value)}
                placeholder="지역명 검색 (예: 수원시, 강남구)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-brand-500 outline-none transition-all"
              />
              {regionSearchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                  {regionSearchResults.map((region, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRegionSelect(region)}
                      className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-gray-100 last:border-0"
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
                  className="px-4 py-3 border border-brand-500/30 text-brand-500 rounded-xl
                    hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all font-semibold text-sm"
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
            className={cardClass}
          >
            <button
              onClick={() => setStep(1)}
              className="text-brand-500 text-sm font-semibold mb-4 hover:underline"
            >
              ← 지역 변경
            </button>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
              어떤 서비스가 필요하신가요?
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              선택하신 지역: <span className="font-bold text-brand-500">{selectedRegion?.display}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVICE_OPTIONS.map((service) => (
                <button
                  key={service.type}
                  onClick={() => handleServiceSelect(service.type)}
                  className="p-5 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 hover:shadow-md
                    transition-all group"
                >
                  <div className="text-3xl mb-1.5">{service.icon}</div>
                  <div className="text-base font-bold text-gray-900 group-hover:text-brand-500">
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
            className={cardClass}
          >
            <button
              onClick={() => setStep(2)}
              className="text-brand-500 text-sm font-semibold mb-4 hover:underline"
            >
              ← 서비스 변경
            </button>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
              연락처를 입력해주세요
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              {selectedRegion?.display} · {SERVICE_OPTIONS.find(s => s.type === selectedService)?.label}
            </p>

            <div className="space-y-4">
              {/* 정비소 선택 (선택사항) */}
              {localMechanics.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    원하는 정비소 선택 <span className="text-gray-400 font-normal">(선택사항)</span>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedMechanicId(null)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm ${
                        selectedMechanicId === null
                          ? 'border-2 border-brand-500 bg-brand-50 text-brand-500 font-semibold'
                          : 'border border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      🏪 선택 안함 (가장 빠른 정비소 연결)
                    </button>
                    {localMechanics.map((mechanic) => (
                      <button
                        key={mechanic.id}
                        type="button"
                        onClick={() => setSelectedMechanicId(mechanic.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          selectedMechanicId === mechanic.id
                            ? 'border-2 border-brand-500 bg-brand-50'
                            : 'border border-gray-200 hover:border-brand-500 hover:bg-brand-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🔧</span>
                          <div>
                            <p className={`font-semibold text-sm ${selectedMechanicId === mechanic.id ? 'text-brand-500' : 'text-gray-800'}`}>
                              {mechanic.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{mechanic.address}</p>
                          </div>
                          {selectedMechanicId === mechanic.id && (
                            <span className="ml-auto text-brand-500">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedMechanicId && (
                    <p className="text-xs text-brand-500 mt-1">
                      ✓ 선택하신 정비소에 직접 문의가 전달됩니다
                    </p>
                  )}
                </div>
              )}

              {/* 로딩 상태 */}
              {loadingMechanics && (
                <div className="text-sm text-gray-400 py-2 text-center">정비소 목록 불러오는 중...</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름 (선택)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-brand-500 outline-none transition-all"
                />
              </div>

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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  차량번호 (선택)
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="예: 12가 3456"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  차종 (선택)
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="예: 현대 아반떼, 기아 K5"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  추가 설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="예: 타이어 사이즈, 증상 등"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>

              {/* 개인정보 수집 동의 */}
              <div
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  privacyAgreed ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => setPrivacyAgreed(!privacyAgreed)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                    privacyAgreed ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'
                  }`}>
                    {privacyAgreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      개인정보 수집·이용 동의 <span className="text-red-500">(필수)</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      수집 항목: 이름, 전화번호, 차량 정보<br />
                      이용 목적: 정비사 매칭 및 상담 연결<br />
                      보유 기간: 서비스 종료 시까지<br />
                      <span className="text-gray-400">※ 전화번호는 근처 검증된 정비사에게만 제공됩니다</span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!phone || phone.length < 12 || !privacyAgreed || submitting}
                className="w-full bg-brand-500 text-white px-6 py-4 rounded-xl font-bold text-lg
                  hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 shadow-lg"
              >
                {submitting ? (
                  <span>접수 중...</span>
                ) : (
                  <>
                    <span>📋</span>
                    문의 접수하기
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                전화번호로 빠르게 연락드리겠습니다
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
            className={`${cardClass} text-center`}
          >
            <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
              문의 접수 완료!
            </h2>
            <p className="text-base text-gray-600 mb-6">
              꿈꾸는정비사가 빠르게 연락드리겠습니다
            </p>

            <div className="bg-brand-50 rounded-xl p-5 mb-5">
              <p className="text-sm text-gray-600 mb-2">접수 내용</p>
              <div className="space-y-1 text-left">
                <p className="font-semibold">📍 지역: {selectedRegion?.display || '확인 중'}</p>
                <p className="font-semibold">
                  🔧 서비스: {SERVICE_OPTIONS.find(s => s.type === selectedService)?.label || '확인 중'}
                </p>
              </div>
            </div>

            {/* 카카오 오픈채팅 */}
            <a
              href={process.env.NEXT_PUBLIC_KAKAO_OPENCHAT_URL || 'https://open.kakao.com/o/gXXXXXX'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#FEE500] text-gray-900
                px-6 py-4 rounded-xl font-bold text-base hover:bg-[#FDD835] transition-all mb-3"
            >
              <span className="text-xl">💬</span>
              <span>카카오 오픈채팅 참여하기</span>
              <span className="text-xs font-normal text-gray-600 ml-1">진행상황 안내</span>
            </a>

            <button
              onClick={resetFunnel}
              className="bg-brand-500 text-white px-8 py-3 rounded-lg font-bold
                hover:bg-brand-600 transition-all w-full"
            >
              새로운 문의하기
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              오픈채팅 참여 시 빠른 답변을 받으실 수 있습니다
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
