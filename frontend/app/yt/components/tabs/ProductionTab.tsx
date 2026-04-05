'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ChevronRight,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
  Play,
  Info,
  AlertCircle,
  Link2,
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  Send,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import {
  getProject,
  startProduction,
  getProductionResult,
  refineScript,
  updateProductionField,
  addReferencesToProject,
  discoverByKeyword,
  YtProductionResult,
  YtReferenceVideo,
  ProductionStatusResponse,
} from '../../lib/api';

interface ProductionTabProps {
  projectId: string;
  onSwitchToDiscover?: () => void;
}

type AnalysisSection =
  | 'research'
  | 'introMaterial'
  | 'coreValue'
  | 'script'
  | 'thumbnailText'
  | 'titleSuggestions'
  | 'hashtags'
  | 'description';

const SECTION_LABELS: Record<AnalysisSection, string> = {
  research: '리서치',
  introMaterial: '인트로 소재',
  coreValue: '코어 밸류',
  script: '대본',
  thumbnailText: '썸네일 문구',
  titleSuggestions: '제목 제안',
  hashtags: '해시태그',
  description: '설명란',
};

// DB 필드명 → 프론트 필드명 매핑
const DB_FIELD_MAP: Record<string, AnalysisSection> = {
  coreValue: 'coreValue',
  introSources: 'introMaterial',
  scriptDraft: 'script',
  thumbnailStrategies: 'thumbnailText',
  titles: 'titleSuggestions',
  hashtags: 'hashtags',
  description: 'description',
  opusReview: 'research',
};

function formatNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

// DB 레코드를 프론트 형식으로 변환
function mapDbToResult(dbRecord: any): YtProductionResult {
  // 인트로 소재: introDrafts(배열) 우선, introSources(객체)는 댓글 분석 결과
  let introMaterial = '';
  if (Array.isArray(dbRecord.introDrafts) && dbRecord.introDrafts.length > 0) {
    // introDrafts는 인트로 버전 3개 (문제제기/공감/충격통계)
    introMaterial = dbRecord.introDrafts.join('\n\n---\n\n');
  }
  // introSources에 댓글 분석 결과가 있으면 추가
  if (dbRecord.introSources && typeof dbRecord.introSources === 'object') {
    const src = dbRecord.introSources as any;
    const parts: string[] = [];
    if (src.introDraft) {
      parts.push(`💬 댓글 기반 인트로:\n${src.introDraft}`);
    }
    if (Array.isArray(src.commentThemes) && src.commentThemes.length > 0) {
      parts.push(`📊 시청자 관심사:\n${src.commentThemes.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}`);
    }
    if (parts.length > 0) {
      introMaterial = introMaterial
        ? `${introMaterial}\n\n---\n\n${parts.join('\n\n')}`
        : parts.join('\n\n');
    }
  }

  // 썸네일: 별도 탭에서 관리
  let thumbnailText = '';
  if (Array.isArray(dbRecord.thumbnailStrategies) && dbRecord.thumbnailStrategies.length > 0) {
    thumbnailText = dbRecord.thumbnailStrategies.join('\n\n---\n\n');
  } else {
    thumbnailText = '썸네일 문구는 [썸네일] 탭에서 별도로 생성됩니다.';
  }

  return {
    version: dbRecord.version,
    research: dbRecord.opusReview || '',
    introMaterial: introMaterial || '인트로 소재가 아직 생성되지 않았습니다.',
    coreValue: dbRecord.coreValue || '',
    script: dbRecord.scriptDraft || '',
    thumbnailText,
    titleSuggestions: Array.isArray(dbRecord.titles) ? dbRecord.titles : [],
    hashtags: Array.isArray(dbRecord.hashtags) ? dbRecord.hashtags : [],
    description: dbRecord.description || '',
  };
}

// 경과 시간 포맷
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

// ─── 직접 링크 입력 컴포넌트 ──────────────────────────
function DirectLinkInput({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractVideoId = (input: string): string | null => {
    // youtube.com/watch?v=VIDEO_ID
    const match1 = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (match1) return match1[1];
    // youtu.be/VIDEO_ID
    const match2 = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match2) return match2[1];
    // youtube.com/shorts/VIDEO_ID
    const match3 = input.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (match3) return match3[1];
    // 11자 ID 직접 입력
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
    return null;
  };

  const handleAdd = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('올바른 YouTube URL을 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addReferencesToProject(projectId, [{
        videoId,
        title: `영상 ${videoId}`,
        channelName: '',
      }]);
      setUrl('');
      onAdded();
    } catch {
      setError('영상 추가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder="YouTube URL 붙여넣기 (예: https://youtube.com/watch?v=...)"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          추가
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── 인라인 주제찾기 (간이 키워드 검색) ──────────────────
function InlineTopicSearch({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const data = await discoverByKeyword({ keyword, maxResults: 10 });
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a: any, b: any) => (b.viewSubRatio ?? 0) - (a.viewSubRatio ?? 0));
      setResults(arr);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (v: any) => {
    if (addedIds.has(v.videoId)) return;
    try {
      await addReferencesToProject(projectId, [{
        videoId: v.videoId,
        title: v.title,
        channelName: v.channelName,
        channelId: v.channelId,
        viewCount: v.viewCount,
        subscriberCount: v.subscriberCount,
        thumbnailUrl: v.thumbnailUrl,
      }]);
      setAddedIds((prev) => new Set([...prev, v.videoId]));
      onAdded();
    } catch { /* 무시 */ }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="키워드로 참고 영상 검색 (예: 타이어 교체)"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !keyword.trim()}
          className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
          {results.map((v: any) => (
            <div key={v.videoId} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden group">
              <div className="relative w-full aspect-video bg-gray-900">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-gray-700" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 py-0.5 rounded">
                  {formatNumber(v.viewCount || 0)}
                </div>
              </div>
              <div className="p-2">
                <p className="text-white text-xs leading-snug line-clamp-2 mb-1.5">{v.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[10px] truncate max-w-[80px]">{v.channelName}</span>
                  {addedIds.has(v.videoId) ? (
                    <span className="text-[10px] px-2 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-lg">
                      ✓ 추가됨
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(v)}
                      className="text-[10px] px-2 py-1 bg-gray-700 hover:bg-violet-600/80 text-gray-300 hover:text-white rounded-lg transition-colors"
                    >
                      + 추가
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 ProductionTab ──────────────────────────────
export default function ProductionTab({ projectId, onSwitchToDiscover }: ProductionTabProps) {
  // 레퍼런스 영상
  const [references, setReferences] = useState<YtReferenceVideo[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);

  // 분석 상태
  const [analysisStatus, setAnalysisStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const [analysisError, setAnalysisError] = useState('');
  const [result, setResult] = useState<{ v1: YtProductionResult; v2: YtProductionResult } | null>(null);
  const [activeVersion, setActiveVersion] = useState<1 | 2>(1);
  const [activeSection, setActiveSection] = useState<AnalysisSection>('research');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 타임라인
  const [timeline, setTimeline] = useState('');

  // 참고영상 추가 모드
  const [addMode, setAddMode] = useState<'none' | 'link' | 'search'>('none');

  // 대본 대화형 채팅
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // 대본 직접 편집
  const [editingSection, setEditingSection] = useState<AnalysisSection | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 레퍼런스 로드
  const loadRefs = useCallback(async () => {
    try {
      const project = await getProject(projectId);
      if (project?.referenceVideos) {
        setReferences(project.referenceVideos);
      }
    } catch { /* 실패 시 빈 배열 */ }
    finally { setRefsLoading(false); }
  }, [projectId]);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  // 기존 분석 결과 체크 (페이지 로드 시)
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await getProductionResult(projectId);
        if (res.status === 'COMPLETED' && res.data?.length >= 2) {
          const v1 = res.data.find((d: any) => d.version === 1);
          const v2 = res.data.find((d: any) => d.version === 2);
          if (v1 && v2) {
            setResult({ v1: mapDbToResult(v1), v2: mapDbToResult(v2) });
            setAnalysisStatus('COMPLETED');
          }
        } else if (res.status === 'PROCESSING') {
          // 진행 중이면 폴링 시작
          setAnalysisStatus('PROCESSING');
          setAnalysisElapsed(res.elapsed || 0);
          startPolling();
        }
      } catch { /* 무시 */ }
    };
    checkExisting();
    return () => stopPolling();
  }, [projectId]);

  // 폴링 시작
  const startPolling = () => {
    stopPolling();
    // 경과 시간 타이머
    elapsedTimerRef.current = setInterval(() => {
      setAnalysisElapsed((prev) => prev + 1);
    }, 1000);
    // 결과 폴링 (5초마다)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await getProductionResult(projectId);
        if (res.status === 'COMPLETED' && res.data?.length >= 2) {
          const v1 = res.data.find((d: any) => d.version === 1);
          const v2 = res.data.find((d: any) => d.version === 2);
          if (v1 && v2) {
            setResult({ v1: mapDbToResult(v1), v2: mapDbToResult(v2) });
            setAnalysisStatus('COMPLETED');
            stopPolling();
          }
        } else if (res.status === 'FAILED') {
          setAnalysisStatus('FAILED');
          setAnalysisError(res.error || '분석 중 오류가 발생했습니다');
          stopPolling();
        }
      } catch { /* 네트워크 오류 시 폴링 계속 */ }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
  };

  // 분석 시작
  const handleAnalysis = async () => {
    const videoIds = references.map((r) => r.id);
    if (videoIds.length === 0) return;
    setAnalysisStatus('PROCESSING');
    setAnalysisElapsed(0);
    setAnalysisError('');
    try {
      await startProduction(projectId, videoIds);
      startPolling();
    } catch (err: any) {
      setAnalysisStatus('FAILED');
      setAnalysisError(err.message || '분석 시작에 실패했습니다');
    }
  };

  // 참고영상 추가 후 리로드
  const handleRefAdded = () => {
    loadRefs();
  };

  // 채팅 전송
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await refineScript(projectId, userMsg, activeVersion, chatMessages);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // DB 필드명 매핑
  const SECTION_TO_DB_FIELD: Record<AnalysisSection, string> = {
    research: 'opusReview',
    introMaterial: 'introDrafts',
    coreValue: 'coreValue',
    script: 'scriptDraft',
    thumbnailText: 'thumbnailStrategies',
    titleSuggestions: 'titles',
    hashtags: 'hashtags',
    description: 'description',
  };

  // 편집 시작
  const handleEditStart = () => {
    if (!currentResult) return;
    setEditingSection(activeSection);
    const value = currentResult[activeSection];
    if (Array.isArray(value)) {
      setEditContent((value as string[]).join('\n'));
    } else {
      setEditContent(String(value));
    }
  };

  // 편집 저장
  const handleEditSave = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const dbField = SECTION_TO_DB_FIELD[editingSection];
      let value: any = editContent;
      // 배열 필드
      if (editingSection === 'titleSuggestions' || editingSection === 'hashtags') {
        value = editContent.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
      }
      await updateProductionField(projectId, activeVersion, dbField, value);
      // 로컬 상태 업데이트
      if (result) {
        const updated = { ...result };
        const target = activeVersion === 1 ? updated.v1 : updated.v2;
        (target as any)[editingSection] = editingSection === 'titleSuggestions' || editingSection === 'hashtags'
          ? value : editContent;
        setResult(updated);
      }
      setEditingSection(null);
    } catch {
      // 저장 실패
    } finally {
      setSaving(false);
    }
  };

  const currentResult = result
    ? activeVersion === 1 ? result.v1 : result.v2
    : null;

  // 분석 중 진행 메시지
  const PROGRESS_MESSAGES = [
    { at: 0, msg: 'AI가 레퍼런스 영상을 분석하고 있습니다...' },
    { at: 30, msg: '자막과 댓글을 분석하고 있습니다...' },
    { at: 60, msg: '코어 밸류와 인트로 소재를 추출 중...' },
    { at: 120, msg: '대본 초안을 작성하고 있습니다...' },
    { at: 180, msg: '대본 검수 및 최적화 중...' },
    { at: 240, msg: '메타데이터(제목, 해시태그) 생성 중...' },
    { at: 300, msg: '거의 완료! 최종 정리 중...' },
  ];

  const getProgressMessage = (elapsed: number) => {
    let msg = PROGRESS_MESSAGES[0].msg;
    for (const p of PROGRESS_MESSAGES) {
      if (elapsed >= p.at) msg = p.msg;
    }
    return msg;
  };

  return (
    <div className="space-y-8">
      {/* 참고 영상 섹션 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-md">
            참고 영상
          </span>
          <h3 className="text-white font-semibold text-sm">레퍼런스</h3>
        </div>

        {refsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : references.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {references.map((ref) => (
                <a
                  key={ref.id}
                  href={`https://youtube.com/watch?v=${ref.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group"
                >
                  <div className="relative w-full aspect-video bg-gray-900">
                    {ref.thumbnailUrl ? (
                      <img src={ref.thumbnailUrl} alt={ref.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-gray-700" /></div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 py-0.5 rounded">
                      {formatNumber(ref.viewCount)}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-white text-xs leading-snug line-clamp-2 mb-1">{ref.title}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                      <span className="truncate">{ref.channelName}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 text-gray-600" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {/* 추가 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode(addMode === 'link' ? 'none' : 'link')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${addMode === 'link' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
              >
                <Link2 className="w-3 h-3 inline mr-1" />링크 추가
              </button>
              <button
                onClick={() => setAddMode(addMode === 'search' ? 'none' : 'search')}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${addMode === 'search' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
              >
                <Search className="w-3 h-3 inline mr-1" />주제찾기
              </button>
            </div>
            <AnimatePresence>
              {addMode === 'link' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <DirectLinkInput projectId={projectId} onAdded={handleRefAdded} />
                </motion.div>
              )}
              {addMode === 'search' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <InlineTopicSearch projectId={projectId} onAdded={handleRefAdded} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <Info className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-1">참고 영상이 없습니다</p>
              <p className="text-gray-600 text-xs mb-4">아래에서 직접 링크를 추가하거나 키워드로 검색해보세요</p>
            </div>

            {/* 직접 링크 입력 */}
            <div>
              <p className="text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> YouTube 링크로 추가
              </p>
              <DirectLinkInput projectId={projectId} onAdded={handleRefAdded} />
            </div>

            <div className="border-t border-gray-800 pt-4">
              <p className="text-gray-400 text-xs font-medium mb-2 flex items-center gap-1">
                <Search className="w-3 h-3" /> 키워드로 참고영상 찾기
              </p>
              <InlineTopicSearch projectId={projectId} onAdded={handleRefAdded} />
            </div>

            {onSwitchToDiscover && (
              <button
                onClick={onSwitchToDiscover}
                className="w-full text-xs text-violet-400 hover:text-violet-300 py-2 transition-colors"
              >
                ← 주제찾기 탭에서 더 다양한 검색 →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 분석 & 제작 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-md">
            AI 제작
          </span>
          <h3 className="text-white font-semibold text-sm">분석 & 대본</h3>
        </div>

        {analysisStatus === 'PROCESSING' ? (
          /* 분석 진행 중 UI */
          <div className="bg-gray-900 border border-violet-500/30 rounded-2xl p-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-violet-400" />
            </div>
            <p className="text-white font-medium text-sm mb-2">
              {references.length}개 레퍼런스 기반으로 분석합니다
            </p>
            <p className="text-violet-300 text-xs mb-1">
              {getProgressMessage(analysisElapsed)}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              경과 시간: {formatElapsed(analysisElapsed)} (보통 3~8분 소요)
            </p>
            {/* 프로그레스 바 */}
            <div className="w-full max-w-xs mx-auto bg-gray-800 rounded-full h-1.5 mb-3">
              <div
                className="bg-violet-500 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(95, (analysisElapsed / 360) * 100)}%` }}
              />
            </div>
            <p className="text-gray-600 text-[10px]">
              페이지를 닫아도 분석은 계속 진행됩니다
            </p>
          </div>
        ) : analysisStatus === 'FAILED' ? (
          /* 분석 실패 UI */
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 text-sm mb-2">분석에 실패했습니다</p>
            <p className="text-gray-500 text-xs mb-4">{analysisError}</p>
            <button
              onClick={handleAnalysis}
              disabled={references.length === 0}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        ) : !result ? (
          /* 분석 전 UI */
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
            <p className="text-gray-300 text-sm mb-1">
              {references.length > 0
                ? `${references.length}개 레퍼런스 기반으로 분석합니다`
                : '먼저 위에서 참고 영상을 추가해주세요'}
            </p>
            <p className="text-gray-500 text-xs mb-5">
              리서치, 인트로 소재, 코어 밸류, 대본, 썸네일, 제목, 해시태그 자동 생성
            </p>
            <button
              onClick={handleAnalysis}
              disabled={references.length === 0}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              분석 시작
            </button>
          </div>
        ) : (
          /* 분석 결과 UI */
          <div className="space-y-4">
            {/* 버전 탭 */}
            <div className="flex gap-2">
              {([1, 2] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveVersion(v)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeVersion === v
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                  }`}
                >
                  버전 {v}
                </button>
              ))}
              {/* 재분석 버튼 */}
              <button
                onClick={handleAnalysis}
                className="ml-auto px-3 py-2 bg-gray-800 text-gray-400 hover:text-white border border-gray-700 rounded-xl text-xs transition-colors"
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                재분석
              </button>
            </div>

            {/* 섹션 네비게이션 */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SECTION_LABELS) as AnalysisSection[]).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === section
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-gray-800 text-gray-500 hover:text-gray-300 border border-gray-700'
                  }`}
                >
                  {SECTION_LABELS[section]}
                </button>
              ))}
            </div>

            {/* 섹션 콘텐츠 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeVersion}-${activeSection}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <h4 className="text-white font-semibold text-sm">
                      {SECTION_LABELS[activeSection]}
                    </h4>
                  </div>
                  {/* 편집/채팅 버튼 */}
                  <div className="flex items-center gap-1.5">
                    {editingSection === activeSection ? (
                      <>
                        <button
                          onClick={handleEditSave}
                          disabled={saving}
                          className="text-xs px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          저장
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="text-xs px-2.5 py-1.5 bg-gray-700 text-gray-300 rounded-lg transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditStart}
                        className="text-xs px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 border border-gray-700"
                      >
                        <Pencil className="w-3 h-3" />
                        수정
                      </button>
                    )}
                  </div>
                </div>

                {/* 편집 모드 */}
                {editingSection === activeSection ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={15}
                    className="w-full bg-gray-950 border border-gray-600 rounded-xl px-4 py-3 text-gray-200 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-y font-mono leading-relaxed"
                  />
                ) : currentResult ? (
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {activeSection === 'titleSuggestions' || activeSection === 'hashtags'
                      ? Array.isArray(currentResult[activeSection])
                        ? (currentResult[activeSection] as string[]).join('\n')
                        : String(currentResult[activeSection])
                      : String(currentResult[activeSection])}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            {/* AI 대화형 수정 */}
            <div className="mt-4">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  chatOpen
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                AI와 대화하며 수정
              </button>

              {chatOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden"
                >
                  {/* 채팅 메시지 */}
                  <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 && (
                      <p className="text-gray-500 text-xs text-center py-4">
                        대본에 대해 궁금한 점이나 수정하고 싶은 부분을 말씀해주세요
                      </p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-violet-600 text-white'
                              : 'bg-gray-800 text-gray-300 border border-gray-700'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl">
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 입력 */}
                  <div className="border-t border-gray-800 p-3 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="예: 인트로를 더 임팩트 있게 바꿔줘"
                      className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={chatLoading || !chatInput.trim()}
                      className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white px-3 py-2 rounded-xl transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 타임라인 섹션 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-white font-semibold text-sm">타임라인</h3>
          <span className="text-gray-600 text-xs">(영상 완성 후 작성)</span>
        </div>
        <textarea
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="00:00 인트로&#10;01:30 본론&#10;..."
          rows={6}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none font-mono leading-relaxed"
        />
      </section>

      {/* 다음 단계 힌트 */}
      <div className="flex items-center gap-2 text-gray-600 text-xs">
        <ChevronRight className="w-3 h-3" />
        <span>숏폼 제작은 [숏폼제작] 탭에서</span>
      </div>
    </div>
  );
}
