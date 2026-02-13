'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Phone, User, MessageSquare, Building2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { inquiryApi } from '@/lib/api';

type InquiryTab = 'CUSTOMER' | 'MECHANIC';

export default function InquiryPage() {
  const [tab, setTab] = useState<InquiryTab>('CUSTOMER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await inquiryApi.create({
        type: tab,
        name: name.trim(),
        phone: phone.trim(),
        businessName: tab === 'MECHANIC' ? businessName.trim() : undefined,
        content: content.trim(),
      });
      setIsSuccess(true);
      setName('');
      setPhone('');
      setBusinessName('');
      setContent('');
    } catch {
      alert('문의 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout>
        <section className="min-h-screen flex items-center justify-center bg-[#0a0a0a] pt-14">
          <div className="text-center px-6">
            <div className="w-20 h-20 bg-[#9333ea]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-[#9333ea]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              문의가 접수되었습니다
            </h2>
            <p className="text-gray-400 mb-8">
              빠른 시간 내에 확인 후 연락드리겠습니다.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-6 py-3 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded-xl font-semibold transition-colors"
            >
              추가 문의하기
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-xl">
          {/* 헤더 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              문의하기
            </h1>
            <p className="text-gray-400">
              궁금한 점이 있으시면 편하게 문의해주세요.
            </p>
          </div>

          {/* 탭 */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-8">
            <button
              onClick={() => setTab('CUSTOMER')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                tab === 'CUSTOMER'
                  ? 'bg-[#9333ea] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              일반 문의
            </button>
            <button
              onClick={() => setTab('MECHANIC')}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                tab === 'MECHANIC'
                  ? 'bg-[#9333ea] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              정비사 문의
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {tab === 'MECHANIC' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Building2 size={16} />
                  상호명
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="정비소 상호명"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User size={16} />
                {tab === 'MECHANIC' ? '대표자명' : '이름'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tab === 'MECHANIC' ? '대표자 성함' : '이름을 입력해주세요'}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea] transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Phone size={16} />
                연락처
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea] transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <MessageSquare size={16} />
                문의 내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  tab === 'CUSTOMER'
                    ? '플랫폼 이용 관련 궁금한 점을 작성해주세요.'
                    : '등록, 비용, 혜택 등 궁금한 점을 작성해주세요.'
                }
                required
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#9333ea] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#9333ea] hover:bg-[#7e22ce] disabled:opacity-50 text-white rounded-xl font-semibold text-lg transition-colors"
            >
              {isSubmitting ? (
                '접수 중...'
              ) : (
                <>
                  <Send size={20} />
                  문의 접수하기
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
