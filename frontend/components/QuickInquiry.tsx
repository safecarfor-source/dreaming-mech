'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  CircleDot,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Users,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AnimatedSection from '@/components/animations/AnimatedSection';
import { REGIONS, getMechanicsByRegion, countMechanicsByRegion } from '@/lib/regionMap';
import { quoteRequestApi } from '@/lib/api';
import type { Mechanic } from '@/types';

interface QuickInquiryProps {
  mechanics: Mechanic[];
  onSelectMechanic: (mechanic: Mechanic) => void;
}

type Category = 'repair' | 'tire' | 'find' | 'other';
type Step = 'category' | 'region' | 'mechanics';

interface FormData {
  customerName: string;
  customerPhone: string;
  carModel: string;
  description: string;
}

export default function QuickInquiry({ mechanics, onSelectMechanic }: QuickInquiryProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerPhone: '',
    carModel: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const mechanicCounts = countMechanicsByRegion(mechanics);

  const categories = [
    { id: 'repair' as Category, label: '정비 견적이 궁금해요', icon: Wrench },
    { id: 'tire' as Category, label: '타이어 교체/수리', icon: CircleDot },
    { id: 'find' as Category, label: '가까운 정비소 찾기', icon: MapPin },
    { id: 'other' as Category, label: '기타 문의하기', icon: MessageCircle },
  ];

  const handleCategoryClick = (categoryId: Category) => {
    if (categoryId === 'tire') {
      router.push('/tire-inquiry');
      return;
    }
    if (categoryId === 'other') {
      router.push('/inquiry');
      return;
    }
    setSelectedCategory(categoryId);
    setStep('region');
  };

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId);
    setStep('mechanics');
  };

  const handleBack = () => {
    if (step === 'region') {
      setStep('category');
      setSelectedCategory(null);
    } else if (step === 'mechanics') {
      setStep('region');
      setSelectedRegion(null);
      setShowBulkForm(false);
      setSubmitSuccess(false);
    }
  };

  const handleReset = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedRegion(null);
    setShowBulkForm(false);
    setSubmitSuccess(false);
    setFormData({
      customerName: '',
      customerPhone: '',
      carModel: '',
      description: '',
    });
  };

  const handleBulkQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRegion) return;

    // 입력 검증
    if (formData.description.length < 10) {
      alert('증상/요청 내용을 최소 10자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const regionMechanics = getMechanicsByRegion(mechanics, selectedRegion);

      // 모든 정비소에 견적 요청
      const promises = regionMechanics.map((mechanic) =>
        quoteRequestApi.create({
          mechanicId: mechanic.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          carModel: formData.carModel,
          description: formData.description,
        })
      );

      await Promise.all(promises);

      setSubmitSuccess(true);
    } catch (error) {
      console.error('견적 요청 실패:', error);
      alert('견적 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regionMechanics = selectedRegion ? getMechanicsByRegion(mechanics, selectedRegion) : [];
  const selectedRegionData = selectedRegion ? REGIONS.find(r => r.id === selectedRegion) : null;

  return (
    <section className="bg-white py-16 sm:py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Section header */}
        <AnimatedSection animation="slideUp" duration={0.7}>
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-accent-500 text-[var(--text-caption)] font-semibold tracking-[0.12em] uppercase mb-3">
              QUICK INQUIRY
            </p>
            <h2 className="text-[var(--text-h3)] sm:text-[var(--text-h2)] font-black text-text-primary">
              어떤게 궁금하신가요?
            </h2>
          </div>
        </AnimatedSection>

        {/* Steps content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="group bg-bg-secondary hover:border-brand-200 border-2 border-transparent rounded-2xl p-6 sm:p-8 transition-all duration-[var(--duration-normal)] hover:shadow-[var(--shadow-md)]"
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-50 group-hover:bg-brand-500 text-brand-500 group-hover:text-white flex items-center justify-center transition-all duration-[var(--duration-normal)]">
                          <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <span className="text-[var(--text-h5)] font-bold text-text-primary">
                          {category.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Region Selection */}
          {step === 'region' && (
            <motion.div
              key="region"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-text-tertiary hover:text-brand-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-[var(--text-body)] font-medium">뒤로</span>
                </button>

                {/* Region title */}
                <h3 className="text-[var(--text-h3)] font-bold text-text-primary text-center">
                  어느 지역에서 찾으시나요?
                </h3>

                {/* Region pills */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {REGIONS.map((region) => {
                    const count = mechanicCounts[region.id] || 0;
                    return (
                      <button
                        key={region.id}
                        onClick={() => handleRegionClick(region.id)}
                        disabled={count === 0}
                        className="px-5 py-3 bg-bg-secondary hover:bg-brand-50 hover:border-brand-200 border-2 border-transparent rounded-xl transition-all duration-[var(--duration-fast)] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="text-[var(--text-body)] font-semibold text-text-primary">
                          {region.name}
                        </span>
                        {count > 0 && (
                          <span className="ml-2 text-[var(--text-caption)] text-text-muted">
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Mechanics List + Bulk Quote */}
          {step === 'mechanics' && selectedRegionData && (
            <motion.div
              key="mechanics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-text-tertiary hover:text-brand-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-[var(--text-body)] font-medium">뒤로</span>
                </button>

                {/* Region header */}
                <div className="text-center">
                  <h3 className="text-[var(--text-h3)] font-bold text-text-primary mb-2">
                    {selectedRegionData.fullName}
                  </h3>
                  <p className="text-[var(--text-body)] text-text-tertiary">
                    총 {regionMechanics.length}곳의 정비소
                  </p>
                </div>

                {/* Bulk quote request button */}
                {!submitSuccess && (
                  <button
                    onClick={() => setShowBulkForm(!showBulkForm)}
                    className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-white rounded-2xl font-bold transition-colors duration-[var(--duration-fast)] flex items-center justify-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    전체 견적 요청
                  </button>
                )}

                {/* Bulk quote form */}
                {showBulkForm && !submitSuccess && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleBulkQuoteRequest}
                    className="bg-bg-secondary rounded-2xl p-6 space-y-4"
                  >
                    <h4 className="text-[var(--text-h5)] font-bold text-text-primary mb-4">
                      견적 요청 정보 입력
                    </h4>

                    <div>
                      <label className="block text-[var(--text-body)] font-medium text-text-primary mb-2">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-gray-900 placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                        placeholder="홍길동"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-body)] font-medium text-text-primary mb-2">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-gray-900 placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                        placeholder="010-1234-5678"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-body)] font-medium text-text-primary mb-2">
                        차종 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.carModel}
                        onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-gray-900 placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors"
                        placeholder="예: 현대 아반떼 2020년식"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-body)] font-medium text-text-primary mb-2">
                        증상/요청 내용 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        minLength={10}
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-gray-900 placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors resize-none"
                        placeholder="엔진에서 이상한 소리가 나요. 확인 부탁드립니다."
                      />
                      <p className="text-[var(--text-caption)] text-text-muted mt-2">
                        최소 10자 이상 입력해주세요.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          전송 중...
                        </>
                      ) : (
                        '견적 요청하기'
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Success message */}
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center"
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-[var(--text-h4)] font-bold text-green-900 mb-2">
                      견적 요청 완료!
                    </h4>
                    <p className="text-[var(--text-body)] text-green-700">
                      {selectedRegionData.name} 지역 {regionMechanics.length}곳의 정비소에<br />
                      견적 요청이 전송되었습니다.
                    </p>
                  </motion.div>
                )}

                {/* Individual mechanic list */}
                {!submitSuccess && (
                  <div className="space-y-3">
                    <h4 className="text-[var(--text-h5)] font-bold text-text-primary">
                      개별 정비소 선택
                    </h4>
                    <div className="space-y-2">
                      {regionMechanics.map((mechanic) => (
                        <button
                          key={mechanic.id}
                          onClick={() => onSelectMechanic(mechanic)}
                          className="w-full text-left p-4 bg-bg-secondary hover:bg-brand-50 hover:border-brand-200 border-2 border-transparent rounded-xl transition-all duration-[var(--duration-fast)]"
                        >
                          <div className="font-semibold text-text-primary text-[var(--text-body)] mb-1">
                            {mechanic.name}
                          </div>
                          <div className="text-[var(--text-caption)] text-text-muted">
                            {mechanic.address}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <div className="text-center pt-4">
                  <button
                    onClick={handleReset}
                    className="text-[var(--text-body)] text-text-tertiary hover:text-brand-500 underline transition-colors"
                  >
                    처음부터 다시 하기
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
