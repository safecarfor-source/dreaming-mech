'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Eye, ExternalLink } from 'lucide-react';
import { useModalStore } from '@/lib/store';
import { mechanicsApi } from '@/lib/api';
import { sanitizeText, sanitizeBasicHTML, sanitizePhone } from '@/lib/sanitize';
import NaverMapView from './NaverMapView';
import YouTubeEmbed from './YouTubeEmbed';

export default function MechanicModal() {
  const { isOpen, mechanic, close } = useModalStore();

  // 클릭수 증가
  useEffect(() => {
    if (isOpen && mechanic) {
      mechanicsApi.incrementClick(mechanic.id).catch((error) => {
        // 중복 클릭(400)은 정상 동작이므로 무시
        if (error?.response?.status !== 400) {
          console.error('Failed to increment click:', error);
        }
      });
    }
  }, [isOpen, mechanic]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [close]);

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
              <h2 className="text-2xl font-bold text-gray-900 break-words min-w-0 flex-1">{sanitizeText(mechanic.name)}</h2>
              <button
                onClick={close}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-8">
                {/* 사진 + 주소 + 소개 나란히 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 대표 이미지 (정사각형) */}
                  {mechanic.mainImageUrl && (
                    <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                      <img
                        src={mechanic.mainImageUrl}
                        alt={sanitizeText(mechanic.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* 주소/전화/조회수 */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <MapPin size={20} className="text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-500">주소</p>
                        <p className="text-gray-900 font-medium break-words">{sanitizeText(mechanic.address)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <Phone size={20} className="text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-500">전화번호</p>
                        <a
                          href={`tel:${sanitizePhone(mechanic.phone)}`}
                          className="text-gray-500 font-medium hover:underline break-all"
                        >
                          {sanitizePhone(mechanic.phone)}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <Eye size={20} className="text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-500">조회수</p>
                        <p className="text-gray-900 font-medium">{mechanic.clickCount}회</p>
                      </div>
                    </div>
                  </div>

                  {/* 소개 */}
                  {mechanic.description && (
                    <div className="p-6 bg-gray-50 rounded-2xl">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">소개</h3>
                      <p className="text-gray-600 leading-relaxed break-words whitespace-pre-wrap">{sanitizeBasicHTML(mechanic.description)}</p>
                    </div>
                  )}
                </div>

                {/* 지도 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">위치</h3>
                  <NaverMapView
                    lat={mechanic.mapLat}
                    lng={mechanic.mapLng}
                    name={sanitizeText(mechanic.name)}
                  />
                </div>

                {/* 유튜브 */}
                {mechanic.youtubeUrl && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">소개 영상</h3>
                    <YouTubeEmbed url={mechanic.youtubeUrl} />
                  </div>
                )}

                {/* CTA 버튼 */}
                <div className="flex gap-4">
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="flex-1 bg-[#bf00ff] hover:bg-[#a600e0] text-white py-4 rounded-xl font-bold text-center transition-colors"
                  >
                    전화 문의하기
                  </a>
                  <button
                    onClick={() => {
                      const url = `https://map.naver.com/v5/search/${encodeURIComponent(mechanic.address)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#bf00ff] hover:text-purple-600 transition-colors"
                  >
                    <ExternalLink size={20} />
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
