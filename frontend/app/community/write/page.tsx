'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { communityApi } from '@/lib/api';
import { gtagEvent } from '@/lib/gtag-events';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  { value: 'GENERAL', label: '일반 질문' },
  { value: 'TIRE', label: '🛞 타이어' },
  { value: 'ENGINE_OIL', label: '🛢️ 엔진오일' },
  { value: 'BRAKE', label: '🔴 브레이크' },
  { value: 'REPAIR', label: '🔧 정비' },
];

export default function CommunityWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await communityApi.createPost({ title: title.trim(), content: content.trim(), category });
      gtagEvent.communityPostCreate(category);
      router.push(`/community/${res.data.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.\n카카오 로그인 후 이용해주세요.');
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao/customer`;
      } else {
        alert('게시글 등록에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F7FC]">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">질문 작성</h1>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
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

            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="궁금한 점을 간략하게 적어주세요"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] transition-all"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="차종, 증상, 궁금한 점 등을 자세히 적어주세요"
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] transition-all resize-none"
              />
            </div>

            {/* 안내 */}
            <div className="bg-[#F5F3FF] rounded-xl p-4 text-sm text-[#7C4DFF]">
              <p className="font-semibold mb-1">게시글 작성 안내</p>
              <ul className="text-[#7C4DFF]/80 space-y-1 text-xs">
                <li>• 카카오 로그인 후 게시글을 작성할 수 있습니다</li>
                <li>• 정비사가 댓글을 달면 매장 정보가 함께 표시됩니다</li>
                <li>• 개인정보(전화번호 등)는 본문에 적지 마세요</li>
              </ul>
            </div>

            {/* 제출 */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !content.trim()}
              className="w-full bg-[#7C4DFF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#6B3FE0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '등록 중...' : '질문 등록하기'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
