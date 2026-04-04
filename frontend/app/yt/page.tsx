'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProjects, YtProject } from './lib/api';
import CreateProjectModal from './components/CreateProjectModal';

export default function YtPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [noProjects, setNoProjects] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        if (data.length > 0) {
          // 진행 중 프로젝트 우선, 없으면 최신 프로젝트로 이동
          const inProgress = data.filter((p) => p.status === 'IN_PROGRESS');
          const target = inProgress.length > 0 ? inProgress[0] : data[0];
          router.replace(`/yt/projects/${target.id}`);
        } else {
          setNoProjects(true);
        }
      } catch {
        setNoProjects(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleCreated = (project: YtProject) => {
    router.push(`/yt/projects/${project.id}`);
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 프로젝트가 없을 때만 이 화면 표시
  if (!noProjects) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mb-4">
            <FolderOpen className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-gray-400 text-base font-medium mb-2">
            아직 프로젝트가 없습니다
          </p>
          <p className="text-gray-600 text-sm mb-6">
            첫 번째 영상 프로젝트를 만들어보세요
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 프로젝트 만들기
          </button>
        </div>
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
