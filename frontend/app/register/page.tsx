'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useCustomerStore } from '@/lib/customer-store';

export default function RegisterPage() {
  const router = useRouter();
  const customer = useCustomerStore((state) => state.customer);

  useEffect(() => {
    if (customer) {
      router.push('/');
    }
  }, [customer, router]);

  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao/customer`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F8F7FC] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full">
          {/* 카드 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* 로고/아이콘 */}
            <div className="w-20 h-20 bg-[#7C4DFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔧</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-2">
              꿈꾸는정비사 회원가입
            </h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              카카오 로그인으로 간편하게 가입하고<br />
              검증된 정비소를 빠르게 만나보세요
            </p>

            {/* 혜택 목록 */}
            <div className="bg-[#F5F3FF] rounded-xl p-4 mb-8 text-left space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#7C4DFF] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                <span className="text-sm text-gray-700 font-medium">52K 구독자 직접 검증한 정비소 연결</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#7C4DFF] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                <span className="text-sm text-gray-700 font-medium">내 문의 내역 조회 및 관리</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#7C4DFF] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                <span className="text-sm text-gray-700 font-medium">지역 맞춤형 정비사 빠른 연결</span>
              </div>
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              className="w-full bg-[#FEE500] text-gray-900 px-6 py-4 rounded-xl font-bold text-lg
                hover:bg-[#FDD835] transition-all flex items-center justify-center gap-3 shadow-md"
            >
              <span className="text-xl">💬</span>
              카카오로 1초 가입하기
            </button>

            <p className="text-xs text-gray-400 mt-4">
              가입 시{' '}
              <Link href="/privacy" className="underline hover:text-[#7C4DFF]">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다
            </p>

            {/* 정비사 가입 링크 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                정비소 가입이 목적이신가요?{' '}
                <Link href="/owner/login" className="text-[#7C4DFF] font-semibold hover:underline">
                  정비사로 가입하기 →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
