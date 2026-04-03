'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckSquare,
  Square,
  Loader2,
  ChevronRight,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import { searchVideos, startProduction, getProductionResult, YtSearchResult, YtProductionResult } from '../../lib/api';

interface ProductionTabProps {
  projectId: string;
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

export default function ProductionTab({ projectId }: ProductionTabProps) {
  // STEP 1: 검색
  const [keyword, setKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<YtSearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // STEP 2: 분석
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [result, setResult] = useState<{
    v1: YtProductionResult;
    v2: YtProductionResult;
  } | null>(null);
  const [activeVersion, setActiveVersion] = useState<1 | 2>(1);
  const [activeSection, setActiveSection] = useState<AnalysisSection>('research');

  // 타임라인
  const [timeline, setTimeline] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchVideos(keyword);
      setSearchResults(results);
    } catch {
      // 검색 실패 시 빈 결과
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleSelect = (videoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(videoId)) return prev.filter((id) => id !== videoId);
      if (prev.length >= 6) return prev;
      return [...prev, videoId];
    });
  };

  const handleAnalysis = async () => {
    if (selectedIds.length === 0) return;
    setAnalysisLoading(true);
    try {
      await startProduction(projectId, selectedIds);
      // 폴링 대신 결과 직접 조회 (백엔드 구현에 따라 조정)
      const data = await getProductionResult(projectId);
      setResult(data);
    } catch {
      // 분석 실패
    } finally {
      setAnalysisLoading(false);
    }
  };

  const formatViewRatio = (result: YtSearchResult) => {
    if (!result.subscriberCount || result.subscriberCount === 0) return '';
    const ratio = (result.viewCount / result.subscriberCount) * 100;
    return `${ratio.toFixed(1)}%`;
  };

  const formatNumber = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
    return String(n);
  };

  const currentResult = result
    ? activeVersion === 1
      ? result.v1
      : result.v2
    : null;

  return (
    <div className="space-y-8">
      {/* STEP 1: 주제 찾기 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-md">
            STEP 1
          </span>
          <h3 className="text-white font-semibold text-sm">주제 찾기</h3>
        </div>

        {/* 키워드 검색 */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드 입력 (예: 엔진오일 교환)"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading || !keyword.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
          >
            {searchLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '검색'
            )}
          </button>
        </form>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-gray-500 text-xs mb-3">
              최대 6개 선택 가능 ({selectedIds.length}/6)
            </p>
            {searchResults.map((video) => {
              const selected = selectedIds.includes(video.videoId);
              return (
                <button
                  key={video.videoId}
                  onClick={() => toggleSelect(video.videoId)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selected
                      ? 'bg-violet-500/10 border-violet-500/40'
                      : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-gray-500">
                    {selected ? (
                      <CheckSquare className="w-4 h-4 text-violet-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-snug mb-1 line-clamp-2">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                      <span>{video.channelName}</span>
                      <span>조회수 {formatNumber(video.viewCount)}</span>
                      {video.subscriberCount > 0 && (
                        <span>구독자 {formatNumber(video.subscriberCount)}</span>
                      )}
                      {formatViewRatio(video) && (
                        <span className="text-amber-400">
                          뷰/구독 {formatViewRatio(video)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* STEP 2~5: 분석 실행 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-md">
            STEP 2-5
          </span>
          <h3 className="text-white font-semibold text-sm">분석 & 제작</h3>
        </div>

        {!result ? (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
            <p className="text-gray-300 text-sm mb-1">
              {selectedIds.length > 0
                ? `${selectedIds.length}개 영상을 기반으로 분석을 시작합니다`
                : '먼저 참고 영상을 선택해주세요'}
            </p>
            <p className="text-gray-500 text-xs mb-5">
              리서치, 인트로 소재, 코어 밸류, 대본, 썸네일, 제목, 해시태그 자동 생성
            </p>
            <button
              onClick={handleAnalysis}
              disabled={analysisLoading || selectedIds.length === 0}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {analysisLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  분석 시작
                </>
              )}
            </button>
          </div>
        ) : (
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
            </div>

            {/* 섹션 네비게이션 */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SECTION_LABELS) as AnalysisSection[]).map(
                (section) => (
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
                )
              )}
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
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <h4 className="text-white font-semibold text-sm">
                    {SECTION_LABELS[activeSection as AnalysisSection]}
                  </h4>
                </div>
                {currentResult && (
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {activeSection === 'titleSuggestions' ||
                    activeSection === 'hashtags'
                      ? Array.isArray(currentResult[activeSection])
                        ? (currentResult[activeSection] as string[]).join(
                            '\n'
                          )
                        : String(currentResult[activeSection])
                      : String(currentResult[activeSection])}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
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
        <span>숏폼 제작은 [숏폼] 탭에서</span>
      </div>
    </div>
  );
}
