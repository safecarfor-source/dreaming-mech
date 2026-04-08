'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Download,
  Upload,
  RefreshCw,
  ChevronRight,
  Eye,
  History,
  X,
} from 'lucide-react';
import {
  generateThumbnailStrategy,
  generateThumbnailImage,
  getThumbnails,
  deleteThumbnail,
  saveThumbnail,
} from '../../../lib/api';
import type { ThumbnailStrategy, ThumbnailRecord } from './types';

interface CreateViewProps {
  projectId: string;
  onOpenCanvas?: (backgroundUrl: string, strategy: ThumbnailStrategy) => void;
}

export default function CreateView({ projectId, onOpenCanvas }: CreateViewProps) {
  const [step, setStep] = useState<'strategy' | 'generate' | 'preview'>('strategy');
  const [strategies, setStrategies] = useState<ThumbnailStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<ThumbnailStrategy | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [error, setError] = useState('');
  const [savedThumbnails, setSavedThumbnails] = useState<ThumbnailRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 이전 이력 로드
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getThumbnails(projectId);
      setSavedThumbnails(data || []);
    } catch {
      // 조용히 실패
    } finally {
      setLoadingHistory(false);
    }
  }, [projectId]);

  // 마운트 시 이력 로드
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleDeleteSaved = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteThumbnail(id);
      setSavedThumbnails((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // 조용히 실패
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleGenerateStrategy = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateThumbnailStrategy({
        projectId,
        customInstruction: customInstruction || undefined,
      });
      setStrategies(result.strategies || []);
      if (result.strategies?.length > 0) {
        setStep('strategy');
      }
    } catch (e) {
      setError('전략 생성 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  }, [projectId, customInstruction]);

  const handleSelectStrategy = useCallback((strategy: ThumbnailStrategy) => {
    setSelectedStrategy(strategy);
    setEditingPrompt(strategy.fluxPrompt);
    setStep('generate');
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!editingPrompt) return;
    setLoading(true);
    setError('');
    try {
      const result = await generateThumbnailImage({
        projectId,
        prompt: editingPrompt,
      });
      setGeneratedImages(result.imageUrls);
      setStep('preview');
      // 자동 저장
      if (result.imageUrls.length > 0) {
        try {
          await saveThumbnail({
            projectId,
            imageUrl: result.imageUrls[0],
            prompt: editingPrompt,
            strategy: selectedStrategy ? (selectedStrategy as unknown as Record<string, unknown>) : undefined,
          });
          await loadHistory();
        } catch {
          // 저장 실패해도 생성은 성공으로 처리
        }
      }
    } catch (e) {
      setError('이미지 생성 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  }, [projectId, editingPrompt, selectedStrategy, loadHistory]);

  return (
    <div className="space-y-6">
      {/* 에러 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: 전략 생성 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">1</span>
            AI 전략 생성
          </h3>
          {strategies.length > 0 && (
            <button onClick={() => { setStrategies([]); setStep('strategy'); }} className="text-xs text-gray-500 hover:text-gray-400">
              초기화
            </button>
          )}
        </div>

        {/* 커스텀 지시 입력 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="추가 지시 (선택) — 예: 빨간색 배경으로, 놀란 표정으로..."
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleGenerateStrategy}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {loading && step === 'strategy' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            전략 생성
          </button>
        </div>

        {/* 전략 카드 3개 */}
        {strategies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {strategies.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelectStrategy(s)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedStrategy === s
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                }`}
              >
                <div className="text-xs text-purple-400 font-medium mb-1">{s.concept}</div>
                <div className="text-white font-bold text-lg mb-1" style={{ color: s.colorScheme?.textColor }}>
                  {s.textMain}
                </div>
                {s.textSub && <div className="text-gray-400 text-xs mb-2">{s.textSub}</div>}
                <div className="text-gray-500 text-xs leading-relaxed">{s.description}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">
                    {s.emotionalTone}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2: 이미지 생성 */}
      {(step === 'generate' || step === 'preview') && selectedStrategy && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">2</span>
            AI 이미지 생성
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-gray-400 text-xs font-normal">FLUX 1.1 Pro</span>
          </h3>

          {/* 프롬프트 편집 */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500">프롬프트 (영문, 편집 가능)</label>
            <textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              rows={3}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerateImage}
                disabled={loading || !editingPrompt}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {loading && step === 'generate' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                이미지 생성 (~15초)
              </button>
              <button
                onClick={() => { setEditingPrompt(selectedStrategy.fluxPrompt); }}
                className="px-3 py-2 text-xs text-gray-500 hover:text-gray-400 border border-gray-700 rounded-lg"
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                원본 복원
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 미리보기 */}
      {step === 'preview' && generatedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-xs font-bold">3</span>
            생성 결과
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((url, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-700">
                <img src={url} alt={`생성된 썸네일 ${i + 1}`} className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                    <Eye className="w-5 h-5 text-white" />
                  </a>
                  <a href={url} download className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                    <Download className="w-5 h-5 text-white" />
                  </a>
                </div>

                {/* 선택한 전략 텍스트 오버레이 미리보기 */}
                {selectedStrategy && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div
                      className="font-bold text-2xl drop-shadow-lg"
                      style={{ color: selectedStrategy.colorScheme?.textColor || '#FFD700' }}
                    >
                      {selectedStrategy.textMain}
                    </div>
                    {selectedStrategy.textSub && (
                      <div className="text-white/80 text-sm mt-1">{selectedStrategy.textSub}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateImage}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:border-gray-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              다시 생성
            </button>
            {/* 캔버스에서 편집 버튼 — onOpenCanvas 제공 시에만 표시 */}
            {onOpenCanvas && selectedStrategy && generatedImages[0] && (
              <button
                onClick={() => onOpenCanvas(generatedImages[0], selectedStrategy)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded-lg hover:border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
              >
                🖼️ 캔버스에서 편집
              </button>
            )}
          </div>

          {/* 텍스트 정보 */}
          {selectedStrategy && (
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">선택된 전략</div>
              <div className="text-sm text-white font-medium">{selectedStrategy.concept}</div>
              <div className="text-xs text-gray-400 mt-1">
                메인: <span className="text-white">{selectedStrategy.textMain}</span>
                {selectedStrategy.textSub && <> · 서브: <span className="text-white">{selectedStrategy.textSub}</span></>}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                캔버스 편집기에서 텍스트를 이미지 위에 배치할 수 있습니다 (Phase 2)
              </div>
            </div>
          )}
        </div>
      )}

      {/* 직접 실사진 업로드 옵션 */}
      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <Upload className="w-3.5 h-3.5" />
          <span>직접 사진 업로드는 캔버스 편집기 (Phase 2)에서 지원됩니다</span>
        </div>
      </div>

      {/* 이전 제작 이력 */}
      {savedThumbnails.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              <p className="text-gray-400 text-xs font-medium">이전 제작 이력</p>
            </div>
            <span className="text-gray-600 text-[10px]">{savedThumbnails.length}개</span>
          </div>
          {savedThumbnails.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="relative group w-full bg-gray-800 border border-gray-700 rounded-xl p-3 hover:border-purple-500/30 transition-colors flex items-center gap-3"
            >
              {/* 썸네일 미리보기 */}
              {(t.imageUrl || t.baseImageUrl) ? (
                <img
                  src={t.imageUrl || t.baseImageUrl}
                  alt="썸네일"
                  className="w-16 h-9 object-cover rounded-lg flex-shrink-0 border border-gray-700"
                />
              ) : (
                <div className="w-16 h-9 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center justify-between pr-6">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                    t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {t.status === 'COMPLETED' ? '완성' : '초안'}
                  </span>
                  <span className="text-gray-400 text-xs truncate max-w-[120px]">
                    {(t.strategy as Record<string, unknown>)?.concept as string || '생성된 썸네일'}
                  </span>
                </div>
                <span className="text-gray-500 text-[10px] flex-shrink-0 ml-2">
                  {new Date(t.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => handleDeleteSaved(e, t.id)}
                disabled={deletingId === t.id}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-700 transition-all"
              >
                {deletingId === t.id ? (
                  <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                ) : (
                  <X className="w-3 h-3 text-gray-400 hover:text-red-400 transition-colors" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {loadingHistory && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
          <span className="text-gray-500 text-xs">이전 이력 불러오는 중...</span>
        </div>
      )}
    </div>
  );
}
