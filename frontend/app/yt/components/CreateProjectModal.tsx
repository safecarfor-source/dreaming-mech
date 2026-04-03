'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createProject, YtProject } from '../lib/api';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: YtProject) => void;
}

export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [shootingDate, setShootingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const project = await createProject({
        title: title.trim(),
        shootingDate: shootingDate || undefined,
      });
      onCreated(project);
      handleClose();
    } catch {
      setError('프로젝트 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setShootingDate('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md pointer-events-auto shadow-2xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
                <h2 className="text-white font-semibold text-base">
                  새 프로젝트
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 폼 */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* 제목 */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    영상 주제 / 제목
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 엔진오일 직접 교환하는 방법"
                    autoFocus
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors"
                  />
                </div>

                {/* 촬영 예정일 */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    촬영 예정일
                    <span className="text-gray-500 ml-2 font-normal text-xs">
                      (선택)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={shootingDate}
                    onChange={(e) => setShootingDate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors [color-scheme:dark]"
                  />
                </div>

                {/* 에러 */}
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                {/* 버튼 */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-3 rounded-xl text-sm transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !title.trim()}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl text-sm transition-colors"
                  >
                    {loading ? '생성 중...' : '프로젝트 만들기'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
