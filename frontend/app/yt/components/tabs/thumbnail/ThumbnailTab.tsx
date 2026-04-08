'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateView from './CreateView';
import CanvasEditor from './CanvasEditor';
import GalleryView from './GalleryView';
import LearnView from './LearnView';
import type { ThumbnailStrategy } from './types';

interface ThumbnailTabProps {
  projectId: string;
}

type TabView = 'create' | 'canvas' | 'gallery' | 'learn';

const TAB_CONFIG = [
  { key: 'create' as const, label: '썸네일 만들기', icon: '🎯' },
  { key: 'canvas' as const, label: '캔버스 편집', icon: '🖼️' },
  { key: 'gallery' as const, label: '갤러리', icon: '📁' },
  { key: 'learn' as const, label: '학습/메모리', icon: '📚' },
];

export default function ThumbnailTab({ projectId }: ThumbnailTabProps) {
  const [activeView, setActiveView] = useState<TabView>('create');
  const [canvasBackground, setCanvasBackground] = useState<string | undefined>();
  const [canvasStrategy, setCanvasStrategy] = useState<ThumbnailStrategy | undefined>();

  // CreateView에서 "캔버스에서 편집" 클릭 시 호출
  const handleOpenCanvas = (backgroundUrl: string, strategy: ThumbnailStrategy) => {
    setCanvasBackground(backgroundUrl);
    setCanvasStrategy(strategy);
    setActiveView('canvas');
  };

  return (
    <div className="space-y-4">
      {/* 상단 탭 네비 */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {TAB_CONFIG.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === key
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* 뷰 */}
      <AnimatePresence mode="wait">
        {activeView === 'create' && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CreateView projectId={projectId} onOpenCanvas={handleOpenCanvas} />
          </motion.div>
        )}
        {activeView === 'canvas' && (
          <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CanvasEditor
              backgroundUrl={canvasBackground}
              strategy={canvasStrategy}
              projectId={projectId}
              onBack={() => setActiveView('create')}
            />
          </motion.div>
        )}
        {activeView === 'gallery' && (
          <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GalleryView projectId={projectId} />
          </motion.div>
        )}
        {activeView === 'learn' && (
          <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LearnView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
