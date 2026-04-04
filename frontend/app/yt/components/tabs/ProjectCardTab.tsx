'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Calendar, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProjects, YtProject } from '../../lib/api';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '날짜 미정';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

interface ProjectCardTabProps {
  currentProjectId: string;
}

export default function ProjectCardTab({ currentProjectId }: ProjectCardTabProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<YtProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 로딩
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 프로젝트 목록 그리드 (유튜브 썸네일 스타일)
  const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS');
  const completed = projects.filter((p) => p.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* 진행 중 */}
      {inProgress.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-violet-400" />
            진행 중
            <span className="text-xs text-gray-500">({inProgress.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {inProgress.map((project) => (
              <motion.button
                key={project.id}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/yt/projects/${project.id}`)}
                className={`text-left bg-gray-800 border rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors ${
                  project.id === currentProjectId
                    ? 'border-violet-500/50 ring-1 ring-violet-500/30'
                    : 'border-gray-700'
                }`}
              >
                {/* 썸네일 영역 (그라데이션 배경) */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-violet-900/40 to-gray-900 flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                  {project.id === currentProjectId && (
                    <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      현재
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="p-2.5">
                  <p className="text-white text-xs font-medium leading-snug line-clamp-2 mb-1">
                    {project.title}
                  </p>
                  <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{formatDate(project.shootingDate)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 완료 */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-gray-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            완료
            <span className="text-xs text-gray-500">({completed.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {completed.map((project) => (
              <motion.button
                key={project.id}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/yt/projects/${project.id}`)}
                className="text-left bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors opacity-75 hover:opacity-100"
              >
                <div className="relative w-full aspect-video bg-gradient-to-br from-emerald-900/30 to-gray-900 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="p-2.5">
                  <p className="text-gray-300 text-xs font-medium leading-snug line-clamp-2 mb-1">
                    {project.title}
                  </p>
                  <div className="flex items-center gap-1 text-gray-600 text-[10px]">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{formatDate(project.shootingDate)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {projects.length === 0 && (
        <div className="py-20 text-center text-gray-500 text-sm">
          아직 프로젝트가 없습니다. 주제찾기에서 주제를 선정하세요.
        </div>
      )}
    </div>
  );
}
