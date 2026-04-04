'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { getProject, startProduction, getProductionResult, YtProductionResult } from '../../lib/api';

interface ProductionTabProps {
  projectId: string;
}

interface ReferenceVideo {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  viewCount: number;
  subscriberCount: number;
  thumbnailUrl?: string;
  viewSubRatio: number;
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

function formatNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

export default function ProductionTab({ projectId }: ProductionTabProps) {
  // 레퍼런스 영상 (주제찾기에서 추가된 것)
  const [references, setReferences] = useState<ReferenceVideo[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);

  // 분석
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [result, setResult] = useState<{
    v1: YtProductionResult;
    v2: YtProductionResult;
  } | null>(null);
  const [activeVersion, setActiveVersion] = useState<1 | 2>(1);
  const [activeSection, setActiveSection] = useState<AnalysisSection>('research');

  // 타임라인
  const [timeline, setTimeline] = useState('');

  // 프로젝트의 레퍼런스 영상 로드
  useEffect(() => {
    const load = async () => {
      try {
        const project = await getProject(projectId);
        // 프로젝트에 referenceVideos가 있으면 설정
        if (project && (project as any).referenceVideos) {
          setReferences((project as any).referenceVideos);
        }
      } catch {
        // 실패 시 빈 배열
      } finally {
        setRefsLoading(false);
      }
    };
    load();
  }, [projectId]);

  const handleAnalysis = async () => {
    const videoIds = references.map((r) => r.videoId);
    if (videoIds.length === 0) return;
    setAnalysisLoading(true);
    try {
      await startProduction(projectId, videoIds);
      const data = await getProductionResult(projectId);
      setResult(data);
    } catch {
      // 분석 실패
    } finally {
      setAnalysisLoading(false);
    }
  };

  const currentResult = result
    ? activeVersion === 1
      ? result.v1
      : result.v2
    : null;

  return (
    <div className="space-y-8">
      {/* 참고 영상 (주제찾기에서 추가된 레퍼런스) */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {references.map((ref) => (
              <a
                key={ref.id}
                href={`https://youtube.com/watch?v=${ref.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group"
              >
                {/* 썸네일 */}
                <div className="relative w-full aspect-video bg-gray-900">
                  {ref.thumbnailUrl ? (
                    <img
                      src={ref.thumbnailUrl}
                      alt={ref.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-700" />
                    </div>
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
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <Info className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-1">참고 영상이 없습니다</p>
            <p className="text-gray-600 text-xs">주제찾기 탭에서 영상을 검색하고 "추가" 버튼을 눌러주세요</p>
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

        {!result ? (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-3" />
            <p className="text-gray-300 text-sm mb-1">
              {references.length > 0
                ? `${references.length}개 레퍼런스 기반으로 분석합니다`
                : '먼저 주제찾기에서 참고 영상을 추가해주세요'}
            </p>
            <p className="text-gray-500 text-xs mb-5">
              리서치, 인트로 소재, 코어 밸류, 대본, 썸네일, 제목, 해시태그 자동 생성
            </p>
            <button
              onClick={handleAnalysis}
              disabled={analysisLoading || references.length === 0}
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
                        ? (currentResult[activeSection] as string[]).join('\n')
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
        <span>숏폼 제작은 [숏폼제작] 탭에서</span>
      </div>
    </div>
  );
}
