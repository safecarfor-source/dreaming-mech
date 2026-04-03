'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, PlayCircle } from 'lucide-react';
import { YtProject } from '../lib/api';

interface ProjectCardProps {
  project: YtProject;
  onClick: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '날짜 미정';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const isCompleted = project.status === 'COMPLETED';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-800 border border-gray-700 rounded-2xl p-5 cursor-pointer hover:border-gray-600 transition-colors group"
    >
      {/* 상태 배지 */}
      <div className="flex items-center justify-between mb-4">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/15 text-violet-400 text-xs font-medium rounded-full border border-violet-500/25">
            <PlayCircle className="w-3 h-3" />
            진행 중
          </span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-white font-semibold text-base leading-snug mb-3 group-hover:text-violet-300 transition-colors line-clamp-2">
        {project.title}
      </h3>

      {/* 촬영일 */}
      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{formatDate(project.shootingDate)}</span>
      </div>
    </motion.div>
  );
}
