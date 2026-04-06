'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Loader2,
  Link2,
  FileText,
  Sparkles,
  Scissors,
  Star,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Film,
  X,
  History,
} from 'lucide-react';
import {
  analyzeShortform,
  ShortformSegment,
  uploadShortformVideo,
  getShortformJobStatus,
  getShortformDownloadUrl,
  ShortformJobStatus,
  ShortformJobResult,
  saveShortformJob,
  listShortformJobs,
  SavedShortformJob,
} from '../../lib/api';

interface ShortformTabProps {
  projectId?: string;
}

// ─── 점수 유틸 ────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-gray-500';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/15 border-emerald-500/25';
  if (score >= 60) return 'bg-amber-500/15 border-amber-500/25';
  return 'bg-gray-800 border-gray-700';
}

// ─── Phase 1 숏폼 카드 ───────────────────────────────
function ShortformCard({ segment, rank }: { segment: ShortformSegment; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const avgScore = Math.round((segment.hookScore + segment.storyScore + segment.viralScore) / 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              rank === 0 ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}>
              {rank + 1}
            </span>
            <div>
              <p className="text-white font-semibold text-sm">{segment.hookTitle}</p>
              <p className="text-gray-500 text-xs">{segment.subTitle}</p>
            </div>
          </div>
          <div className={`text-xs font-bold px-2 py-1 rounded-lg border ${scoreBg(avgScore)}`}>
            <span className={scoreColor(avgScore)}>{avgScore}점</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3 h-3" />
            {segment.startTime} → {segment.endTime}
          </div>
          {segment.segments && segment.segments.length > 1 && (
            <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
              <Scissors className="w-3 h-3 inline mr-1" />
              {segment.segments.length}개 구간 합성
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-gray-500">훅 파워</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1.5">
              <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${segment.hookScore}%` }} />
            </div>
            <span className={`text-xs font-medium ${scoreColor(segment.hookScore)}`}>{segment.hookScore}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-gray-500">서사</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1.5">
              <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${segment.storyScore}%` }} />
            </div>
            <span className={`text-xs font-medium ${scoreColor(segment.storyScore)}`}>{segment.storyScore}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] text-gray-500">바이럴</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1.5">
              <div className="bg-rose-400 h-1.5 rounded-full transition-all" style={{ width: `${segment.viralScore}%` }} />
            </div>
            <span className={`text-xs font-medium ${scoreColor(segment.viralScore)}`}>{segment.viralScore}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span>상세 정보</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 space-y-3">
              <div>
                <p className="text-gray-500 text-[10px] font-medium mb-1">왜 이 구간인가</p>
                <p className="text-gray-300 text-xs leading-relaxed">{segment.reason}</p>
              </div>
              {segment.segments && segment.segments.length > 0 && (
                <div>
                  <p className="text-gray-500 text-[10px] font-medium mb-1.5">합성 구간</p>
                  <div className="space-y-1.5">
                    {segment.segments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-1.5">
                        <span className="text-violet-400 text-xs font-mono">{seg.start}-{seg.end}</span>
                        <span className="text-gray-400 text-xs">{seg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
                <p className="text-gray-500 text-[10px] font-medium mb-1.5">편집 가이드</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>📱 비율: 9:16 (세로형)</p>
                  <p>🎬 상단: <span className="text-white font-medium">{segment.hookTitle}</span> (큰 글씨 + 배경색)</p>
                  <p>📝 하단: <span className="text-gray-300">{segment.subTitle}</span></p>
                  <p>⏱️ 길이: 60초 이내 권장</p>
                  {segment.segments && segment.segments.length > 1 && (
                    <p>✂️ {segment.segments.length}개 구간을 이어붙여 편집</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Phase 2 상태 표시 ────────────────────────────────
const STATUS_STEPS: Array<{ key: ShortformJobStatus['status']; label: string }> = [
  { key: 'TRANSCRIBING', label: '음성 인식' },
  { key: 'ANALYZING', label: 'AI 분석' },
  { key: 'PROCESSING', label: '영상 처리' },
  { key: 'COMPLETED', label: '완료' },
];

const STATUS_ORDER = ['UPLOADING', 'TRANSCRIBING', 'ANALYZING', 'PROCESSING', 'COMPLETED', 'FAILED'];

function ProcessingProgress({ jobStatus }: { jobStatus: ShortformJobStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(jobStatus.status);

  return (
    <div className="space-y-4">
      {/* 진행 메시지 */}
      <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3">
        {jobStatus.status === 'FAILED' ? (
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        ) : jobStatus.status === 'COMPLETED' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
        )}
        <p className="text-sm text-gray-300">{jobStatus.progress || '처리 중...'}</p>
      </div>

      {/* 스텝 표시 */}
      <div className="flex items-center gap-1">
        {STATUS_STEPS.map((step, i) => {
          const stepIdx = STATUS_ORDER.indexOf(step.key);
          const done = currentIdx > stepIdx || jobStatus.status === 'COMPLETED';
          const active = STATUS_ORDER[currentIdx] === step.key;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 rounded-full h-1 transition-colors ${
                done ? 'bg-violet-500' : active ? 'bg-violet-500/50' : 'bg-gray-700'
              }`} />
              {i === STATUS_STEPS.length - 1 && (
                <span className={`text-[10px] whitespace-nowrap ${
                  done ? 'text-emerald-400' : active ? 'text-violet-400' : 'text-gray-600'
                }`}>
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase 2 결과 다운로드 카드 ───────────────────────
function ShortformDownloadCard({ result, jobId, index }: { result: ShortformJobResult; jobId: string; index: number }) {
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = () => {
    setDownloadError('');
    // api.ts의 getShortformDownloadUrl 사용 (토큰을 쿼리파라미터로 일관되게 전달)
    const url = getShortformDownloadUrl(jobId, index);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`다운로드 실패 (${r.status})`);
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `shortform_${index + 1}_${result.hookTitle.slice(0, 8)}.mp4`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err: any) => {
        setDownloadError(err.message || '다운로드에 실패했습니다');
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800 border border-emerald-500/25 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-white font-semibold text-sm">{result.hookTitle}</p>
            <p className="text-gray-500 text-xs">{result.subTitle}</p>
          </div>
        </div>
        <Film className="w-4 h-4 text-emerald-400" />
      </div>

      {result.error ? (
        <p className="text-red-400 text-xs text-center py-2.5">렌더링 실패</p>
      ) : (
        <>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            숏폼 다운로드
          </button>
          {downloadError && (
            <p className="text-red-400 text-xs text-center mt-1">{downloadError}</p>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── 메인 ShortformTab ──────────────────────────────
export default function ShortformTab({ projectId }: ShortformTabProps) {
  // Phase 1 상태
  const [mode, setMode] = useState<'url' | 'project' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    videoTitle: string;
    transcriptLength: number;
    segments: ShortformSegment[];
  } | null>(null);

  // Phase 2 상태
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ShortformJobStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 저장된 작업 이력
  const [savedJobs, setSavedJobs] = useState<SavedShortformJob[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // ─── 페이지 로드 시 저장된 작업 불러오기 ──────────
  useEffect(() => {
    if (!projectId) return;
    setLoadingSaved(true);
    listShortformJobs(projectId)
      .then((jobs) => setSavedJobs(jobs))
      .catch(() => {})
      .finally(() => setLoadingSaved(false));
  }, [projectId]);

  // ─── Phase 1 핸들러 ──────────────────────────────
  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const data = mode === 'url'
        ? await analyzeShortform({ videoUrl })
        : await analyzeShortform({ projectId });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '분석에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ─── Phase 2 핸들러 ──────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('video/') && !file.name.endsWith('.mp4')) {
      setError('mp4 영상 파일만 업로드 가능합니다');
      return;
    }
    setUploadFile(file);
    setError('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const startPolling = (id: string, fileName?: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getShortformJobStatus(id);
        setJobStatus(status);
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          clearInterval(pollingRef.current!);
          setIsProcessing(false);
          // DB에 자동 저장
          if (projectId) {
            saveShortformJob({
              projectId,
              externalJobId: id,
              status: status.status,
              fileName,
              results: status.results,
              error: status.error,
            })
              .then((saved) => {
                setSavedJobs((prev) => [saved, ...prev.filter((j) => j.externalJobId !== id)]);
              })
              .catch(() => {});
          }
        }
      } catch (err: any) {
        clearInterval(pollingRef.current!);
        setIsProcessing(false);
        setError(err.message || '상태 조회 중 오류가 발생했습니다');
      }
    }, 3000);
  };

  const handleUploadProcess = async () => {
    if (!uploadFile) return;
    setIsProcessing(true);
    setError('');
    setJobStatus({ status: 'UPLOADING', progress: '영상 업로드 중...' });
    try {
      const { jobId: id } = await uploadShortformVideo(uploadFile);
      setJobId(id);
      startPolling(id, uploadFile.name);
    } catch (err: any) {
      setError(err.message || '업로드 실패');
      setIsProcessing(false);
      setJobStatus(null);
    }
  };

  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setUploadFile(null);
    setJobId(null);
    setJobStatus(null);
    setIsProcessing(false);
    setError('');
  };

  // ─── 렌더링 ──────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/25 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">숏폼 제작</h3>
          <p className="text-gray-500 text-xs">롱폼 영상 → AI 자동 숏폼 생성</p>
        </div>
      </div>

      {/* 결과 없을 때: 입력 UI */}
      {!result && !jobStatus ? (
        <div className="space-y-4">
          {/* 모드 탭 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                mode === 'url' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              YouTube URL
            </button>
            {projectId && (
              <button
                onClick={() => setMode('project')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'project' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                현재 프로젝트 대본
              </button>
            )}
            <button
              onClick={() => setMode('upload')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                mode === 'upload' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              영상 업로드 (자동 제작)
            </button>
          </div>

          {/* URL 모드 */}
          {mode === 'url' && (
            <>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube URL 붙여넣기 (예: https://youtube.com/watch?v=...)"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !videoUrl.trim()}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />자막 분석 중... (30초~1분 소요)</>
                ) : (
                  <><Sparkles className="w-4 h-4" />숏폼 구간 분석 시작</>
                )}
              </button>
            </>
          )}

          {/* 프로젝트 모드 */}
          {mode === 'project' && (
            <>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-300 text-sm">현재 프로젝트의 대본을 기반으로 숏폼 구간을 분석합니다</p>
                <p className="text-gray-500 text-xs mt-1">먼저 [AI 제작] 탭에서 대본을 생성해주세요</p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />분석 중...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />숏폼 구간 분석 시작</>
                )}
              </button>
            </>
          )}

          {/* 업로드 모드 (Phase 2) */}
          {mode === 'upload' && (
            <div className="space-y-4">
              {/* 드래그앤드롭 영역 */}
              {!uploadFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-900/50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Film className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">영상 파일 드래그 또는 클릭</p>
                  <p className="text-gray-500 text-xs">mp4 파일 (최대 2GB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/*,.mp4"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                /* 파일 선택됨 */
                <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                        <Film className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium truncate max-w-[200px]">{uploadFile.name}</p>
                        <p className="text-gray-500 text-xs">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* 처리 시작 버튼 */}
              <button
                onClick={handleUploadProcess}
                disabled={!uploadFile || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                AI 자동 숏폼 제작 시작
              </button>

              {/* 안내 */}
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-1.5">
                <p className="text-gray-400 text-xs font-medium mb-1">자동 처리 순서</p>
                <p className="text-gray-500 text-xs">① Whisper AI — 음성 자동 인식 (STT)</p>
                <p className="text-gray-500 text-xs">② Claude AI — 구간 3~4개 분석 + 훅 타이틀 생성</p>
                <p className="text-gray-500 text-xs">③ FFmpeg — 9:16 변환 + 텍스트 오버레이</p>
                <p className="text-gray-500 text-xs">④ 완성된 숏폼 mp4 다운로드</p>
                <p className="text-gray-500 text-[10px] mt-2 text-amber-500/70">※ 영상 길이에 따라 3~10분 소요</p>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          {/* Phase 1 안내 (URL/project 모드) */}
          {(mode === 'url' || mode === 'project') && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
              <p className="text-gray-400 text-xs font-medium">이 기능은...</p>
              <ul className="text-gray-500 text-xs space-y-1.5 ml-4 list-disc">
                <li>롱폼 영상의 자막을 AI가 분석합니다</li>
                <li>숏폼으로 만들기 좋은 구간 5개를 추천합니다</li>
                <li>각 구간의 훅 타이틀, 합성 구간, 편집 가이드를 제공합니다</li>
                <li>여러 구간을 합성해서 60초 숏폼을 만들 수 있습니다</li>
              </ul>
            </div>
          )}

          {/* 저장된 숏폼 작업 이력 */}
          {savedJobs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <p className="text-gray-400 text-xs font-medium">이전 제작 이력</p>
              </div>
              {savedJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => {
                    setJobId(job.externalJobId);
                    setJobStatus({
                      status: job.status as ShortformJobStatus['status'],
                      progress: job.status === 'COMPLETED'
                        ? `완료! ${(job.results || []).length}개 숏폼 생성됨`
                        : job.error || '',
                      results: job.results,
                      error: job.error,
                    });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 hover:border-violet-500/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white text-sm truncate max-w-[180px]">
                        {job.fileName || '영상'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'COMPLETED' ? (
                        <span className="text-emerald-400 text-xs">{(job.results || []).length}개 숏폼</span>
                      ) : (
                        <span className="text-red-400 text-xs">실패</span>
                      )}
                      <span className="text-gray-600 text-[10px]">
                        {new Date(job.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {loadingSaved && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              <span className="text-gray-500 text-xs">이전 작업 불러오는 중...</span>
            </div>
          )}
        </div>
      ) : result ? (
        /* Phase 1 결과 UI */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">{result.videoTitle}</p>
              <p className="text-gray-500 text-xs">자막 {result.transcriptLength.toLocaleString()}자 분석 · {result.segments.length}개 구간 추천</p>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
            >
              새로 분석
            </button>
          </div>
          <div className="space-y-3">
            {result.segments.map((seg, i) => (
              <ShortformCard key={seg.id} segment={seg} rank={i} />
            ))}
          </div>
          {result.segments.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm">
              숏폼 구간을 찾지 못했습니다. 다른 영상으로 시도해보세요.
            </div>
          )}
        </div>
      ) : (
        /* Phase 2 처리 중 / 완료 UI */
        <div className="space-y-4">
          {/* 상단: 파일명 + 초기화 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-400" />
              <p className="text-white text-sm font-medium truncate max-w-[200px]">
                {uploadFile?.name || '영상 처리 중'}
              </p>
            </div>
            {!isProcessing && (
              <button
                onClick={handleReset}
                className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
              >
                새로 만들기
              </button>
            )}
          </div>

          {/* 진행 상태 */}
          {jobStatus && <ProcessingProgress jobStatus={jobStatus} />}

          {/* 완료: 다운로드 카드 */}
          {jobStatus?.status === 'COMPLETED' && jobStatus.results && jobId && (
            <div className="space-y-3">
              <p className="text-emerald-400 text-xs font-medium">
                숏폼 {jobStatus.results.length}개 완성! 아래에서 다운로드하세요.
              </p>
              {jobStatus.results.map((r, i) => (
                <ShortformDownloadCard key={i} result={r} jobId={jobId} index={r.index} />
              ))}
            </div>
          )}

          {/* 실패 */}
          {jobStatus?.status === 'FAILED' && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium mb-1">처리 실패</p>
              <p className="text-red-400/70 text-xs">{jobStatus.error || '알 수 없는 오류'}</p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs px-3 py-1.5 bg-gray-800 text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
      )}
    </div>
  );
}
