'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Eye, ExternalLink } from 'lucide-react';
import { useModalStore } from '@/lib/store';
import { mechanicsApi } from '@/lib/api';
import NaverMapView from './NaverMapView';
import YouTubeEmbed from './YouTubeEmbed';

export default function MechanicModal() {
  const { isOpen, mechanic, close } = useModalStore();

  // 클릭수 증가
  useEffect(() => {
    if (isOpen && mechanic) {
      mechanicsApi.incrementClick(mechanic.id).catch(console.error);
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
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">{mechanic.name}</h2>
              <button
                onClick={close}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-8">
                {/* 대표 이미지 */}
                {mechanic.mainImageUrl && (
                  <div className="rounded-2xl overflow-hidden">
                    <img
                      src={mechanic.mainImageUrl}
                      alt={mechanic.name}
                      className="w-full h-64 md:h-80 object-cover"
                    />
                  </div>
                )}

                {/* 기본 정보 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin size={20} className="text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">주소</p>
                        <p className="text-gray-900 font-medium">{mechanic.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Phone size={20} className="text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">전화번호</p>
                        <a
                          href={`tel:${mechanic.phone}`}
                          className="text-[#8B5CF6] font-medium hover:underline"
                        >
                          {mechanic.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Eye size={20} className="text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">조회수</p>
                        <p className="text-gray-900 font-medium">{mechanic.clickCount + 1}회</p>
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  {mechanic.description && (
                    <div className="p-6 bg-gray-50 rounded-2xl">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">소개</h3>
                      <p className="text-gray-600 leading-relaxed">{mechanic.description}</p>
                    </div>
                  )}
                </div>

                {/* 지도 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">위치</h3>
                  <NaverMapView
                    lat={mechanic.mapLat}
                    lng={mechanic.mapLng}
                    name={mechanic.name}
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
                    className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-4 rounded-xl font-bold text-center transition-colors"
                  >
                    전화 문의하기
                  </a>
                  <button
                    onClick={() => {
                      const url = `https://map.naver.com/v5/search/${encodeURIComponent(mechanic.address)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
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
