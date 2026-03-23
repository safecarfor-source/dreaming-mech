'use client';

import { useEffect, useState } from 'react';
import { Eye, Heart, MessageCircle, Trash2, Clock } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminCommunityApi } from '@/lib/api';

interface PostItem {
  id: number;
  title: string;
  content: string;
  category: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isActive: boolean;
  createdAt: string;
  user: { id: number; nickname: string | null; email: string | null; businessName: string | null } | null;
}

const CATEGORY_MAP: Record<string, string> = {
  REPAIR: '정비',
  TIRE: '타이어',
  ENGINE_OIL: '엔진오일',
  BRAKE: '브레이크',
  GENERAL: '일반',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  return `${days}일 전`;
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await adminCommunityApi.getPosts(1, 100);
      setPosts(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제하시겠습니까?\n댓글도 함께 삭제됩니다.`)) return;
    try {
      await adminCommunityApi.deletePost(id);
      fetchPosts();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Q&A 관리</h1>
          <span className="text-sm text-gray-500">총 {total}건</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">로딩 중...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
            게시글이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
                  !post.isActive ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* 카테고리 + 제목 */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                        {CATEGORY_MAP[post.category] || post.category}
                      </span>
                      {!post.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600">
                          비활성
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                    </div>

                    {/* 내용 미리보기 */}
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{post.content}</p>

                    {/* 작성자 + 통계 */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {post.user?.nickname || post.user?.businessName || post.user?.email || '알 수 없음'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {timeAgo(post.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} /> {post.commentCount}
                      </span>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
