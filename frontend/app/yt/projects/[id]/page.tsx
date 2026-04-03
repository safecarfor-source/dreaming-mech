'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle2, PlayCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProject, completeProject, YtProject } from '../../lib/api';
import ProductionTab from '../../components/tabs/ProductionTab';
import ShortformTab from '../../components/tabs/ShortformTab';
import LearningTab from '../../components/tabs/LearningTab';
import CleanupTab from '../../components/tabs/CleanupTab';

type Tab = '제작' | '숏폼' | '학습' | '정리';
const TABS: Tab[] = ['제작', '숏폼', '학습', '정리'];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '날짜 미정';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<YtProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('제작');
  const [completing, setCompleting] = useState(false);

  // 한 번 로드한 탭은 언마운트하지 않음 (insightLoaded 패턴)
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set(['제작']));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProject(id);
        setProject(data);
      } catch {
        router.push('/yt');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setLoadedTabs((prev) => new Set([...prev, tab]));
  };

  const handleComplete = async () => {
    if (!project || project.status === 'completed') return;
    setCompleting(true);
    try {
      const updated = await completeProject(id);
      setProject(updated);
    } catch {
      // 실패 시 무시
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const isCompleted = project.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-950">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* 뒤로가기 + 프로젝트 정보 */}
          <div className="flex items-start gap-4 mb-4">
            <button
              onClick={() => router.push('/yt')}
              className="shrink-0 flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              목록
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/25">
                    <CheckCircle2 className="w-3 h-3" />
                    완료
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/15 text-violet-400 text-xs font-medium rounded-full border border-violet-500/25">
                    <PlayCircle className="w-3 h-3" />
                    진행 중
                  </span>
                )}
              </div>
              <h1 className="text-white font-bold text-base leading-snug truncate">
                {project.title}
              </h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(project.shootingDate)}</span>
              </div>
            </div>

            {/* 완료 버튼 */}
            {!isCompleted && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/25 text-gray-400 border border-gray-700 rounded-xl text-xs font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {completing ? '처리 중...' : '완료 처리'}
              </button>
            )}
          </div>

          {/* 탭 */}
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 한 번 로드된 탭은 hidden으로 유지 */}
          <div className={activeTab === '제작' ? '' : 'hidden'}>
            {loadedTabs.has('제작') && <ProductionTab projectId={id} />}
          </div>
          <div className={activeTab === '숏폼' ? '' : 'hidden'}>
            {loadedTabs.has('숏폼') && <ShortformTab />}
          </div>
          <div className={activeTab === '학습' ? '' : 'hidden'}>
            {loadedTabs.has('학습') && <LearningTab projectId={id} />}
          </div>
          <div className={activeTab === '정리' ? '' : 'hidden'}>
            {loadedTabs.has('정리') && <CleanupTab />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
