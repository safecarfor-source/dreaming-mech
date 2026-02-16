'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

          {/* 모달 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-16 bg-white rounded-t-3xl z-50 overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-gray-900 break-words min-w-0 flex-1">
                  {sanitizeText(mechanic.name)}
                </h2>
                {mechanic.isVerified && (
                  <BadgeCheck size={24} className="text-blue-500 flex-shrink-0" />
                )}
              </div>
              <button
                onClick={close}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {/* 대표 이미지 */}
                {mechanic.mainImageUrl && (
                  <div className="rounded-2xl overflow-hidden bg-gray-100 mx-auto w-[90%] md:w-[50%]">
                    <img
                      src={mechanic.mainImageUrl}
                      alt={sanitizeText(mechanic.name)}
                      className="w-full object-contain"
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
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-start gap-3 md:gap-5">
                      <div className="p-2 md:p-4 bg-gray-100 rounded-lg md:rounded-xl flex-shrink-0">
                        <MapPin size={20} className="text-gray-500 md:hidden" />
                        <MapPin size={48} className="text-gray-500 hidden md:block" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-2xl text-gray-500">주소</p>
                        <p className="text-gray-900 font-medium md:text-2xl break-words">{sanitizeText(mechanic.address)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:gap-5">
                      <div className="p-2 md:p-4 bg-gray-100 rounded-lg md:rounded-xl flex-shrink-0">
                        <Phone size={20} className="text-gray-500 md:hidden" />
                        <Phone size={48} className="text-gray-500 hidden md:block" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-2xl text-gray-500">전화번호</p>
                        <a
                          href={`tel:${sanitizePhone(mechanic.phone)}`}
                          className="text-gray-500 font-medium md:text-2xl hover:underline break-all"
                        >
                          {sanitizePhone(mechanic.phone)}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 소개 */}
                  {mechanic.description && (
                    <div className="p-6 md:p-8 bg-gray-50 rounded-2xl">
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">소개</h3>
                      <p className="text-gray-600 md:text-xl leading-relaxed md:leading-relaxed break-words whitespace-pre-wrap">{sanitizeBasicHTML(mechanic.description)}</p>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-4">위치</h3>
                  <NaverMapView
                    lat={mechanic.mapLat}
                    lng={mechanic.mapLng}
                    name={sanitizeText(mechanic.name)}
                  />
                </div>

                {/* 유튜브 롱폼 (가로 영상) */}
                {mechanic.youtubeLongUrl && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">소개 영상</h3>
                    <YouTubeEmbed url={mechanic.youtubeLongUrl} variant="long" />
                  </div>
                )}

                {/* 유튜브 숏폼 (세로 영상) */}
                {mechanic.youtubeUrl && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">숏폼 영상</h3>
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
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <QuoteRequestForm
                          mechanicId={mechanic.id}
                          mechanicName={mechanic.name}
                          onClose={() => setShowQuoteForm(false)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA 버튼 */}
                <div className="flex gap-3">
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="flex-1 bg-[#bf00ff] hover:bg-[#a600e0] text-white py-4 rounded-xl font-bold text-center transition-colors"
                  >
                    전화 문의
                  </a>
                  <button
                    onClick={() => setShowQuoteForm(!showQuoteForm)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-colors ${
                      showQuoteForm
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <FileText size={18} />
                    {showQuoteForm ? '닫기' : '견적 요청'}
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://map.naver.com/v5/search/${encodeURIComponent(mechanic.address)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#bf00ff] hover:text-purple-600 transition-colors"
                  >
                    <ExternalLink size={18} />
                    길찾기
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
