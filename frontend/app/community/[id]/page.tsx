'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { communityApi } from '@/lib/api';
import { gtagEvent } from '@/lib/gtag-events';
import { Heart, MessageCircle, Eye, ArrowLeft, MapPin, Send } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: '일반',
  TIRE: '🛞 타이어',
  ENGINE_OIL: '🛢️ 엔진오일',
  BRAKE: '🔴 브레이크',
  REPAIR: '🔧 정비',
};

interface MechanicShop {
  id: number;
  name: string;
  address: string;
  location: string;
}

interface OwnerInfo {
  id: number;
  name?: string;
  businessName?: string;
  mechanics?: MechanicShop[];
}

interface UserInfo {
  id: number;
  nickname?: string;
  businessName?: string;
  businessStatus?: string;
  mechanics?: MechanicShop[];
}

interface CommentType {
  id: number;
  content: string;
  authorRole: string;
  createdAt: string;
  user?: UserInfo;
  // 하위 호환
  customer?: { id: number; nickname?: string };
  owner?: OwnerInfo;
  replies?: CommentType[];
}

interface PostDetail {
  id: number;
  title: string;
  content: string;
  category: string;
  authorRole: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user?: UserInfo;
  // 하위 호환
  customer?: { id: number; nickname?: string };
  owner?: OwnerInfo;
  comments: CommentType[];
}

interface AuthorInfo {
  authorRole: string;
  user?: { nickname?: string; businessName?: string; businessStatus?: string };
  customer?: { nickname?: string };
  owner?: { name?: string; businessName?: string };
}

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyTo, setReplyTo] = useState<number | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await communityApi.getPost(id);
        setPost(res.data);
        setLikeCount(res.data.likeCount);
      } catch {
        router.push('/community');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, router]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await communityApi.createComment(id, {
        content: commentText.trim(),
        parentId: replyTo || undefined,
      });
      gtagEvent.communityCommentCreate(Number(id));
      const res = await communityApi.getPost(id);
      setPost(res.data);
      setCommentText('');
      setReplyTo(null);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`;
      } else {
        alert('댓글 등록에 실패했습니다.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await communityApi.toggleLike(id);
      setLiked(res.data.liked);
      setLikeCount((prev) => res.data.liked ? prev + 1 : prev - 1);
      if (res.data.liked) gtagEvent.communityLike('post', Number(id));
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`;
      }
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}일 전` : new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const getAuthorName = (item: AuthorInfo) => {
    if (item.user) return item.user.businessName || item.user.nickname || '익명';
    if (item.authorRole === 'OWNER') return item.owner?.businessName || item.owner?.name || '정비사';
    return item.customer?.nickname || '익명';
  };

  const isApprovedBusiness = (item: AuthorInfo) => {
    if (item.user) return item.user.businessStatus === 'APPROVED';
    return item.authorRole === 'OWNER';
  };

  const renderMechanicCard = (userOrOwner?: UserInfo | OwnerInfo) => {
    if (!userOrOwner || !userOrOwner.mechanics || userOrOwner.mechanics.length === 0) return null;
    const shop = userOrOwner.mechanics[0];
    return (
      <div className="mt-3 bg-consumer-50 rounded-xl p-3 border border-consumer-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-consumer-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">정</span>
          </div>
          <div>
            <p className="font-semibold text-consumer-500 text-sm">{shop.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={10} /> {shop.address}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderComment = (comment: CommentType, isReply = false): React.ReactNode => {
    const commentIsApproved = isApprovedBusiness(comment);
    return (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            commentIsApproved ? 'bg-consumer-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {getAuthorName(comment)[0]}
          </div>
          <span className="font-semibold text-sm text-gray-900">{getAuthorName(comment)}</span>
          {commentIsApproved && (
            <span className="px-1.5 py-0.5 bg-consumer-500/10 text-consumer-500 text-xs font-semibold rounded">정비사</span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
        {commentIsApproved && renderMechanicCard(comment.user || comment.owner)}
        {!isReply && (
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="mt-2 text-xs text-gray-400 hover:text-consumer-500 transition-colors"
          >
            {replyTo === comment.id ? '취소' : '답글 달기'}
          </button>
        )}
        {replyTo === comment.id && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="답글을 입력하세요..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-consumer-500/30"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={submittingComment || !commentText.trim()}
              className="px-3 py-2 bg-consumer-500 text-white rounded-lg hover:bg-consumer-600 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#FFF1F5] flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  if (!post) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-[#FFF1F5]">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
            <button onClick={() => router.push('/community')} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft size={22} />
            </button>
            <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[post.category]}
            </span>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-6 max-w-2xl">
          {/* 게시글 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isApprovedBusiness(post) ? 'bg-consumer-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {getAuthorName(post)[0]}
              </div>
              <span className="font-medium text-gray-700">{getAuthorName(post)}</span>
              {isApprovedBusiness(post) && (
                <span className="px-1.5 py-0.5 bg-consumer-500/10 text-consumer-500 text-xs font-semibold rounded">정비사</span>
              )}
              <span className="ml-auto">{timeAgo(post.createdAt)}</span>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {isApprovedBusiness(post) && renderMechanicCard(post.user || post.owner)}

            {/* 액션 */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
              >
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                {likeCount}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <MessageCircle size={18} /> {post.commentCount}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Eye size={18} /> {post.viewCount}
              </span>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="font-bold text-gray-900 mb-4">댓글 {post.commentCount}개</h2>
            {post.comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">첫 번째 댓글을 남겨보세요!</p>
            ) : (
              <div>
                {post.comments.map((comment) => renderComment(comment))}
              </div>
            )}
          </div>

          {/* 댓글 입력 (답글 모드가 아닐 때만 표시) */}
          {replyTo === null && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요 (로그인 필요)"
                  rows={3}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-consumer-500/30 resize-none"
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-consumer-500 text-white rounded-xl font-semibold hover:bg-consumer-600 transition-colors disabled:opacity-50 text-sm"
                >
                  <Send size={14} />
                  {submittingComment ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
