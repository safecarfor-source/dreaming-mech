'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, X } from 'lucide-react';
import Link from 'next/link';
import { mechanicsApi } from '@/lib/api';
import { generateSlug } from '@/lib/slug';
import { useUserStore } from '@/lib/auth';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import MechanicCard from '@/components/MechanicCard';
import CardSkeleton from '@/components/ui/CardSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { Mechanic } from '@/types';

// URL 파라미터 체크 컴포넌트
function InquiryStatusChecker({ setShowSuccess }: { setShowSuccess: (v: boolean) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const inquiryStatus = searchParams.get('inquiry');
    if (inquiryStatus === 'success') {
      setShowSuccess(true);
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router, setShowSuccess]);

  return null;
}

function HomeContent() {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleInquiryClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const handleKakaoLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    window.location.href = `${apiUrl}/auth/kakao`;
  };

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mechanicsApi.getAll();
      setMechanics(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError('정비사 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  return (
    <Layout>
      {/* 문의 성공 배너 */}
      {showSuccess && (
        <div className="bg-[#10B981] text-white text-center py-3 px-4 text-[15px] font-semibold">
          문의 접수 완료! 꿈꾸는정비사가 빠르게 연락드리겠습니다.
          <button
            onClick={() => setShowSuccess(false)}
            className="ml-4 underline text-white/80 hover:text-white text-[13px]"
          >
            닫기
          </button>
        </div>
      )}

      {/* 히어로 영상 섹션 */}
      <HeroSection totalMechanics={mechanics.length} totalClicks={0} />

      {/* 정비소 카드 섹션 */}
      <section id="shops" className="bg-[#F9FAFB] px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[22px] md:text-[24px] font-bold text-[#111827] mb-6">
            우리 동네 정비소
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {[...Array(9)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchMechanics} />
          ) : mechanics.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#6B7280] text-[17px]">
                등록된 정비소가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {mechanics.map((m) => (
                <MechanicCard
                  key={m.id}
                  mechanic={m}
                  onClick={() =>
                    router.push(
                      `/shop/${generateSlug(m.location || '', m.name)}`
                    )
                  }
                />
              ))}
            </div>
          )}

          {/* 정비사 등록 유도 배너 */}
          {!loading && !error && mechanics.length > 0 && (
            <div className="mt-8">
              <a
                href="/pro"
                className="flex items-center justify-between gap-4 rounded-2xl px-6 py-5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1A1A1A' }}
              >
                <div>
                  <p className="text-[15px] font-bold leading-snug" style={{ color: '#D4A843' }}>
                    정비사 사장님이신가요?
                  </p>
                  <p className="text-[13px] text-white/80 mt-0.5">
                    검증된 플랫폼에 내 정비소를 등록하세요
                  </p>
                </div>
                <span
                  className="flex-shrink-0 text-[13px] font-bold px-4 py-2 rounded-xl whitespace-nowrap"
                  style={{ backgroundColor: '#D4A843', color: '#1A1A1A' }}
                >
                  무료 등록하기 →
                </span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 지역별 정비소 찾기 */}
      <section className="bg-white px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[22px] md:text-[24px] font-bold text-[#111827] mb-6">
            지역별 정비소 찾기
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((sido) => (
              <Link
                key={sido}
                href={`/region/${sido}`}
                className="text-center py-3 px-2 rounded-xl bg-[#F3F4F6] hover:bg-[#7C4DFF] hover:text-white text-[#374151] text-[14px] font-medium transition-colors"
              >
                {sido}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 바로 문의 섹션 */}
      <section className="bg-white px-4 py-16 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-[22px] md:text-[24px] font-bold text-[#111827] mb-3">
            내 근처에 없나요?
          </h2>
          <p className="text-[17px] md:text-[18px] text-[#6B7280] mb-8 leading-[1.6]">
            원하시는 지역에 검증된 정비소를 연결해 드립니다
          </p>
          <Link
            href="/inquiry"
            onClick={handleInquiryClick}
            className="inline-flex items-center justify-center gap-2 bg-[#E4015C] hover:bg-[#C70150] text-white rounded-xl px-8 py-4 text-[18px] font-semibold transition-colors"
          >
            <Phone size={20} />
            바로 문의하기
          </Link>
        </div>
      </section>

      {/* URL 파라미터 체크 */}
      <Suspense fallback={null}>
        <InquiryStatusChecker setShowSuccess={setShowSuccess} />
      </Suspense>

      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              style={{ position: 'relative', float: 'right' }}
            >
              <X size={20} />
            </button>

            {/* 로고 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 mb-4">
                <span className="text-[#111827] font-bold text-lg">꿈꾸는정비사</span>
              </div>
              <h2 className="text-[18px] font-bold text-gray-900 leading-snug">
                로그인이 필요한 서비스입니다
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                카카오 로그인 후 바로 문의할 수 있습니다
              </p>
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[15px] text-gray-900 transition-all hover:brightness-95"
              style={{ backgroundColor: '#FEE500' }}
            >
              <span className="text-xl">💬</span>
              카카오로 로그인
            </button>

            {/* 취소 버튼 */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full mt-3 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function Home() {
  return <HomeContent />;
}
