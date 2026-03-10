'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, MapPin, ExternalLink, BadgeCheck } from 'lucide-react';
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
import PhoneReveal from './mechanic-detail/PhoneReveal';
import { gtagEvent } from '@/lib/gtag-events';

export default function MechanicModal() {
  const { isOpen, mechanic, close } = useModalStore();

  // 뒤로가기로 모달 닫기 — history.back()이 popstate를 발생시켜 close() 호출
  const handleClose = useCallback(() => {
    history.back();
  }, []);

  // 클릭수 증가 + GA 이벤트
  useEffect(() => {
    if (isOpen && mechanic) {
      gtagEvent.mechanicDetailView(mechanic.id, mechanic.name, mechanic.location || '');
      mechanicsApi.incrementClick(mechanic.id).catch((error) => {
        if (error?.response?.status !== 400) {
          console.error('Failed to increment click:', error);
        }
      });
    }
  }, [isOpen, mechanic]);

  // 브라우저 뒤로가기 연동
  useEffect(() => {
    if (isOpen) {
      history.pushState({ mechanicModal: true }, '');

      const handlePopState = () => {
        close();
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, close]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose, isOpen]);

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
            onClick={handleClose}
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
                onClick={handleClose}
                className="p-2 bg-bg-tertiary rounded-full hover:bg-gray-200 transition-colors duration-[var(--duration-fast)] flex-shrink-0"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-auto">
              <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">

                {/* 대표 이미지 */}
                {(mechanic.mainImageUrl || mechanic.galleryImages?.[0]) && (
                  <div className="rounded-xl overflow-hidden bg-bg-tertiary aspect-[16/9] relative">
                    <Image
                      src={mechanic.mainImageUrl || mechanic.galleryImages![0]}
                      alt={sanitizeText(mechanic.name)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 480px"
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

                {/* 주소 — 가운데 정렬, 크게 */}
                <div className="flex flex-col items-center text-center px-2">
                  <MapPin size={24} className="text-brand-500 mb-2" />
                  <p className="text-[var(--text-h4)] sm:text-[var(--text-h3)] text-text-primary font-bold break-words leading-tight">
                    {sanitizeText(mechanic.address)}
                  </p>
                </div>

                {/* 전화번호 — 1개만, 크고 임팩트있게 */}
                <PhoneReveal
                  mechanicId={mechanic.id}
                  mechanicName={mechanic.name}
                  phone={sanitizePhone(mechanic.phone)}
                  variant="modal"
                />

                {/* 유튜브 영상 — 핵심 상품 영역 */}
                {(mechanic.youtubeLongUrl || mechanic.youtubeUrl) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎬</span>
                      <h3 className="text-[var(--text-h5)] font-bold text-text-primary">영상 소개</h3>
                    </div>
                    {mechanic.youtubeLongUrl && (
                      <YouTubeEmbed url={mechanic.youtubeLongUrl} variant="long" />
                    )}
                    {mechanic.youtubeUrl && (
                      <YouTubeEmbed url={mechanic.youtubeUrl} variant="short" />
                    )}
                  </div>
                )}

                {/* 소개 */}
                {mechanic.description && (
                  <div className="p-3 sm:p-4 bg-bg-secondary rounded-xl">
                    <h3 className="text-[var(--text-body)] font-bold text-text-primary mb-2">소개</h3>
                    <p className="text-[var(--text-body)] text-text-secondary leading-[1.7] break-words whitespace-pre-wrap">
                      {sanitizeBasicHTML(mechanic.description)}
                    </p>
                  </div>
                )}

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

                {/* CTA — 길찾기만 */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const url = `https://map.naver.com/v5/search/${encodeURIComponent(mechanic.address)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full flex items-center justify-center gap-2
                      py-3 sm:py-3.5
                      border-2 border-[var(--border)] rounded-xl font-bold text-[var(--text-body)]
                      text-text-secondary hover:border-brand-500 hover:text-brand-500
                      transition-colors duration-[var(--duration-normal)]"
                  >
                    <ExternalLink size={18} />
                    네이버 지도에서 길찾기
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
