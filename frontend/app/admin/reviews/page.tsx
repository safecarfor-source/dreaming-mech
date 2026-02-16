'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { reviewApi } from '@/lib/api';
import type { Review } from '@/types';
import { Star, Check, X, Trash2 } from 'lucide-react';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<string>(''); // '', 'true', 'false'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter !== '') params.approved = filter;
      const response = await reviewApi.getAll(params);
      setReviews(response.data.data);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('리뷰 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, filter]);

  const handleApprove = async (id: number) => {
    try {
      await reviewApi.approve(id);
      fetchReviews();
    } catch (error) {
      alert('승인 실패');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reviewApi.reject(id);
      fetchReviews();
    } catch (error) {
      alert('반려 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
    try {
      await reviewApi.delete(id);
      fetchReviews();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="text-purple-600" />
          리뷰 관리
        </h1>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: '전체' },
          { value: 'false', label: '승인 대기' },
          { value: 'true', label: '승인됨' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.value
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 리뷰 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">리뷰가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`p-4 ${!review.isApproved ? 'bg-yellow-50/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{review.nickname}</span>
                      <StarRating rating={review.rating} />
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        review.isApproved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {review.isApproved ? '승인' : '대기'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{review.content}</p>
                    <div className="text-xs text-gray-400">
                      {review.mechanic?.name || `정비소 #${review.mechanicId}`} · {formatDate(review.createdAt)}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        title="승인"
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    {!review.isApproved && (
                      <button
                        onClick={() => handleReject(review.id)}
                        title="반려"
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      title="삭제"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-gray-500 py-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
