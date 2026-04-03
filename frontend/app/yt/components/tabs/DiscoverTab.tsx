'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  TrendingUp,
  Sparkles,
  Play,
  Plus,
  ChevronDown,
} from 'lucide-react';
import {
  discoverChannelVideos,
  discoverByKeyword,
  discoverTrending,
  discoverRecommend,
  getCategories,
} from '../../lib/api';

// ─── 타입 ─────────────────────────────────────────
interface DiscoverVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  thumbnailUrl: string;
  viewCount: number;
  subscriberCount: number;
  viewSubRatio?: number;
  recommendReason?: string;
}

interface Category {
  id: string;
  name: string;
}

// ─── 서브탭 타입 ────────────────────────────────────
type SubTab = '채널탐색' | '키워드검색' | '트렌드' | 'AI추천';
const SUB_TABS: SubTab[] = ['채널탐색', '키워드검색', '트렌드', 'AI추천'];

// ─── 유틸 ────────────────────────────────────────────
function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

function getRatioBadge(ratio: number | undefined): { label: string; className: string } | null {
  if (!ratio) return null;
  if (ratio >= 20) {
    return { label: `${ratio.toFixed(1)}x`, className: 'bg-red-500/20 text-red-400 border border-red-500/30' };
  }
  if (ratio >= 5) {
    return { label: `${ratio.toFixed(1)}x`, className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' };
  }
  return { label: `${ratio.toFixed(1)}x`, className: 'bg-gray-700 text-gray-400 border border-gray-600' };
}

// ─── 영상 카드 (채널탐색 / AI추천용) ────────────────────
function VideoCard({
  video,
  onAddToProject,
  showReason,
}: {
  video: DiscoverVideo;
  onAddToProject?: (video: DiscoverVideo) => void;
  showReason?: boolean;
}) {
  const badge = getRatioBadge(video.viewSubRatio);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors">
      {/* 썸네일 */}
      <div className="relative w-full aspect-video bg-gray-900">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-700" />
          </div>
        )}
        {/* 조회수 오버레이 */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-medium">
          조회 {formatNumber(video.viewCount)}
        </div>
      </div>

      {/* 정보 */}
      <div className="p-3">
        <p className="text-white text-sm font-medium leading-snug line-clamp-2 mb-2">
          {video.title}
        </p>
        {/* 핵심 지표 — 눈에 띄게 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 bg-gray-900 text-blue-400 rounded-md font-medium">
            조회 {formatNumber(video.viewCount)}
          </span>
          {video.subscriberCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gray-900 text-gray-400 rounded-md font-medium">
              구독 {formatNumber(video.subscriberCount)}
            </span>
          )}
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 truncate max-w-[160px]">{video.channelName}</span>
          {onAddToProject && (
            <button
              onClick={() => onAddToProject(video)}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-blue-600/80 text-gray-300 hover:text-white border border-gray-600 hover:border-blue-500/50 rounded-lg transition-colors whitespace-nowrap"
            >
              + 추가
            </button>
          )}
        </div>

        {/* AI 추천 이유 */}
        {showReason && video.recommendReason && (
          <div className="mt-3 p-2.5 bg-gray-900 border border-gray-700 rounded-xl">
            <p className="text-gray-400 text-xs leading-relaxed">{video.recommendReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 채널탐색 서브탭 ────────────────────────────────────
function ChannelDiscoverPane() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('전체');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoverVideo[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    getCategories()
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setStarted(true);
    try {
      const data = await discoverChannelVideos({
        category: selectedCat === '전체' ? undefined : selectedCat,
        limit: 20,
      });
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const catList = ['전체', ...categories.map((c) => c.name)];

  return (
    <div className="space-y-5">
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        {catList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCat === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 분석 시작 버튼 */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            등록된 채널 분석 중...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            분석 시작
          </>
        )}
      </button>

      {/* 결과 */}
      {started && !loading && results.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          결과가 없습니다. 채널을 먼저 등록해주세요.
        </div>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((v) => (
            <VideoCard key={v.videoId} video={v} onAddToProject={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 키워드 검색 서브탭 ───────────────────────────────────
function KeywordSearchPane() {
  const [keyword, setKeyword] = useState('');
  const [language, setLanguage] = useState('전체');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoverVideo[]>([]);

  const LANG_MAP: Record<string, string | undefined> = {
    전체: undefined,
    한국어: 'ko',
    영어: 'en',
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const data = await discoverByKeyword({
        keyword,
        language: LANG_MAP[language],
        maxResults: 50,
      });
      const arr: DiscoverVideo[] = Array.isArray(data) ? data : [];
      // viewSubRatio 내림차순 정렬
      arr.sort((a, b) => (b.viewSubRatio ?? 0) - (a.viewSubRatio ?? 0));
      setResults(arr);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const badge = (ratio?: number) => getRatioBadge(ratio);

  return (
    <div className="space-y-5">
      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색 키워드 입력 (예: 타이어 교체)"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        {/* 언어 선택 */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none bg-gray-800 border border-gray-700 rounded-xl pl-3 pr-7 py-2.5 text-gray-300 text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {['전체', '한국어', '영어'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
        <button
          type="submit"
          disabled={loading || !keyword.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
        </button>
      </form>

      {/* 결과 리스트 (테이블형) */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs">{results.length}개 결과 (뷰/구독 비율 높은 순)</p>
          {results.map((v) => {
            const b = badge(v.viewSubRatio);
            return (
              <div
                key={v.videoId}
                className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
              >
                {/* 썸네일 */}
                <div className="w-20 aspect-video shrink-0 bg-gray-900 rounded-lg overflow-hidden">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-700" />
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-snug line-clamp-2 mb-1">{v.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span className="truncate max-w-[100px]">{v.channelName}</span>
                    <span>조회 {formatNumber(v.viewCount)}</span>
                    {v.subscriberCount > 0 && <span>구독 {formatNumber(v.subscriberCount)}</span>}
                  </div>
                </div>
                {/* 배지 + 버튼 */}
                <div className="shrink-0 flex items-center gap-2">
                  {b && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${b.className}`}>
                      {b.label}
                    </span>
                  )}
                  <button className="text-xs px-2.5 py-1.5 bg-gray-700 hover:bg-blue-600/80 text-gray-300 hover:text-white border border-gray-600 hover:border-blue-500/50 rounded-lg transition-colors">
                    + 추가
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 트렌드 서브탭 ────────────────────────────────────────
function TrendingPane() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<DiscoverVideo[]>([]);

  useEffect(() => {
    discoverTrending(24)
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <p className="text-gray-500 text-sm">트렌드 불러오는 중...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500 text-sm">
        트렌드 데이터를 가져오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-xs">썸네일 학습용 — 현재 인기 영상</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {results.map((v) => (
          <div
            key={v.videoId}
            className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group"
          >
            {/* 큰 썸네일 */}
            <div className="relative w-full aspect-video bg-gray-900">
              {v.thumbnailUrl ? (
                <img
                  src={v.thumbnailUrl}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-gray-700" />
                </div>
              )}
              <div className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                {formatNumber(v.viewCount)}
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-white text-xs leading-snug line-clamp-2 mb-1">{v.title}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="truncate max-w-[80px]">{v.channelName}</span>
                <span className="text-blue-400 font-medium">{formatNumber(v.viewCount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI 추천 서브탭 ───────────────────────────────────────
function AiRecommendPane() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoverVideo[]>([]);
  const [started, setStarted] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    setStarted(true);
    try {
      const data = await discoverRecommend();
      setResults(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 버튼 */}
      <div className="flex flex-col items-center py-8 gap-4">
        <div className="w-14 h-14 bg-blue-500/15 border border-blue-500/25 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm mb-1">AI 주제 추천</p>
          <p className="text-gray-500 text-xs">등록된 채널과 트렌드를 분석해 최적의 주제를 추천합니다</p>
        </div>
        <button
          onClick={handleRecommend}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI가 분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI 추천받기
            </>
          )}
        </button>
      </div>

      {/* 결과 */}
      {started && !loading && results.length === 0 && (
        <div className="py-8 text-center text-gray-500 text-sm">
          추천 결과를 가져오지 못했습니다.
        </div>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((v) => (
            <VideoCard key={v.videoId} video={v} showReason onAddToProject={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 DiscoverTab ─────────────────────────────────────
export default function DiscoverTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('채널탐색');
  const [loadedSubTabs, setLoadedSubTabs] = useState<Set<SubTab>>(new Set(['채널탐색']));

  const handleSubTabChange = (tab: SubTab) => {
    setActiveSubTab(tab);
    setLoadedSubTabs((prev) => new Set([...prev, tab]));
  };

  return (
    <div className="space-y-5">
      {/* 서브탭 네비게이션 */}
      <div className="flex gap-1 border-b border-gray-800 pb-0">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleSubTabChange(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeSubTab === tab
                ? 'text-blue-400 border-blue-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab === '트렌드' && <TrendingUp className="w-3.5 h-3.5" />}
            {tab === 'AI추천' && <Sparkles className="w-3.5 h-3.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* 서브탭 콘텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          <div className={activeSubTab === '채널탐색' ? '' : 'hidden'}>
            {loadedSubTabs.has('채널탐색') && <ChannelDiscoverPane />}
          </div>
          <div className={activeSubTab === '키워드검색' ? '' : 'hidden'}>
            {loadedSubTabs.has('키워드검색') && <KeywordSearchPane />}
          </div>
          <div className={activeSubTab === '트렌드' ? '' : 'hidden'}>
            {loadedSubTabs.has('트렌드') && <TrendingPane />}
          </div>
          <div className={activeSubTab === 'AI추천' ? '' : 'hidden'}>
            {loadedSubTabs.has('AI추천') && <AiRecommendPane />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
