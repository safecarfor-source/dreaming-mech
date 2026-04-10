'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, User, Loader2, X } from 'lucide-react';
import { uploadFaceReferences, getFaceReferences, deleteFaceReference } from '../../../lib/api';

interface FaceReference {
  id: string;
  imageUrl: string;
  label?: string;
  createdAt: string;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;

export default function FaceManager() {
  const [faces, setFaces] = useState<FaceReference[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [pendingLabel, setPendingLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFaces = useCallback(async () => {
    setLoadingFetch(true);
    try {
      const data = await getFaceReferences();
      setFaces(Array.isArray(data) ? data : []);
    } catch {
      // 목록 조회 실패는 조용히 처리
    } finally {
      setLoadingFetch(false);
    }
  }, []);

  useEffect(() => {
    loadFaces();
  }, [loadFaces]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!fileArr.length) return;

    const oversized = fileArr.filter(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`파일 크기 초과: ${oversized.map(f => f.name).join(', ')} (최대 ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    if (faces.length + fileArr.length > MAX_FILES) {
      setError(`최대 ${MAX_FILES}장까지 등록 가능합니다.`);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const labels = pendingLabel.trim()
        ? fileArr.map(() => pendingLabel.trim())
        : undefined;
      await uploadFaceReferences(fileArr, labels);
      setPendingLabel('');
      await loadFaces();
    } catch (e) {
      setError('업로드 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setUploading(false);
    }
  }, [faces.length, pendingLabel, loadFaces]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteFaceReference(id);
      setFaces(prev => prev.filter(f => f.id !== id));
    } catch {
      setError('삭제 실패');
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div>
        <h3 className="text-white font-semibold text-sm">얼굴 레퍼런스 관리</h3>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
          최대 {MAX_FILES}장 · 각 {MAX_FILE_SIZE_MB}MB 이하 · JPG, PNG, WEBP
        </p>
      </div>

      {/* 레이블 입력 */}
      <input
        type="text"
        value={pendingLabel}
        onChange={e => setPendingLabel(e.target.value)}
        placeholder='레이블 (선택) — 예: 정면, 측면, 작업복'
        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7C4DFF]/50"
      />

      {/* 드래그앤드롭 업로드 영역 */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
          dragging
            ? 'border-[#7C4DFF] bg-[#7C4DFF]/10'
            : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 text-[#7C4DFF] animate-spin" />
        ) : (
          <Upload className="w-7 h-7 text-gray-500" />
        )}
        <p className="text-gray-400 text-sm">
          {uploading ? '업로드 중...' : '클릭하거나 사진을 드래그하세요'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* 에러 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
          >
            <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-xs leading-relaxed">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 사진 그리드 */}
      {loadingFetch ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#7C4DFF] animate-spin" />
        </div>
      ) : faces.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <User className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 text-sm leading-relaxed">
            대장님 사진을 업로드하면<br />AI 썸네일에 얼굴이 반영됩니다
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {faces.map(face => (
              <motion.div
                key={face.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative group bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
              >
                {/* 사진 */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={face.imageUrl}
                    alt={face.label || '얼굴 레퍼런스'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* 레이블 */}
                {face.label && (
                  <div className="px-2 py-1.5 border-t border-gray-700/60">
                    <p className="text-gray-300 text-xs truncate">{face.label}</p>
                  </div>
                )}

                {/* 삭제 버튼 (호버 시 표시) */}
                <button
                  onClick={() => handleDelete(face.id)}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-600/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 등록 수 표시 */}
      {faces.length > 0 && (
        <p className="text-gray-600 text-xs text-right">
          {faces.length} / {MAX_FILES}장 등록됨
        </p>
      )}
    </div>
  );
}
