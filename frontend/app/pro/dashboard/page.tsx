'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ownerMechanicsApi, userAuthApi, ownerInquiriesApi } from '@/lib/api';
import { useUserStore } from '@/lib/auth';
import { Mechanic } from '@/types';
import {
  Store,
  MessageSquare,
  ArrowRight,
  MapPin,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { UserInfo } from '@/lib/auth';

const REGION_QUOTA = 10;

type OwnerInquiry = {
  id: number;
  serviceType: string;
  regionSido: string;
  regionSigungu: string;
  status: string;
  createdAt: string;
};

function ProfileBar({ user }: { user: UserInfo | null }) {
  if (!user) return null;

  const fields = [
    !!user.name || !!user.nickname,
    !!user.phone,
    !!user.businessLicenseUrl,
    user.businessStatus === 'APPROVED',
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  return (
    <div
      className="rounded-xl p-4 mb-4 border"
      style={{ backgroundColor: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.15)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/60 text-xs">프로필 완성도</p>
        <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>{pct}%</p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: '#D4AF37' }}
        />
      </div>
      {pct < 100 && (
        <p className="text-white/30 text-[11px] mt-2">
          {!user.phone && '전화번호 등록 '}
          {!user.businessLicenseUrl && '· 사업자 정보 제출'}
          {' '}을 완료하면 100%입니다.
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    NONE: { label: '미제출', bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.4)' },
    PENDING: { label: '검토 중', bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
    APPROVED: { label: '승인됨', bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
    REJECTED: { label: '거절됨', bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
    DEACTIVATED: { label: '비활성', bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.3)' },
  };
  const s = map[status] ?? map.NONE;
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

export default function ProDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/pro/login');
      return;
    }

    const fetchData = async () => {
      try {
        await userAuthApi.getProfile();
      } catch {
        // 무시 — layout에서 처리
      }

      try {
        const res = await ownerMechanicsApi.getAll();
        setMechanics(res.data ?? []);
      } catch {
        // PENDING/REJECTED → 403, 무시
      }

      try {
        const res = await ownerInquiriesApi.getAll();
        setInquiries(res.data ?? []);
      } catch {
        // 무시
      }

      setLoading(false);
    };

    fetchData();
  }, [isAuthenticated, router]);

  const isApproved = user?.businessStatus === 'APPROVED';
  const isPending = user?.businessStatus === 'PENDING';
  const isRejected = user?.businessStatus === 'REJECTED';
  const totalViews = mechanics.reduce((s, m) => s + (m.clickCount ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100svh-56px)]">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[520px] mx-auto px-5 py-6 pb-20">
      {/* 인사 */}
      <div className="mb-6">
        <p className="text-white/40 text-xs mb-1">안녕하세요,</p>
        <h1 className="text-white font-bold text-xl">
          {user?.name || user?.nickname || '사장님'}
          <span className="text-white/30 text-base font-normal ml-2">대시보드</span>
        </h1>
      </div>

      {/* 프로필 완성도 */}
      <ProfileBar user={user} />

      {/* 승인 상태 알림 */}
      {isPending && (
        <div
          className="rounded-xl p-4 mb-4 flex items-start gap-3 border"
          style={{ backgroundColor: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.2)' }}
        >
          <Clock size={18} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">검토 중입니다</p>
            <p className="text-yellow-400/60 text-xs mt-0.5 leading-[1.6]">
              {user?.businessLicenseUrl
                ? '사업자 정보가 접수되었습니다. 승인 후 정비소를 등록할 수 있습니다.'
                : '사업자 정보를 제출하면 빠르게 승인됩니다.'}
            </p>
            {!user?.businessLicenseUrl && (
              <Link
                href="/owner/onboarding"
                className="inline-flex items-center gap-1.5 mt-2 text-yellow-400 text-xs font-semibold"
              >
                사업자 정보 제출하기 <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}

      {isRejected && (
        <div
          className="rounded-xl p-4 mb-4 flex items-start gap-3 border"
          style={{ backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">가입이 거절되었습니다</p>
            {user?.rejectionReason && (
              <p className="text-red-400/60 text-xs mt-0.5 leading-[1.6]">{user.rejectionReason}</p>
            )}
            <Link
              href="/owner"
              className="inline-flex items-center gap-1.5 mt-2 text-red-400 text-xs font-semibold"
            >
              재신청하기 <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {isApproved && (
        <div
          className="rounded-xl p-4 mb-4 flex items-center gap-3 border"
          style={{ backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.15)' }}
        >
          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
          <p className="text-green-300 text-sm font-medium">승인된 정비소입니다. 플랫폼에 노출 중입니다.</p>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Store size={16} />, label: '등록 정비소', value: mechanics.length },
          { icon: <Eye size={16} />, label: '총 조회수', value: totalViews },
          { icon: <MessageSquare size={16} />, label: '고객 문의', value: inquiries.length },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl p-3.5 border text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="flex justify-center mb-1.5" style={{ color: '#D4AF37' }}>
              {stat.icon}
            </div>
            <p className="text-white font-black text-xl leading-none">{stat.value}</p>
            <p className="text-white/30 text-[10px] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 지역 현황 */}
      <div
        className="rounded-xl p-4 mb-4 border"
        style={{ backgroundColor: 'rgba(212,175,55,0.04)', borderColor: 'rgba(212,175,55,0.12)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/50 text-xs font-semibold">내 지역 등록 현황</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>
            구당 {REGION_QUOTA}자리 한정
          </span>
        </div>
        {mechanics.length > 0 ? (
          mechanics.map((m) => {
            const sido = m.address?.split(' ')[0] ?? '?';
            return (
              <div key={m.id} className="flex items-center gap-2 mt-2">
                <MapPin size={12} style={{ color: '#D4AF37' }} className="shrink-0" />
                <span className="text-white/70 text-sm">{m.name}</span>
                <span className="text-white/30 text-xs">({sido})</span>
                <StatusBadge status={user?.businessStatus ?? 'NONE'} />
              </div>
            );
          })
        ) : (
          <p className="text-white/25 text-xs mt-2">아직 등록된 정비소가 없습니다.</p>
        )}
      </div>

      {/* 내 정비소 섹션 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">내 정비소</h2>
          {isApproved && (
            <Link
              href="/owner/mechanics/new"
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: '#D4AF37' }}
            >
              <Plus size={13} />
              등록
            </Link>
          )}
        </div>

        {mechanics.length === 0 ? (
          <div
            className="rounded-xl p-6 border border-dashed text-center"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Store size={32} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/30 text-sm mb-3">아직 등록된 정비소가 없습니다</p>
            {isApproved ? (
              <Link
                href="/owner/mechanics/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: '#D4AF37', color: '#1A1A1A' }}
              >
                <Plus size={15} />
                정비소 등록하기
              </Link>
            ) : (
              <p className="text-white/20 text-xs">승인 후 정비소를 등록할 수 있습니다.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mechanics.map((m) => (
              <div
                key={m.id}
                className="rounded-xl p-4 border flex items-center gap-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                {m.mainImageUrl ? (
                  <img src={m.mainImageUrl} alt={m.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    🔧
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{m.name}</p>
                  <p className="text-white/35 text-xs truncate mt-0.5">{m.address}</p>
                  <p className="text-white/25 text-[11px] mt-0.5">조회 {m.clickCount ?? 0}회</p>
                </div>
                <Link
                  href={`/owner/mechanics/${m.id}/edit`}
                  className="text-xs font-medium shrink-0"
                  style={{ color: '#D4AF37' }}
                >
                  수정
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 빠른 링크 */}
      <div
        className="rounded-xl p-4 border"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-white/30 text-xs mb-3">더 많은 기능</p>
        <div className="flex flex-col gap-2">
          {[
            { label: '문의 관리', href: '/owner', desc: '받은 고객 문의 확인' },
            { label: '월간 리포트', href: '/owner/report', desc: '조회수·지역 순위' },
            { label: '정비소 수정', href: '/owner/mechanics', desc: '사진·영업시간 등 관리' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between py-2.5 border-b last:border-b-0 group transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div>
                <p className="text-white/70 text-sm group-hover:text-white transition-colors">{item.label}</p>
                <p className="text-white/25 text-[11px]">{item.desc}</p>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
