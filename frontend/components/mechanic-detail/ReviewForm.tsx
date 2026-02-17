'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { reviewApi } from '@/lib/api';
import type { Review } from '@/types';

interface Props {
  mechanicId: number;
  onSubmitted: (review: Review) => void;
  onCancel: () => void;
}

export default function ReviewForm({ mechanicId, onSubmitted, onCancel }: Props) {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요');
      return;
    }
    if (!content.trim()) {
      alert('리뷰 내용을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await reviewApi.create({
        mechanicId,
        nickname: nickname.trim(),
        content: content.trim(),
        rating,
      });
      setSubmitted(true);
      onSubmitted(response.data);
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      alert('리뷰 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 rounded-xl text-center">
        <p className="text-green-700 font-medium">리뷰가 접수되었습니다!</p>
        <p className="text-sm text-green-600 mt-1">관리자 승인 후 게시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#F0FDF4] rounded-xl space-y-3">
      {/* 별점 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">별점</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star
                size={24}
                className={`transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 닉네임 */}
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임"
        maxLength={20}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B4D3E] text-gray-900"
      />

      {/* 리뷰 내용 */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 100))}
          placeholder="한줄 리뷰를 남겨주세요"
          rows={2}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#1B4D3E] text-gray-900"
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-400">
          {content.length}/100
        </span>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#143D30] disabled:bg-gray-400 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              제출 중...
            </>
          ) : (
            '리뷰 제출'
          )}
        </button>
      </div>
    </div>
  );
}
