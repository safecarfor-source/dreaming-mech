'use client';

import { useState, useCallback } from 'react';
import { Loader2, Send } from 'lucide-react';
import { generateThumbnailVariation } from '../../../lib/api';
import type { VariationPanelProps } from './types';

const VARIATION_OPTIONS = [
  { label: '더 클릭베이트로', value: 'more_clickbait' },
  { label: '더 미니멀로', value: 'more_minimal' },
  { label: '얼굴 크게', value: 'face_closer' },
  { label: '다크모드', value: 'dark_mode' },
  { label: '배경 밝게', value: 'brighter_bg' },
  { label: '텍스트 강조', value: 'stronger_text' },
  { label: '다른 엔진으로', value: 'different_engine' },
  { label: '직접 입력', value: 'custom' },
] as const;

export default function VariationPanel({
  thumbnailId,
  currentEngine,
  onVariation,
  loading: externalLoading,
}: VariationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const isLoading = externalLoading || loading;

  const handleVariation = useCallback(
    async (variation: string, customInstruction?: string) => {
      if (isLoading) return;
      setLoading(true);
      try {
        const result = await generateThumbnailVariation({
          thumbnailId,
          variation,
          customInstruction,
        });
        onVariation({ id: result.id, imageUrl: result.imageUrl });
      } catch {
        // 실패 시 조용히 무시 (상위 컴포넌트에서 에러 표시)
      } finally {
        setLoading(false);
        setShowCustomInput(false);
        setCustomText('');
      }
    },
    [thumbnailId, onVariation, isLoading],
  );

  const handleOptionClick = useCallback(
    (value: string) => {
      if (value === 'custom') {
        setShowCustomInput((prev) => !prev);
        return;
      }
      handleVariation(value);
    },
    [handleVariation],
  );

  const handleCustomSubmit = useCallback(() => {
    if (!customText.trim()) return;
    handleVariation('custom', customText.trim());
  }, [customText, handleVariation]);

  return (
    <div className="space-y-2">
      {/* 옵션 버튼 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        {VARIATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleOptionClick(opt.value)}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40 ${
              opt.value === 'custom' && showCustomInput
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-gray-700/60 hover:bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 직접 입력 영역 */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="수정 지시 입력 (예: 얼굴 더 크게)"
            disabled={isLoading}
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 disabled:opacity-40"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={isLoading || !customText.trim()}
            className="p-1.5 bg-[#7C4DFF] hover:bg-[#6B3FE0] disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C4DFF]" />
          변형 생성 중...
        </div>
      )}

      {/* 현재 엔진 표시 */}
      {currentEngine && (
        <p className="text-[10px] text-gray-600 text-right">
          엔진: {currentEngine}
        </p>
      )}
    </div>
  );
}
