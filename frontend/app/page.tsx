'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import { mechanicsApi } from '@/lib/api';
import { generateSlug } from '@/lib/slug';
import Layout from '@/components/Layout';
import MechanicCard from '@/components/MechanicCard';
import CardSkeleton from '@/components/ui/CardSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { Mechanic } from '@/types';

// VIDEO_ID는 대장님이 직접 지정
const YOUTUBE_VIDEO_ID = 'VIDEO_ID_PLACEHOLDER';

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
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

      {/* 유튜브 영상 섹션 */}
      <section className="bg-white px-4 pt-8 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* 유튜브 영상 임베드 */}
          <div className="aspect-video rounded-2xl overflow-hidden shadow-lg mb-6">
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title="꿈꾸는정비사 대표 영상"
            />
          </div>

          {/* 메인 메시지 */}
          <h1 className="text-[28px] md:text-[36px] font-extrabold text-[#111827] text-center leading-[1.2]">
            검증된 정비소를 만나보세요
          </h1>
          <p className="text-[17px] md:text-[18px] text-[#6B7280] text-center mt-3 leading-[1.6]">
            20년차 정비사가 직접 검증한 전국 정비소 네트워크
          </p>
        </div>
      </section>

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

          {/* 정비사 등록 유도 */}
          {!loading && !error && mechanics.length > 0 && (
            <div className="mt-8 text-center">
              <a
                href="/pro/"
                className="inline-flex items-center gap-2 text-[#E4015C] text-[15px] font-semibold
                  hover:underline hover:text-[#6D3FE0] transition-colors"
              >
                정비사 사장님이신가요? 내 정비소 등록하기 →
              </a>
            </div>
          )}
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
    </Layout>
  );
}

export default function Home() {
  return <HomeContent />;
}
