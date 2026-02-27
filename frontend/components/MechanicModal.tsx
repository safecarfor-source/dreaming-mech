'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, MapPin, Phone, ExternalLink, FileText, BadgeCheck } from 'lucide-react';
import { useModalStore } from '@/lib/store';
import { mechanicsApi } from '@/lib/api';
import { sanitizeText, sanitizeBasicHTML, sanitizePhone } from '@/lib/sanitize';
import NaverMapView from './NaverMapView';
import YouTubeEmbed from './YouTubeEmbed';
import OperatingStatusBadge from './mechanic-detail/OperatingStatusBadge';
import SpecialtyTags from './mechanic-detail/SpecialtyTags';
import GalleryCarousel from './mechanic-detail/GalleryCarousel';
import QuickInfoRow from './mechanic-detail/QuickInfoRow';
import ReviewSection from './mechanic-detail/ReviewSection';
import QuoteRequestForm from './mechanic-detail/QuoteRequestForm';

export default function MechanicModal() {
  const { isOpen, mechanic, close } = useModalStore();
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  // 클릭수 증가
  useEffect(() => {
    if (isOpen && mechanic) {
      mechanicsApi.incrementClick(mechanic.id).catch((error) => {
        if (error?.response?.status !== 400) {
          console.error('Failed to increment click:', error);
        }
      });
    }
  }, [isOpen, mechanic]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQuoteForm) {
          setShowQuoteForm(false);
        } else {
          close();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [close, showQuoteForm]);

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 모달 닫힐 때 견적 폼 초기화
  useEffect(() => {
    if (!isOpen) {
      setShowQuoteForm(false);
    }
  }, [isOpen]);

  if (!mechanic) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* 모달 위치 래퍼: 모바일=하단 시트, 데스크탑=화면 가운데 1/3 */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center pointer-events-none">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto w-full bg-white rounded-t-3xl overflow-hidden flex flex-col
              max-h-[calc(100vh-4rem)]
              md:max-h-[85vh] md:w-[28vw] md:min-w-[400px] md:max-w-[480px] md:rounded-2xl md:shadow-[var(--shadow-xl)]"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h2 className="text-[var(--text-h5)] md:text-[var(--text-h4)] font-bold text-text-primary break-words min-w-0 flex-1">
                  {sanitizeText(mechanic.name)}
                </h2>
                {mechanic.isVerified && (
                  <BadgeCheck size={22} className="text-[var(--color-info)] flex-shrink-0" />
                )}
              </div>
              <button
                onClick={close}
                className="p-2 bg-bg-tertiary rounded-full hover:bg-gray-200 transition-colors duration-[var(--duration-fast)] flex-shrink-0"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-auto">
              <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">
                {/* 대표 이미지 — 16:9 비율 */}
                {(mechanic.mainImageUrl || mechanic.galleryImages?.[0]) && (
                  <div className="rounded-xl overflow-hidden bg-bg-tertiary aspect-[2/1] relative">
                    <Image
                      src={mechanic.mainImageUrl || mechanic.galleryImages![0]}
                      alt={sanitizeText(mechanic.name)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                      priority
                    />
                  </div>
                )}

                {/* 갤러리 */}
                {mechanic.galleryImages && mechanic.galleryImages.length > 0 && (
                  <GalleryCarousel
                    images={mechanic.galleryImages}
                    name={sanitizeText(mechanic.name)}
                  />
                )}

                {/* 영업 상태 + 전문분야 */}
                <div className="space-y-3">
                  <OperatingStatusBadge
                    operatingHours={mechanic.operatingHours}
                    holidays={mechanic.holidays}
                  />
                  <SpecialtyTags specialties={mechanic.specialties} />
                </div>

                {/* 기본 정보 */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 bg-bg-secondary rounded-lg flex-shrink-0">
                        <MapPin size={14} className="text-text-tertiary" />
                      </div>
                      <p className="text-[var(--text-body)] text-text-primary font-medium break-words min-w-0 flex-1">
                        {sanitizeText(mechanic.address)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="p-1 bg-bg-secondary rounded-lg flex-shrink-0">
                        <Phone size={14} className="text-text-tertiary" />
                      </div>
                      <a
                        href={`tel:${sanitizePhone(mechanic.phone)}`}
                        className="text-[var(--text-body)] text-brand-500 font-medium hover:underline break-all"
                      >
                        {sanitizePhone(mechanic.phone)}
                      </a>
                    </div>
                  </div>

                  {/* 소개 */}
                  {mechanic.description && (
                    <div className="p-3 sm:p-4 bg-bg-secondary rounded-xl">
                      <h3 className="text-[var(--text-body)] font-bold text-text-primary mb-2">소개</h3>
                      <p className="text-[var(--text-body)] text-text-secondary leading-[1.7] break-words whitespace-pre-wrap">
                        {sanitizeBasicHTML(mechanic.description)}
                      </p>
                    </div>
                  )}
                </div>

                {/* 주차/결제수단 빠른 정보 */}
                <QuickInfoRow
                  parkingAvailable={mechanic.parkingAvailable}
                  paymentMethods={mechanic.paymentMethods}
                />

                {/* 리뷰 섹션 */}
                <ReviewSection
                  reviews={mechanic.reviews}
                  mechanicId={mechanic.id}
                />

                {/* 지도 */}
                <div>
                  <h3 className="text-[var(--text-body)] md:text-[var(--text-h5)] font-bold text-text-primary mb-4">위치</h3>
                  <NaverMapView
                    lat={mechanic.mapLat}
                    lng={mechanic.mapLng}
                    name={sanitizeText(mechanic.name)}
                  />
                </div>

                {/* 유튜브 롱폼 */}
                {mechanic.youtubeLongUrl && (
                  <div>
                    <h3 className="text-[var(--text-body)] md:text-[var(--text-h5)] font-bold text-text-primary mb-4">소개 영상</h3>
                    <YouTubeEmbed url={mechanic.youtubeLongUrl} variant="long" />
                  </div>
                )}

                {/* 유튜브 숏폼 */}
                {mechanic.youtubeUrl && (
                  <div>
                    <h3 className="text-[var(--text-body)] md:text-[var(--text-h5)] font-bold text-text-primary mb-4">숏폼 영상</h3>
                    <YouTubeEmbed url={mechanic.youtubeUrl} variant="short" />
                  </div>
                )}

                {/* 견적 요청 폼 */}
                <AnimatePresence>
                  {showQuoteForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 sm:p-4 bg-bg-secondary rounded-2xl">
                        <QuoteRequestForm
                          mechanicId={mechanic.id}
                          mechanicName={mechanic.name}
                          onClose={() => setShowQuoteForm(false)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA 버튼 — 충분한 여백, 체계적 색상 */}
                <div className="flex gap-3 pt-2">
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white
                      py-2.5 sm:py-3 rounded-xl font-bold text-center text-[var(--text-caption)] md:text-[var(--text-body)]
                      transition-colors duration-[var(--duration-normal)]
                      shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                  >
                    전화 문의
                  </a>
                  <button
                    onClick={() => setShowQuoteForm(!showQuoteForm)}
                    className={`flex-1 flex items-center justify-center gap-2
                      py-2.5 sm:py-3 rounded-xl font-bold text-[var(--text-caption)] md:text-[var(--text-body)]
                      transition-colors duration-[var(--duration-normal)] ${
                      showQuoteForm
                        ? 'bg-bg-tertiary text-text-secondary'
                        : 'bg-accent-500 hover:bg-accent-600 text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]'
                    }`}
                  >
                    <FileText size={16} />
                    {showQuoteForm ? '닫기' : '견적 요청'}
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://map.naver.com/v5/search/${encodeURIComponent(mechanic.address)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2
                      px-4 sm:px-5 py-2.5 sm:py-3
                      border-2 border-[var(--border)] rounded-xl font-bold text-[var(--text-caption)] md:text-[var(--text-body)]
                      text-text-secondary hover:border-brand-500 hover:text-brand-500
                      transition-colors duration-[var(--duration-normal)]"
                  >
                    <ExternalLink size={16} />
                    길찾기
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
