'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Loader2,
  Link2,
  FileText,
  Sparkles,
  Play,
  Scissors,
  Star,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { analyzeShortform, ShortformSegment } from '../../lib/api';

interface ShortformTabProps {
  projectId?: string;
}

// 점수 색상
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

// 숏폼 카드 컴포넌트
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
      {/* 헤더 */}
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

        {/* 타임코드 */}
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

        {/* 점수 바 */}
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

        {/* 이유 + 합성 구간 토글 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span>상세 정보</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 확장 영역 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 space-y-3">
              {/* 이유 */}
              <div>
                <p className="text-gray-500 text-[10px] font-medium mb-1">왜 이 구간인가</p>
                <p className="text-gray-300 text-xs leading-relaxed">{segment.reason}</p>
              </div>

              {/* 합성 구간 */}
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

              {/* 편집 가이드 */}
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

// ─── 메인 ShortformTab ──────────────────────────────
export default function ShortformTab({ projectId }: ShortformTabProps) {
  const [mode, setMode] = useState<'url' | 'project'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    videoTitle: string;
    transcriptLength: number;
    segments: ShortformSegment[];
  } | null>(null);

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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/25 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">숏폼 제작</h3>
          <p className="text-gray-500 text-xs">롱폼 영상 → AI 자동 숏폼 구간 추천</p>
        </div>
      </div>

      {/* 결과가 없을 때: 입력 UI */}
      {!result ? (
        <div className="space-y-4">
          {/* 모드 선택 */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                mode === 'url'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              YouTube URL
            </button>
            {projectId && (
              <button
                onClick={() => setMode('project')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === 'project'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                현재 프로젝트 대본
              </button>
            )}
          </div>

          {/* URL 입력 */}
          {mode === 'url' && (
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
          )}

          {mode === 'project' && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-300 text-sm">현재 프로젝트의 대본을 기반으로 숏폼 구간을 분석합니다</p>
              <p className="text-gray-500 text-xs mt-1">먼저 [AI 제작] 탭에서 대본을 생성해주세요</p>
            </div>
          )}

          {/* 분석 시작 버튼 */}
          <button
            onClick={handleAnalyze}
            disabled={loading || (mode === 'url' && !videoUrl.trim())}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                자막 분석 중... (30초~1분 소요)
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                숏폼 구간 분석 시작
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          {/* 안내 */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-400 text-xs font-medium">이 기능은...</p>
            <ul className="text-gray-500 text-xs space-y-1.5 ml-4 list-disc">
              <li>롱폼 영상의 자막을 AI가 분석합니다</li>
              <li>숏폼으로 만들기 좋은 구간 5개를 추천합니다</li>
              <li>각 구간의 훅 타이틀, 합성 구간, 편집 가이드를 제공합니다</li>
              <li>여러 구간을 합성해서 60초 숏폼을 만들 수 있습니다</li>
            </ul>
          </div>
        </div>
      ) : (
        /* 결과 UI */
        <div className="space-y-4">
          {/* 결과 헤더 */}
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

          {/* 숏폼 카드 목록 */}
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
      )}
    </div>
  );
}
