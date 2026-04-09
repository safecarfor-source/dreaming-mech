'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Sparkles,
  Download,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  generateCompleteThumbnails,
  generateThumbnailVariation,
  saveThumbnailFeedback,
} from '../../../lib/api';
import type { CompleteThumbnailResult } from '../../../lib/api';
import type { ThumbnailStrategy } from './types';

interface CreateViewProps {
  projectId: string;
  onOpenCanvas?: (backgroundUrl: string, strategy: ThumbnailStrategy) => void;
}

type VariationOption = {
  label: string;
  value: string;
};

const VARIATION_OPTIONS: VariationOption[] = [
  { label: '더 클릭베이트로', value: 'more_clickbait' },
  { label: '더 미니멀로', value: 'more_minimal' },
  { label: '얼굴 크게', value: 'face_closer' },
  { label: '다크모드', value: 'dark_mode' },
];

const STYLE_OPTIONS = [
  { label: '자동차 정비', value: '자동차 정비' },
  { label: '긴급/경고', value: '긴급/경고' },
  { label: '교육/정보', value: '교육/정보' },
  { label: '리뷰', value: '리뷰' },
  { label: '브이로그', value: '브이로그' },
  { label: '기타', value: '기타' },
];

interface ThumbnailCardState {
  id: string;
  imageUrl: string;
  strategy: ThumbnailStrategy;
  prompt: string;
  loading: boolean;
  feedback: 'good' | 'bad' | null;
  variationOpen: boolean;
}

export default function CreateView({ projectId, onOpenCanvas: _onOpenCanvas }: CreateViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('자동차 정비');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [cards, setCards] = useState<ThumbnailCardState[]>([]);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    const effectiveTitle = title || description || '유튜브 썸네일';
    setGenerating(true);
    setError('');
    setCards([]);
    try {
      const result: CompleteThumbnailResult = await generateCompleteThumbnails({
        projectId,
        title: effectiveTitle,
        description: description || undefined,
        style,
      });

      const initialCards: ThumbnailCardState[] = result.thumbnails.map((t) => ({
        id: t.id,
        imageUrl: t.imageUrl,
        strategy: t.strategy,
        prompt: t.prompt,
        loading: false,
        feedback: null,
        variationOpen: false,
      }));
      setCards(initialCards);
    } catch (e) {
      setError('생성 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setGenerating(false);
    }
  }, [projectId, description, style]);

  const handleDownload = useCallback(async (imageUrl: string, concept: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thumbnail-${concept}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // 다운로드 실패 시 새 탭으로 열기
      window.open(imageUrl, '_blank');
    }
  }, []);

  const handleFeedback = useCallback(async (index: number, rating: 'good' | 'bad') => {
    const card = cards[index];
    if (!card || card.feedback) return;
    try {
      await saveThumbnailFeedback({ thumbnailId: card.id, rating });
      setCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, feedback: rating } : c))
      );
    } catch {
      // 피드백 실패는 조용히 무시
    }
  }, [cards]);

  const handleVariation = useCallback(async (index: number, variation: string) => {
    const card = cards[index];
    if (!card) return;
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, loading: true, variationOpen: false } : c))
    );
    try {
      const result = await generateThumbnailVariation({ thumbnailId: card.id, variation });
      setCards((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, id: result.id, imageUrl: result.imageUrl, loading: false, feedback: null } : c
        )
      );
    } catch (e) {
      setCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, loading: false } : c))
      );
    }
  }, [cards]);

  const toggleVariationMenu = useCallback((index: number) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, variationOpen: !c.variationOpen } : { ...c, variationOpen: false }))
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* 입력 영역 */}
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="영상 제목 (예: 브레이크오일 교체가 필요한데 안하면 위험합니까)"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="영상 설명 (선택 — 추가 컨텍스트)"
          rows={2}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
        />

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-900">
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#7C4DFF] hover:bg-[#6B3FE0] disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white font-semibold text-sm transition-colors"
        >
          {generating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          썸네일 3안 자동 생성
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {generating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-3 py-12 text-center"
        >
          <Loader2 className="w-8 h-8 text-[#7C4DFF] animate-spin" />
          <p className="text-gray-400 text-sm leading-relaxed">
            AI가 학습된 노하우를 반영하여<br />썸네일 3안을 만들고 있습니다...
          </p>
        </motion.div>
      )}

      {/* 결과 카드 3장 */}
      <AnimatePresence>
        {cards.length > 0 && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.id + index}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.07 }}
                className="bg-gray-800/40 border border-gray-700 rounded-2xl overflow-hidden flex flex-col"
              >
                {/* 이미지 */}
                <div
                  className="relative aspect-video bg-gray-800 cursor-pointer overflow-hidden"
                  onClick={() => !card.loading && setModalUrl(card.imageUrl)}
                >
                  {card.loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#7C4DFF] animate-spin" />
                    </div>
                  ) : (
                    <img
                      src={card.imageUrl}
                      alt={`썸네일 ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* 전략 정보 */}
                <div className="px-3 py-2.5 border-t border-gray-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#7C4DFF] bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {card.strategy.concept}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">
                      {card.strategy.emotionalTone}
                    </span>
                  </div>
                  <p className="text-white text-sm font-bold leading-snug">
                    {card.strategy.textMain}
                  </p>
                  {card.strategy.textSub && (
                    <p className="text-gray-400 text-xs">{card.strategy.textSub}</p>
                  )}
                </div>

                {/* 버튼 영역 */}
                <div className="px-3 pb-3 flex items-center gap-2 mt-auto">
                  {/* 다운로드 */}
                  <button
                    onClick={() => handleDownload(card.imageUrl, card.strategy.concept)}
                    disabled={card.loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/60 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-xs text-gray-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    다운로드
                  </button>

                  {/* 피드백 */}
                  <button
                    onClick={() => handleFeedback(index, 'good')}
                    disabled={!!card.feedback || card.loading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      card.feedback === 'good'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700/60 hover:bg-gray-700 text-gray-400 disabled:opacity-40'
                    }`}
                    title="좋아요"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(index, 'bad')}
                    disabled={!!card.feedback || card.loading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      card.feedback === 'bad'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-700/60 hover:bg-gray-700 text-gray-400 disabled:opacity-40'
                    }`}
                    title="별로"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  {/* 변형 드롭다운 */}
                  <div className="relative ml-auto">
                    <button
                      onClick={() => toggleVariationMenu(index)}
                      disabled={card.loading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/60 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      변형
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {card.variationOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 bottom-full mb-1 w-40 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl z-10"
                        >
                          {VARIATION_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleVariation(index, opt.value)}
                              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 이미지 원본 모달 */}
      <AnimatePresence>
        {modalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setModalUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalUrl}
                alt="썸네일 원본"
                className="w-full rounded-xl shadow-2xl"
              />
              <button
                onClick={() => setModalUrl(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
