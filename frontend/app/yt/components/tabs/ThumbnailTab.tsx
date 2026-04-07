'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Download,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Upload,
  BookOpen,
  PenTool,
  RefreshCw,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  generateThumbnailStrategy,
  generateThumbnailImage,
  getThumbnails,
  deleteThumbnail,
  saveThumbnailFeedback,
  saveThumbnailMemory,
  analyzeThumbnail,
  getThumbnailMemory,
  type ThumbnailStrategy,
  type ThumbnailRecord,
} from '../../lib/api';

interface ThumbnailTabProps {
  projectId: string;
}

type TabView = 'create' | 'gallery' | 'learn';

export default function ThumbnailTab({ projectId }: ThumbnailTabProps) {
  const [activeView, setActiveView] = useState<TabView>('create');

  return (
    <div className="space-y-4">
      {/* 상단 탭 네비 */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {[
          { key: 'create' as const, label: '썸네일 만들기', icon: Sparkles },
          { key: 'gallery' as const, label: '갤러리', icon: ImageIcon },
          { key: 'learn' as const, label: '학습/메모리', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === key
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 뷰 */}
      <AnimatePresence mode="wait">
        {activeView === 'create' && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CreateView projectId={projectId} />
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

// ─── 썸네일 만들기 뷰 ─────────────────────────────────────

function CreateView({ projectId }: { projectId: string }) {
  const [step, setStep] = useState<'strategy' | 'generate' | 'preview'>('strategy');
  const [strategies, setStrategies] = useState<ThumbnailStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<ThumbnailStrategy | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [error, setError] = useState('');

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
    } catch (e) {
      setError('이미지 생성 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  }, [projectId, editingPrompt]);

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
      <DirectUploadSection projectId={projectId} />
    </div>
  );
}

// ─── 직접 업로드 섹션 ─────────────────────────────────────

function DirectUploadSection({ projectId: _projectId }: { projectId: string }) {
  return (
    <div className="border-t border-gray-800 pt-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        <Upload className="w-3.5 h-3.5" />
        <span>직접 사진 업로드는 캔버스 편집기 (Phase 2)에서 지원됩니다</span>
      </div>
    </div>
  );
}

// ─── 갤러리 뷰 ─────────────────────────────────────

function GalleryView({ projectId }: { projectId: string }) {
  const [thumbnails, setThumbnails] = useState<ThumbnailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThumbnails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getThumbnails(projectId);
      setThumbnails(data || []);
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 초기 로딩
  useState(() => { loadThumbnails(); });

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteThumbnail(id);
      setThumbnails((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // 조용히 실패
    }
  }, []);

  const handleFeedback = useCallback(async (id: string, rating: 'good' | 'bad') => {
    try {
      await saveThumbnailFeedback({ thumbnailId: id, rating });
    } catch {
      // 조용히 실패
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        아직 생성된 썸네일이 없습니다. &quot;썸네일 만들기&quot; 탭에서 시작해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{thumbnails.length}개 썸네일</div>
        <button onClick={loadThumbnails} className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> 새로고침
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {thumbnails.map((t) => (
          <div key={t.id} className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-800/30">
            {(t.imageUrl || t.baseImageUrl) ? (
              <img src={t.imageUrl || t.baseImageUrl} alt="썸네일" className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}

            {/* 상태 뱃지 */}
            <div className="absolute top-2 right-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {t.status === 'COMPLETED' ? '완성' : '초안'}
              </span>
            </div>

            {/* 호버 액션 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => handleFeedback(t.id, 'good')} className="p-2 bg-green-500/20 rounded-full hover:bg-green-500/30" title="좋아요">
                <ThumbsUp className="w-4 h-4 text-green-400" />
              </button>
              <button onClick={() => handleFeedback(t.id, 'bad')} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30" title="별로">
                <ThumbsDown className="w-4 h-4 text-red-400" />
              </button>
              <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30" title="삭제">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>

            {/* 날짜 */}
            <div className="p-2">
              <div className="text-[10px] text-gray-500">
                {new Date(t.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 학습/메모리 뷰 ─────────────────────────────────────

function LearnView() {
  const [subTab, setSubTab] = useState<'analyze' | 'input' | 'list'>('analyze');
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzeNote, setAnalyzeNote] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [htmlConverting, setHtmlConverting] = useState(false);
  const hiddenIframeRef = useRef<HTMLIFrameElement>(null);
  const [memoryInput, setMemoryInput] = useState('');
  const [memoryTags, setMemoryTags] = useState('');
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [memories, setMemories] = useState<any[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  // HTML 파일 → PNG 변환
  const convertHtmlToImageFile = useCallback(async (htmlFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const htmlContent = e.target?.result as string;
        // iframe에 HTML 주입
        const iframe = hiddenIframeRef.current;
        if (!iframe) return reject(new Error('iframe 없음'));

        iframe.style.display = 'block';
        const doc = iframe.contentDocument;
        if (!doc) return reject(new Error('iframe document 없음'));

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // 렌더링 대기
        await new Promise(r => setTimeout(r, 1000));

        try {
          const { default: html2canvas } = await import('html2canvas');
          const canvas = await html2canvas(doc.body, {
            width: 1280,
            height: 720,
            scale: 1,
            useCORS: true,
            allowTaint: true,
          });
          iframe.style.display = 'none';

          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('캔버스 변환 실패'));
            const pngFile = new File([blob], htmlFile.name.replace('.html', '.png'), { type: 'image/png' });
            resolve(pngFile);
          }, 'image/png');
        } catch (err) {
          iframe.style.display = 'none';
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(htmlFile);
    });
  }, []);

  // 파일 선택 핸들러 (이미지 + HTML 모두 처리)
  const handleFileChange = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.html') || file.type === 'text/html') {
      setHtmlConverting(true);
      try {
        const imageFile = await convertHtmlToImageFile(file);
        setAnalyzeFile(imageFile);
      } catch {
        alert('HTML → 이미지 변환 실패. 다시 시도해주세요.');
      } finally {
        setHtmlConverting(false);
      }
    } else {
      setAnalyzeFile(file);
    }
  }, [convertHtmlToImageFile]);

  const handleAnalyze = useCallback(async () => {
    if (!analyzeFile) return;
    setAnalyzing(true);
    setAnalysisResult('');
    try {
      const result = await analyzeThumbnail(analyzeFile, analyzeNote || undefined);
      setAnalysisResult(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (e) {
      setAnalysisResult('분석 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setAnalyzing(false);
    }
  }, [analyzeFile, analyzeNote]);

  const handleSaveMemory = useCallback(async () => {
    if (!memoryInput.trim()) return;
    setSaving(true);
    try {
      const tags = memoryTags.split(',').map((t) => t.trim()).filter(Boolean);
      await saveThumbnailMemory({ content: memoryInput, tags });
      setMemoryInput('');
      setMemoryTags('');
    } catch {
      // 조용히 실패
    } finally {
      setSaving(false);
    }
  }, [memoryInput, memoryTags]);

  const loadMemories = useCallback(async () => {
    setMemoriesLoading(true);
    try {
      const data = await getThumbnailMemory();
      setMemories(data || []);
    } catch {
      // 조용히 실패
    } finally {
      setMemoriesLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* 서브 탭 */}
      <div className="flex gap-2">
        {[
          { key: 'analyze' as const, label: '이미지 분석', icon: Eye },
          { key: 'input' as const, label: '노하우 입력', icon: PenTool },
          { key: 'list' as const, label: '학습 목록', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setSubTab(key); if (key === 'list') loadMemories(); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              subTab === key ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 이미지 분석 */}
      {subTab === 'analyze' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">잘 나가는 썸네일을 업로드하면 AI가 구도, 색감, 텍스트 전략을 분석하고 메모리에 저장합니다.</p>

          {/* 숨겨진 iframe — HTML→이미지 변환용 */}
          <iframe
            ref={hiddenIframeRef}
            style={{ display: 'none', width: 1280, height: 720, position: 'fixed', top: -9999, left: -9999 }}
            title="html-preview"
          />

          <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-600 transition-colors">
            <input
              type="file"
              accept="image/*,.html,text/html"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
              id="analyze-upload"
            />
            <label htmlFor="analyze-upload" className="cursor-pointer">
              {htmlConverting ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 text-purple-400 mx-auto animate-spin" />
                  <div className="text-sm text-purple-300">HTML → 이미지 변환 중...</div>
                </div>
              ) : analyzeFile ? (
                <div className="space-y-2">
                  <ImageIcon className="w-8 h-8 text-purple-400 mx-auto" />
                  <div className="text-sm text-white">{analyzeFile.name}</div>
                  <div className="text-xs text-gray-500">{(analyzeFile.size / 1024 / 1024).toFixed(1)}MB</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                  <div className="text-sm text-gray-400">썸네일 업로드</div>
                  <div className="text-xs text-gray-600">JPG, PNG, HTML (10MB 이하)</div>
                </div>
              )}
            </label>
          </div>

          <input
            type="text"
            value={analyzeNote}
            onChange={(e) => setAnalyzeNote(e.target.value)}
            placeholder="메모 (선택) — 예: 이 채널에서 조회수 50만 넘은 영상"
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          />

          <button
            onClick={handleAnalyze}
            disabled={!analyzeFile || analyzing}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            분석하기
          </button>

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">AI 분석 결과 (자동 메모리 저장됨)</div>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">{analysisResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* 노하우 직접 입력 */}
      {subTab === 'input' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">썸네일 제작 노하우를 직접 입력하면 AI가 다음 전략 생성 시 자동으로 반영합니다.</p>

          <textarea
            value={memoryInput}
            onChange={(e) => setMemoryInput(e.target.value)}
            placeholder="예: 검은 배경에 노란 텍스트가 내 채널에서 가장 효과적&#10;부품 클로즈업 + 가격 표시는 조회수가 잘 나옴&#10;얼굴이 우측에 있고 텍스트가 좌측이면 CTR이 높음"
            rows={4}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
          />

          <input
            type="text"
            value={memoryTags}
            onChange={(e) => setMemoryTags(e.target.value)}
            placeholder="태그 (쉼표 구분) — 예: 색상, 구도, 텍스트"
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          />

          <button
            onClick={handleSaveMemory}
            disabled={!memoryInput.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
            메모리에 저장
          </button>
        </div>
      )}

      {/* 학습 목록 */}
      {subTab === 'list' && (
        <div className="space-y-3">
          {memoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              아직 학습된 노하우가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">{memories.length}개 학습 항목</div>
              {memories.map((m) => (
                <div key={m.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      m.source === 'expert-input' ? 'bg-blue-500/20 text-blue-400' :
                      m.source === 'feedback' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {m.source === 'expert-input' ? '전문가' :
                       m.source === 'feedback' ? '피드백' : 'AI 분석'}
                    </span>
                    <span className="text-[10px] text-gray-600">{new Date(m.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="text-xs text-gray-300 whitespace-pre-wrap">{m.content.slice(0, 200)}</div>
                  {m.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {m.tags.map((tag: string) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] text-gray-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
