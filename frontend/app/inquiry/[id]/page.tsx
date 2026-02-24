'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { serviceInquiryApi } from '@/lib/api';
import { ServiceInquiry } from '@/types';
import { MapPin, Wrench, FileText, Calendar, Phone, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SERVICE_LABELS: Record<string, { emoji: string; label: string }> = {
  TIRE: { emoji: '🛞', label: '타이어' },
  OIL: { emoji: '🛢️', label: '엔진오일' },
  BRAKE: { emoji: '🔴', label: '브레이크' },
  MAINTENANCE: { emoji: '🔧', label: '경정비' },
  CONSULT: { emoji: '💬', label: '종합상담' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '접수됨', color: 'bg-yellow-100 text-yellow-700' },
  SHARED: { label: '공유됨', color: 'bg-blue-100 text-blue-700' },
  CONNECTED: { label: '연결됨', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-600' },
};

export default function InquiryDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [inquiry, setInquiry] = useState<ServiceInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const res = await serviceInquiryApi.getPublic(id);
        const data = res.data?.data || res.data;
        setInquiry(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInquiry();
  }, [id]);

  return (
    <Layout>
      <section className="min-h-screen bg-[#F8F7FC] pt-20 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {/* 뒤로가기 */}
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={16} />
            메인으로
          </Link>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : error || !inquiry ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <p className="text-gray-500 text-lg">문의를 찾을 수 없습니다.</p>
              <Link href="/" className="mt-4 inline-block text-[#7C4DFF] font-medium">
                메인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              {/* 헤더 카드 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-gray-900">
                    🔔 고객 문의 #{inquiry.id}
                  </h1>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_LABELS[inquiry.status]?.color || 'bg-gray-100'}`}>
                    {STATUS_LABELS[inquiry.status]?.label || inquiry.status}
                  </span>
                </div>

                {/* 문의 정보 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-800">{inquiry.regionSido} {inquiry.regionSigungu}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wrench size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-800">
                      {SERVICE_LABELS[inquiry.serviceType]?.emoji} {SERVICE_LABELS[inquiry.serviceType]?.label || inquiry.serviceType}
                    </span>
                  </div>
                  {inquiry.description && (
                    <div className="flex items-start gap-3">
                      <FileText size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800">{inquiry.description}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 text-sm">
                      {new Date(inquiry.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 고객 연락처 카드 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone size={20} />
                  고객 연락처
                </h2>

                {inquiry.customer?.phone ? (
                  /* 전화번호 공개 (APPROVED Owner / Admin) */
                  <div className="space-y-3">
                    <a
                      href={`tel:${inquiry.customer.phone}`}
                      className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-all"
                    >
                      📞 {inquiry.customer.phone}
                    </a>
                    <p className="text-xs text-gray-400 text-center">
                      터치하면 바로 전화 연결됩니다
                    </p>
                  </div>
                ) : (
                  /* 전화번호 블러 (비로그인 / 미승인) */
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-300 mb-4">
                      <Lock size={20} />
                      010-****-****
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      회원 정비사만 고객 연락처를 확인할 수 있습니다
                    </p>
                    <Link
                      href="/owner/login"
                      className="inline-flex items-center gap-2 bg-[#FEE500] text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-[#FDD835] transition-all"
                    >
                      🔑 카카오로 로그인
                    </Link>
                    <p className="text-xs text-gray-400 mt-3">
                      카카오 로그인 후 바로 확인할 수 있습니다
                    </p>
                  </div>
                )}
              </div>

              {/* 카카오 오픈채팅 */}
              {inquiry.kakaoOpenChatUrl && (
                <a
                  href={inquiry.kakaoOpenChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#FEE500] text-gray-900 px-6 py-4 rounded-xl font-bold text-base hover:bg-[#FDD835] transition-all"
                >
                  💬 카카오 오픈채팅 참여하기
                </a>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
