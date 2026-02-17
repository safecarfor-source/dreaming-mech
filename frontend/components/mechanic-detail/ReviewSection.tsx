'use client';

import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import type { Review } from '@/types';
import ReviewForm from './ReviewForm';

interface Props {
  reviews?: Review[];
  mechanicId: number;
}

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

export default function ReviewSection({ reviews, mechanicId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews || []);

  const handleReviewSubmitted = (newReview: Review) => {
    // 승인 전이므로 실제로는 목록에 안 보이지만, 작성 완료 메시지 표시
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={20} />
          리뷰
          {localReviews.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({localReviews.length})
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-[#1B4D3E] font-medium hover:text-[#143D30]"
        >
          {showForm ? '닫기' : '리뷰 작성'}
        </button>
      </div>

      {/* 리뷰 작성 폼 */}
      {showForm && (
        <div className="mb-4">
          <ReviewForm
            mechanicId={mechanicId}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* 리뷰 목록 */}
      {localReviews.length > 0 ? (
        <div className="space-y-3">
          {localReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-gray-900">{review.nickname}</span>
                <StarRating rating={review.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <p className="text-sm text-gray-700">{review.content}</p>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-gray-400 text-center py-4">
            아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨주세요!
          </p>
        )
      )}
    </div>
  );
}
