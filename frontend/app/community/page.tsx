'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { communityApi } from '@/lib/api';
import { useUserStore } from '@/lib/auth';
import { MessageCircle, Heart, Eye, PenSquare, ChevronRight, X } from 'lucide-react';

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
  user?: { id: number; nickname?: string; businessName?: string; businessStatus?: string };
  // 하위 호환
  customer?: { id: number; nickname?: string };
  owner?: { id: number; name?: string; businessName?: string };
}

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
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
    // 통합 user 필드 우선, 하위 호환으로 customer/owner 폴백
    if (post.user) {
      return post.user.businessName || post.user.nickname || '익명';
    }
    if (post.authorRole === 'OWNER') {
      return post.owner?.businessName || post.owner?.name || '정비사';
    }
    return post.customer?.nickname || '익명';
  };

  const isApprovedBusiness = (post: PostItem) => {
    if (post.user) return post.user.businessStatus === 'APPROVED';
    return post.authorRole === 'OWNER';
  };

  const getAuthorBadge = (post: PostItem) => {
    if (isApprovedBusiness(post)) {
      return (
        <span className="inline-block px-1.5 py-0.5 bg-consumer-500/10 text-consumer-500 text-xs font-semibold rounded">
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
      <div className="min-h-screen bg-[#FFF1F5] pt-14 md:pt-16">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">정비 Q&A</h1>
                <p className="text-gray-500 text-sm mt-1">정비사와 고객이 함께 만드는 자동차 정비 커뮤니티</p>
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowLoginModal(true);
                  } else {
                    router.push('/community/write');
                  }
                }}
                className="flex items-center gap-2 bg-consumer-500 text-white px-3 py-2 md:px-5 md:py-2.5 text-sm md:text-base rounded-xl font-semibold hover:bg-consumer-600 transition-colors shadow-sm whitespace-nowrap"
              >
                <PenSquare size={16} />
                글쓰기
              </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    category === cat.value
                      ? 'bg-consumer-500 text-white'
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
              <Link href="/community/write" className="inline-block mt-4 bg-consumer-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-consumer-600 transition-colors">
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

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[22px] font-black tracking-tight mb-1">
              <span className="text-[#1F2937]">꿈꾸는</span>
              <span className="text-[#E4015C]">정비사</span>
            </div>
            <p className="text-[16px] text-gray-700 font-medium text-center leading-[1.7]">
              글쓰기는 로그인이 필요합니다
            </p>
            <button
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                window.location.href = `${apiUrl}/auth/kakao`;
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] font-bold rounded-xl py-3.5 text-[16px] transition-colors mt-1"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.866 2 8.4c0 2.21 1.388 4.154 3.493 5.275L4.6 17.1a.25.25 0 0 0 .363.281L9.19 14.77c.269.02.539.03.81.03 4.418 0 8-2.866 8-6.4S14.418 2 10 2z" fill="#191919"/></svg>
              카카오로 1초 로그인
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-[14px] text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
