'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Shield,
  Zap,
  CheckCircle,
  Store,
  List,
  Info,
  Clock,
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
  isExpired?: boolean;
  sharedAt?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
}

export default function SharedInquiryPage() {
  const params = useParams();
  const router = useRouter();
  const rawType = params.type as string;
  const rawId = params.id as string;

  const isLegacyUrl = /^\d+$/.test(rawType);
  const type = isLegacyUrl ? 'service' : rawType;
  const id = isLegacyUrl ? Number(rawType) : Number(rawId);

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recentCount, setRecentCount] = useState<number>(0);
  const [isNewSignup, setIsNewSignup] = useState(false);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const res = await unifiedInquiryApi.getPublic(type, id);
        setInquiry(res.data);
        return res.data;
      } catch {
        setError(true);
        return null;
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await unifiedInquiryApi.getPublicStats();
        setRecentCount(res.data.recentCount);
      } catch {
        // 무시
      }
    };

    if (type && id && !isNaN(id)) {
      // 가입 후 돌아왔는지 확인
      const justSignedUp = typeof window !== 'undefined'
        ? sessionStorage.getItem('mechanic_just_signed_up')
        : null;

      if (justSignedUp) {
        setIsNewSignup(true);
        sessionStorage.removeItem('mechanic_just_signed_up');
        // 가입 직후: 쿠키 안착 대기 후 재조회 (500ms)
        setLoading(true);
        setTimeout(async () => {
          const data = await fetchInquiry();
          // 그래도 전화번호가 안 보이면 한 번 더 시도 (1초 후)
          if (data && !data.phone) {
            setTimeout(() => fetchInquiry(), 1000);
          }
        }, 500);
      } else {
        fetchInquiry();
      }
      fetchStats();
    }
  }, [type, id]);

  const handleSignupClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mechanic_return_url', `/inquiry/${type}/${id}`);
    }
    router.push('/owner/login');
  };

  const handleLoginClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mechanic_return_url', `/inquiry/${type}/${id}`);
    }
    router.push('/owner/login');
  };

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
              {/* 만료 배너 */}
              {inquiry.isExpired && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🔒</span>
                    <div>
                      <p className="font-bold text-red-700 mb-1">이 문의는 마감되었습니다</p>
                      <p className="text-sm text-red-600">
                        공유 후 48시간이 지나 전화번호 확인이 불가합니다.<br />
                        새로운 문의는 카카오 단톡방에서 확인하세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 헤더 카드 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {TYPE_LABELS[inquiry.type] || '문의'}
                    </p>
                    <h1 className="text-xl font-bold text-gray-900">
                      고객 문의 #{inquiry.id}
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
                  {(inquiry.vehicleNumber || inquiry.vehicleModel) && (
                    <div className="flex items-center gap-3">
                      <Car size={18} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">
                        {inquiry.vehicleNumber}{inquiry.vehicleNumber && inquiry.vehicleModel ? ' · ' : ''}{inquiry.vehicleModel}
                      </span>
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
                  {inquiry.sharedAt && !inquiry.isExpired && (
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-orange-400 flex-shrink-0" />
                      <span className="text-orange-600 text-sm font-medium">
                        {(() => {
                          const shared = new Date(inquiry.sharedAt);
                          const expires = new Date(shared.getTime() + 48 * 60 * 60 * 1000);
                          const remaining = expires.getTime() - Date.now();
                          const hours = Math.floor(remaining / (60 * 60 * 1000));
                          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                          if (hours > 0) return `전화번호 확인 가능 시간: ${hours}시간 ${minutes}분 남음`;
                          if (minutes > 0) return `전화번호 확인 가능 시간: ${minutes}분 남음`;
                          return '곧 만료됩니다';
                        })()}
                      </span>
                    </div>
                  )}
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

                    {/* 신규 가입자 환영 + 탐색 유도 */}
                    {isNewSignup && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 pt-4 border-t border-gray-100"
                      >
                        <p className="text-center text-sm font-bold text-[#7C4DFF] mb-3">
                          가입을 환영합니다!
                        </p>
                        <p className="text-center text-xs text-gray-500 mb-4">
                          꿈꾸는정비사에서 더 많은 고객을 만나보세요
                        </p>
                        <div className="space-y-2">
                          <Link
                            href="/owner"
                            className="flex items-center gap-3 w-full p-3 bg-[#F5F3FF] rounded-xl hover:bg-[#EDE9FF] transition-colors"
                          >
                            <Store size={18} className="text-[#7C4DFF]" />
                            <span className="text-sm font-medium text-gray-800">내 정비소 등록하기</span>
                          </Link>
                          <Link
                            href="/"
                            className="flex items-center gap-3 w-full p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <List size={18} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">다른 고객 문의 보기</span>
                          </Link>
                          <Link
                            href="/for-mechanics"
                            className="flex items-center gap-3 w-full p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <Info size={18} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">정비사 혜택 알아보기</span>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* 전화번호 블러 (비로그인 / 미승인) */
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-300 mb-3">
                      <Lock size={24} />
                      <span>010-****-****</span>
                    </div>

                    {/* 긴급성 메시지 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <p className="text-sm font-bold text-amber-800 flex items-center justify-center gap-1">
                        <Zap size={16} />
                        이 고객은 지금 전화를 기다리고 있습니다
                      </p>
                    </div>

                    <div className="bg-[#F5F3FF] rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-700 font-medium mb-1">
                        회원 정비사만 고객 연락처를 확인할 수 있습니다
                      </p>
                      <p className="text-xs text-gray-500">
                        카카오 로그인 한 번이면 바로 확인 가능
                      </p>
                    </div>

                    {/* 메인 CTA — /owner/login 직접 연결 */}
                    <button
                      onClick={handleSignupClick}
                      className="inline-flex items-center gap-2 w-full justify-center bg-[#7C4DFF] text-white px-6 py-4 rounded-xl font-bold text-base hover:bg-[#6D3FE0] transition-all shadow-lg cursor-pointer"
                    >
                      카카오로 3초 가입 → 전화번호 확인
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      이미 회원이신가요?{' '}
                      <button onClick={handleLoginClick} className="text-[#7C4DFF] font-medium cursor-pointer">
                        로그인
                      </button>
                    </p>
                  </div>
                )}
              </div>

              {/* 소셜 프루프 + 혜택 섹션 (비로그인 시만) */}
              {!inquiry.phone && (
                <div className="bg-gradient-to-br from-[#7C4DFF]/5 to-[#F5F3FF] rounded-2xl p-6 mb-4">
                  <div className="text-center mb-4">
                    <p className="text-sm font-bold text-gray-900">
                      <span className="text-[#7C4DFF]">꿈꾸는정비사</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      유튜브 5.3만 구독자가 운영하는 정비소 매칭 플랫폼
                    </p>
                  </div>

                  {recentCount > 0 && (
                    <div className="bg-white/80 rounded-lg p-3 mb-4 text-center">
                      <p className="text-sm font-medium text-gray-800">
                        이번 주 <span className="text-[#7C4DFF] font-bold">{recentCount}건</span>의 고객 문의 접수 중
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">고객 직접 연결 · 중개수수료 없음</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">카카오 3초 가입 · 무료</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">전화번호 바로 확인 가능</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 하단 안내 (비로그인 시) */}
              {!inquiry.phone && (
                <div className="text-center">
                  <Link
                    href="/for-mechanics"
                    className="text-[#7C4DFF] text-sm font-semibold hover:underline"
                  >
                    정비사 혜택 더 알아보기 →
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
