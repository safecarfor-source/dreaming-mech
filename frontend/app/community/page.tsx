'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { communityApi } from '@/lib/api';
import { MessageCircle, Heart, Eye, PenSquare, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { value: 'ALL', label: '전체' },
  { value: 'GENERAL', label: '일반 질문' },
  { value: 'TIRE', label: '🛞 타이어' },
  { value: 'ENGINE_OIL', label: '🛢️ 엔진오일' },
  { value: 'BRAKE', label: '🔴 브레이크' },
  { value: 'REPAIR', label: '🔧 정비' },
];

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: '일반',
  TIRE: '🛞 타이어',
  ENGINE_OIL: '🛢️ 엔진오일',
  BRAKE: '🔴 브레이크',
  REPAIR: '🔧 정비',
};

interface PostItem {
  id: number;
  title: string;
  category: string;
  authorRole: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  customer?: { id: number; nickname?: string };
  owner?: { id: number; name?: string; businessName?: string };
}

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [total, setTotal] = useState(0);

  const fetchPosts = async (cat: string) => {
    setLoading(true);
    try {
      const res = await communityApi.getPosts({ category: cat === 'ALL' ? undefined : cat, limit: 30 });
      setPosts(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(category);
  }, [category]);

  const getAuthorName = (post: PostItem) => {
    if (post.authorRole === 'OWNER') {
      return post.owner?.businessName || post.owner?.name || '정비사';
    }
    return post.customer?.nickname || '익명';
  };

  const getAuthorBadge = (post: PostItem) => {
    if (post.authorRole === 'OWNER') {
      return (
        <span className="inline-block px-1.5 py-0.5 bg-[#7C4DFF]/10 text-[#7C4DFF] text-xs font-semibold rounded">
          정비사
        </span>
      );
    }
    return null;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F7FC] pt-14 md:pt-16">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">정비 Q&A</h1>
                <p className="text-gray-500 text-sm mt-1">정비사와 고객이 함께 만드는 자동차 정비 커뮤니티</p>
              </div>
              <Link
                href="/community/write"
                className="flex items-center gap-2 bg-[#7C4DFF] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#6B3FE0] transition-colors shadow-sm"
              >
                <PenSquare size={16} />
                글쓰기
              </Link>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    category === cat.value
                      ? 'bg-[#7C4DFF] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="container mx-auto px-4 md:px-6 py-6 max-w-3xl">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">아직 게시글이 없습니다</p>
              <p className="text-gray-400 text-sm mt-1">첫 번째 질문을 올려보세요!</p>
              <Link href="/community/write" className="inline-block mt-4 bg-[#7C4DFF] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#6B3FE0] transition-colors">
                글쓰기
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">총 {total}개 게시글</p>
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="block bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {CATEGORY_LABELS[post.category] || post.category}
                          </span>
                          {getAuthorBadge(post)}
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{getAuthorName(post)}</span>
                          <span>{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} /> {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} /> {post.commentCount}
                        </span>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
