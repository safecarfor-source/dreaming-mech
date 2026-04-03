'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProjects, YtProject } from './lib/api';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';

export default function YtPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<YtProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const inProgress = projects.filter((p) => p.status === 'in_progress');
  const completed = projects.filter((p) => p.status === 'completed');

  const handleCreated = (project: YtProject) => {
    setProjects((prev) => [project, ...prev]);
    router.push(`/yt/projects/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-bold text-xl mb-1">프로젝트</h1>
            <p className="text-gray-500 text-sm">
              총 {projects.length}개
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 프로젝트
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          // 빈 상태
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
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
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* 진행 중 섹션 */}
            {inProgress.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-white font-semibold text-sm">진행 중</h2>
                  <span className="text-xs text-violet-400 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-full">
                    {inProgress.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgress.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() =>
                        router.push(`/yt/projects/${project.id}`)
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 완료 섹션 */}
            {completed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-white font-semibold text-sm">완료</h2>
                  <span className="text-xs text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    {completed.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() =>
                        router.push(`/yt/projects/${project.id}`)
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* 생성 모달 */}
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
