'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  PlayCircle,
  Check,
  FileText,
  Search,
  Image,
  BookOpen,
  FolderOpen,
  Smartphone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProject, completeProject, YtProject } from '../../lib/api';
import DiscoverTab from '../../components/tabs/DiscoverTab';
import ProjectCardTab from '../../components/tabs/ProjectCardTab';
import ShortformTab from '../../components/tabs/ShortformTab';
import LearningTab from '../../components/tabs/LearningTab';
import CleanupTab from '../../components/tabs/CleanupTab';
import ThumbnailTab from '../../components/tabs/ThumbnailTab';

// ─── 탭 정의 ─────────────────────────────────────
type Tab = '프로젝트카드' | '주제찾기' | '썸네일' | '학습' | '정리' | '숏폼제작';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: '프로젝트카드', label: '프로젝트카드', icon: FileText },
  { id: '주제찾기', label: '주제찾기', icon: Search },
  { id: '썸네일', label: '썸네일', icon: Image },
  { id: '학습', label: '학습', icon: BookOpen },
  { id: '정리', label: '정리', icon: FolderOpen },
  { id: '숏폼제작', label: '숏폼제작', icon: Smartphone },
];

// ─── 유틸 ─────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState<Tab>('프로젝트카드');
  const [completing, setCompleting] = useState(false);

  // 한 번 로드한 탭은 언마운트하지 않음 (insightLoaded 패턴)
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set(['프로젝트카드']));

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
    if (!project || project.status === 'COMPLETED') return;
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

  // ─── 로딩 ─────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const isCompleted = project.status === 'COMPLETED';

  return (
    <div className="h-[calc(100vh-57px)] flex bg-gray-950">
      {/* ─── 왼쪽 사이드바 ─── */}
      <aside className="w-52 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* 뒤로가기 */}
        <div className="px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => router.push('/yt')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            목록
          </button>
        </div>

        {/* 프로젝트 정보 */}
        <div className="px-4 py-4 border-b border-gray-800">
          {/* 상태 뱃지 */}
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/25 mb-2">
              <CheckCircle2 className="w-3 h-3" />
              완료
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/15 text-violet-400 text-xs font-medium rounded-full border border-violet-500/25 mb-2">
              <PlayCircle className="w-3 h-3" />
              진행 중
            </span>
          )}

          {/* 제목 */}
          <h2 className="text-white font-bold text-sm leading-snug line-clamp-2 mb-1">
            {project.title}
          </h2>

          {/* 날짜 */}
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.shootingDate)}</span>
          </div>

          {/* 완료 버튼 */}
          {!isCompleted && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/25 text-gray-400 border border-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {completing ? '처리 중...' : '완료 처리'}
            </button>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600/15 text-violet-400 border-l-2 border-violet-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border-l-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── 오른쪽 콘텐츠 영역 ─── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* 버그 수정: motion.div key={activeTab} 제거 — hidden 패턴과 충돌 */}
          <div>
            <div className={activeTab === '프로젝트카드' ? '' : 'hidden'}>
              {loadedTabs.has('프로젝트카드') && <ProjectCardTab currentProjectId={id} />}
            </div>
            <div className={activeTab === '주제찾기' ? '' : 'hidden'}>
              {loadedTabs.has('주제찾기') && <DiscoverTab projectId={id} />}
            </div>
            <div className={activeTab === '썸네일' ? '' : 'hidden'}>
              {loadedTabs.has('썸네일') && <ThumbnailTab />}
            </div>
            <div className={activeTab === '학습' ? '' : 'hidden'}>
              {loadedTabs.has('학습') && <LearningTab projectId={id} />}
            </div>
            <div className={activeTab === '정리' ? '' : 'hidden'}>
              {loadedTabs.has('정리') && <CleanupTab />}
            </div>
            <div className={activeTab === '숏폼제작' ? '' : 'hidden'}>
              {loadedTabs.has('숏폼제작') && <ShortformTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
