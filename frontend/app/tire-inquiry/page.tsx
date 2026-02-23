'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Phone, MapPin, Image as ImageIcon, Car, ChevronDown, X, MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { uploadApi, mechanicsApi, tireInquiryApi } from '@/lib/api';
import type { Mechanic } from '@/types';

const REGIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

const SERVICE_TYPES = [
  { value: 'REPLACEMENT', label: '타이어 교체' },
  { value: 'REPAIR', label: '펑크 수리' },
  { value: 'ALIGNMENT', label: '얼라인먼트' },
  { value: 'INSPECTION', label: '타이어 점검' },
];

export default function TireInquiryPage() {
  // 폼 상태
  const [region, setRegion] = useState('');
  const [subRegion, setSubRegion] = useState('');
  const [tireSize, setTireSize] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [carModel, setCarModel] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 성공 화면용
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length >= 3) {
      alert('사진은 최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).slice(0, 3 - images.length).map((file) =>
        uploadApi.uploadImage(file)
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map((res) => res.data.url);
      setImages((prev) => [...prev, ...urls]);
    } catch {
      alert('사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region.trim() || !tireSize.trim()) {
      alert('지역과 타이어 사이즈는 필수입니다.');
      return;
    }

    // 타이어 사이즈 검증
    const tireSizeRegex = /^\d{3}\/\d{2}R\d{2}$/;
    if (!tireSizeRegex.test(tireSize.trim())) {
      alert('타이어 사이즈 형식이 올바르지 않습니다. (예: 225/45R17)');
      return;
    }

    setIsSubmitting(true);
    try {
      await tireInquiryApi.create({
        region: region.trim(),
        subRegion: subRegion.trim() || undefined,
        tireSize: tireSize.trim(),
        serviceType: serviceType || undefined,
        carModel: carModel.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        description: description.trim() || undefined,
      });

      // 성공 시 해당 지역 정비소 로드
      const response = await mechanicsApi.getAll();
      const allMechanics = response.data.data || [];
      const filteredMechanics = allMechanics.filter((m) =>
        m.address.includes(region) || m.location.includes(region)
      );
      setMechanics(filteredMechanics);
      setIsSuccess(true);
    } catch {
      alert('타이어 문의 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout>
        <section className="min-h-screen flex flex-col items-center justify-center bg-bg-secondary pt-20 pb-16 px-4">
          <div className="max-w-2xl w-full text-center mb-12">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-brand-500" />
            </div>
            <h2 className="text-[var(--text-h2)] md:text-[var(--text-h1)] font-bold text-text-primary mb-3">
              타이어 문의가 접수되었습니다
            </h2>
            <p className="text-text-tertiary text-[var(--text-body)] md:text-[var(--text-h5)] mb-8">
              빠른 시간 내에 지역 정비소를 매칭해드리겠습니다
            </p>
          </div>

          {/* 해당 지역 정비소 목록 */}
          {mechanics.length > 0 && (
            <div className="max-w-4xl w-full">
              <h3 className="text-[var(--text-h4)] font-bold text-text-primary mb-6">
                {region} 타이어 전문 정비소
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {mechanics.map((mechanic) => (
                  <div
                    key={mechanic.id}
                    className="bg-white rounded-xl p-5 border border-[var(--border)] hover:border-brand-300 hover:shadow-[var(--shadow-md)] transition-all duration-[var(--duration-normal)]"
                  >
                    <h4 className="text-[var(--text-h5)] font-bold text-text-primary mb-2">
                      {mechanic.name}
                    </h4>
                    <p className="text-[var(--text-caption)] text-text-secondary mb-3 flex items-start gap-1.5">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0 text-text-muted" />
                      {mechanic.address}
                    </p>
                    <div className="flex gap-2">
                      {mechanic.kakaoOpenChatUrl ? (
                        <a
                          href={mechanic.kakaoOpenChatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-lg font-semibold text-[var(--text-caption)] transition-colors duration-[var(--duration-fast)]"
                        >
                          <MessageCircle size={16} />
                          카카오톡 문의
                        </a>
                      ) : null}
                      <a
                        href={`tel:${mechanic.phone}`}
                        className={`flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold text-[var(--text-caption)] transition-colors duration-[var(--duration-fast)] ${
                          mechanic.kakaoOpenChatUrl ? 'flex-1' : 'w-full'
                        }`}
                      >
                        <Phone size={16} />
                        전화하기
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => (window.location.href = '/')}
            className="px-8 py-3 bg-text-tertiary hover:bg-text-secondary text-white rounded-xl font-semibold transition-colors duration-[var(--duration-normal)]"
          >
            홈으로 돌아가기
          </button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen bg-bg-secondary pt-20 md:pt-28 pb-16 md:pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-xl">
          {/* 헤더 */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-[var(--text-h2)] md:text-[var(--text-h1)] font-bold text-text-primary mb-2 md:mb-3">
              타이어 무료 견적
            </h1>
            <p className="text-text-tertiary text-[var(--text-caption)] md:text-[var(--text-body)]">
              지역과 타이어 사이즈만 입력하면 검증된 정비소를 매칭해드려요
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* 지역 선택 */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-2">
                <MapPin size={16} className="text-text-muted" />
                지역 <span className="text-accent-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary appearance-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)]"
                >
                  <option value="">시/도 선택</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            {/* 시/군/구 (선택) */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-2">
                시/군/구 (선택)
              </label>
              <input
                type="text"
                value={subRegion}
                onChange={(e) => setSubRegion(e.target.value)}
                placeholder="예: 강남구"
                className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)]"
              />
            </div>

            {/* 타이어 사이즈 */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-2">
                <Car size={16} className="text-text-muted" />
                타이어 사이즈 <span className="text-accent-500">*</span>
              </label>
              <input
                type="text"
                value={tireSize}
                onChange={(e) => setTireSize(e.target.value)}
                placeholder="225/45R17"
                required
                className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)]"
              />
              <p className="text-[var(--text-caption)] text-text-tertiary mt-1.5">
                타이어 옆면에서 확인 가능. 예: 225/45R17
              </p>
            </div>

            {/* 서비스 종류 */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-3">
                서비스 종류 (선택)
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setServiceType(serviceType === type.value ? '' : type.value)}
                    className={`px-4 py-2 rounded-full text-[var(--text-caption)] font-medium transition-all duration-[var(--duration-fast)] ${
                      serviceType === type.value
                        ? 'bg-brand-500 text-white shadow-[var(--shadow-sm)]'
                        : 'bg-white text-text-secondary border border-[var(--border)] hover:border-brand-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 차종 */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-2">
                차종 (선택)
              </label>
              <input
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                placeholder="예: 현대 아반떼 CN7"
                className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)]"
              />
            </div>

            {/* 사진 업로드 */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-2">
                <ImageIcon size={16} className="text-text-muted" />
                타이어 사진 (선택, 최대 3장)
              </label>

              {images.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {images.map((url, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={url} alt={`타이어 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 3 && (
                <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-dashed border-[var(--border)] hover:border-brand-300 rounded-xl text-text-tertiary cursor-pointer transition-colors duration-[var(--duration-fast)]">
                  <ImageIcon size={18} />
                  <span className="text-[var(--text-caption)] md:text-[var(--text-body)]">
                    {uploading ? '업로드 중...' : '사진 선택'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 추가 설명 */}
            <div>
              <label className="flex items-center gap-2 text-[var(--text-caption)] md:text-[var(--text-body)] font-medium text-text-primary mb-2">
                추가 설명 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="타이어 상태나 요청 사항을 자유롭게 작성해주세요."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors duration-[var(--duration-fast)] resize-none"
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl font-semibold text-[var(--text-body)] md:text-[var(--text-h5)] transition-colors duration-[var(--duration-normal)]"
            >
              {isSubmitting ? (
                '접수 중...'
              ) : (
                <>
                  <Send size={20} />
                  무료 견적 받기
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
