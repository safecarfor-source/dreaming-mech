'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  name: string;
}

export default function GalleryCarousel({ images, name }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setViewerIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    } else {
      setViewerIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <>
      {/* 가로 스크롤 갤러리 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2" style={{ minWidth: 'min-content' }}>
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => openViewer(i)}
              className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
            >
              <img
                src={url}
                alt={`${name} 갤러리 ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* 풀스크린 뷰어 */}
      <AnimatePresence>
        {viewerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
            onClick={() => setViewerOpen(false)}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setViewerOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-10"
            >
              <X size={24} className="text-white" />
            </button>

            {/* 이전/다음 버튼 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('prev'); }}
                  className="absolute left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-10"
                >
                  <ChevronLeft size={28} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('next'); }}
                  className="absolute right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-10"
                >
                  <ChevronRight size={28} className="text-white" />
                </button>
              </>
            )}

            {/* 이미지 */}
            <motion.img
              key={viewerIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={images[viewerIndex]}
              alt={`${name} ${viewerIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* 인디케이터 */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === viewerIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
