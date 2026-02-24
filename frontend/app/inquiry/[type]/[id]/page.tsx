'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Wrench,
  FileText,
  Calendar,
  Phone,
  Lock,
  ArrowLeft,
  Car,
  User,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { unifiedInquiryApi } from '@/lib/api';

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
  VIEWED: { label: '확인됨', color: 'bg-blue-100 text-blue-700' },
  REPLIED: { label: '답변됨', color: 'bg-green-100 text-green-700' },
};

const TYPE_LABELS: Record<string, string> = {
  SERVICE: '서비스 문의',
  GENERAL: '일반 문의',
  QUOTE: '견적 요청',
};

interface InquiryDetail {
  id: number;
  type: string;
  name?: string;
  phone?: string;
  regionSido?: string;
  regionSigungu?: string;
  serviceType?: string;
  description?: string;
  status: string;
  createdAt: string;
  businessName?: string;
  carModel?: string;
  mechanicName?: string;
}

export default function SharedInquiryPage() {
  const params = useParams();
  const rawType = params.type as string;
  const rawId = params.id as string;

  // 기존 /inquiry/123 URL 호환: type이 숫자면 service 타입으로 처리
  const isLegacyUrl = /^\d+$/.test(rawType);
  const type = isLegacyUrl ? 'service' : rawType;
  const id = isLegacyUrl ? Number(rawType) : Number(rawId);

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const res = await unifiedInquiryApi.getPublic(type, id);
        setInquiry(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (type && id && !isNaN(id)) fetchInquiry();
  }, [type, id]);

  return (
    <Layout>
      <section className="min-h-screen bg-[#F8F7FC] pt-20 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {/* 뒤로가기 */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
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
              <p className="text-gray-500 text-lg mb-2">문의를 찾을 수 없습니다.</p>
              <Link href="/" className="text-[#7C4DFF] font-medium">
                메인으로 돌아가기
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* 헤더 카드 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {TYPE_LABELS[inquiry.type] || '문의'}
                    </p>
                    <h1 className="text-xl font-bold text-gray-900">
                      🔔 고객 문의 #{inquiry.id}
                    </h1>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      STATUS_LABELS[inquiry.status]?.color || 'bg-gray-100'
                    }`}
                  >
                    {STATUS_LABELS[inquiry.status]?.label || inquiry.status}
                  </span>
                </div>

                {/* 문의 정보 */}
                <div className="space-y-3">
                  {inquiry.name && (
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800 font-medium">{inquiry.name}</span>
                    </div>
                  )}
                  {inquiry.regionSido && (
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">
                        {inquiry.regionSido} {inquiry.regionSigungu}
                      </span>
                    </div>
                  )}
                  {inquiry.serviceType && (
                    <div className="flex items-center gap-3">
                      <Wrench size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">
                        {SERVICE_LABELS[inquiry.serviceType]?.emoji}{' '}
                        {SERVICE_LABELS[inquiry.serviceType]?.label || inquiry.serviceType}
                      </span>
                    </div>
                  )}
                  {inquiry.carModel && (
                    <div className="flex items-center gap-3">
                      <Car size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">{inquiry.carModel}</span>
                    </div>
                  )}
                  {inquiry.description && (
                    <div className="flex items-start gap-3">
                      <FileText size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800 leading-relaxed">{inquiry.description}</span>
                    </div>
                  )}
                  {inquiry.mechanicName && (
                    <div className="flex items-center gap-3">
                      <Wrench size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">
                        요청 정비소: {inquiry.mechanicName}
                      </span>
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

                {inquiry.phone ? (
                  /* 전화번호 공개 (APPROVED Owner / Admin) */
                  <div className="space-y-3">
                    <a
                      href={`tel:${inquiry.phone}`}
                      className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-all"
                    >
                      📞 {inquiry.phone}
                    </a>
                    <p className="text-xs text-gray-400 text-center">
                      터치하면 바로 전화 연결됩니다
                    </p>
                  </div>
                ) : (
                  /* 전화번호 블러 (비로그인 / 미승인) */
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-300 mb-4">
                      <Lock size={24} />
                      <span>010-****-****</span>
                    </div>
                    <div className="bg-[#F5F3FF] rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-700 font-medium mb-1">
                        회원 정비사만 고객 연락처를 확인할 수 있습니다
                      </p>
                      <p className="text-xs text-gray-500">
                        카카오 로그인으로 간편하게 가입하세요
                      </p>
                    </div>
                    <Link
                      href="/for-mechanics"
                      className="inline-flex items-center gap-2 w-full justify-center bg-[#7C4DFF] text-white px-6 py-4 rounded-xl font-bold text-base hover:bg-[#6D3FE0] transition-all shadow-lg"
                    >
                      🔑 정비사 회원가입
                    </Link>
                    <p className="text-xs text-gray-400 mt-3">
                      이미 회원이신가요?{' '}
                      <Link href="/owner/login" className="text-[#7C4DFF] font-medium">
                        로그인
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* 꿈꾸는정비사 안내 */}
              <div className="bg-gradient-to-br from-[#7C4DFF]/5 to-[#F5F3FF] rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-bold text-[#7C4DFF]">꿈꾸는정비사</span>에서 검증된 고객 문의를 받아보세요
                </p>
                <Link
                  href="/for-mechanics"
                  className="text-[#7C4DFF] text-sm font-semibold hover:underline"
                >
                  정비사 가입 안내 →
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
