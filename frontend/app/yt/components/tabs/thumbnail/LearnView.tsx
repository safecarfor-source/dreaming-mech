'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Loader2,
  Image as ImageIcon,
  Upload,
  BookOpen,
  PenTool,
  Eye,
} from 'lucide-react';
import {
  analyzeThumbnail,
  saveThumbnailMemory,
  getThumbnailMemory,
} from '../../../lib/api';

export default function LearnView() {
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
