'use client';

import { useState, useCallback } from 'react';
import { Loader2, Image as ImageIcon, ThumbsUp, ThumbsDown, Trash2, RefreshCw } from 'lucide-react';
import {
  getThumbnails,
  deleteThumbnail,
  saveThumbnailFeedback,
} from '../../../lib/api';
import type { ThumbnailRecord } from './types';

interface GalleryViewProps {
  projectId: string;
}

export default function GalleryView({ projectId }: GalleryViewProps) {
  const [thumbnails, setThumbnails] = useState<ThumbnailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThumbnails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getThumbnails(projectId);
      setThumbnails(data || []);
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 초기 로딩
  useState(() => { loadThumbnails(); });

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteThumbnail(id);
      setThumbnails((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // 조용히 실패
    }
  }, []);

  const handleFeedback = useCallback(async (id: string, rating: 'good' | 'bad') => {
    try {
      await saveThumbnailFeedback({ thumbnailId: id, rating });
    } catch {
      // 조용히 실패
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        아직 생성된 썸네일이 없습니다. &quot;썸네일 만들기&quot; 탭에서 시작해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{thumbnails.length}개 썸네일</div>
        <button onClick={loadThumbnails} className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> 새로고침
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {thumbnails.map((t) => (
          <div key={t.id} className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-800/30">
            {(t.imageUrl || t.baseImageUrl) ? (
              <img src={t.imageUrl || t.baseImageUrl} alt="썸네일" className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}

            {/* 상태 뱃지 */}
            <div className="absolute top-2 right-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {t.status === 'COMPLETED' ? '완성' : '초안'}
              </span>
            </div>

            {/* 호버 액션 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => handleFeedback(t.id, 'good')} className="p-2 bg-green-500/20 rounded-full hover:bg-green-500/30" title="좋아요">
                <ThumbsUp className="w-4 h-4 text-green-400" />
              </button>
              <button onClick={() => handleFeedback(t.id, 'bad')} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30" title="별로">
                <ThumbsDown className="w-4 h-4 text-red-400" />
              </button>
              <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30" title="삭제">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>

            {/* 날짜 */}
            <div className="p-2">
              <div className="text-[10px] text-gray-500">
                {new Date(t.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
