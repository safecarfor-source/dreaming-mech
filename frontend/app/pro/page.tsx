'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MapPin, Bell, Video, Search } from 'lucide-react';
import { mechanicsApi } from '@/lib/api';
import { Mechanic } from '@/types';

// 카카오 로그인 URL (from=pro 파라미터 → 로그인 후 /owner로 리다이렉트)
const KAKAO_LOGIN_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao?from=pro`;

// 지역별 한정 수량 데이터 (10석 기준)
const REGION_QUOTA = 10;

const REGION_ORDER = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '경남', '경북'];

type RegionStat = {
  sido: string;
  count: number;
};

function RegionBar({ sido, count }: { sido: string; count: number }) {
  const remaining = Math.max(0, REGION_QUOTA - count);
  const pct = Math.min(100, (count / REGION_QUOTA) * 100);
  const isFull = remaining === 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-xs w-12 shrink-0">{sido}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: isFull ? '#ef4444' : '#D4AF37',
          }}
        />
      </div>
      <span
        className="text-xs font-semibold w-14 text-right shrink-0"
        style={{ color: isFull ? '#ef4444' : '#D4AF37' }}
      >
        {isFull ? '마감' : `${remaining}석 남음`}
      </span>
    </div>
  );
}

export default function ProPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await mechanicsApi.getAll({ limit: 6 });
        const list: Mechanic[] = res.data?.data ?? (res.data as unknown as Mechanic[]) ?? [];
        setMechanics(list.slice(0, 6));

        // 지역별 집계
        const countMap: Record<string, number> = {};
        list.forEach((m) => {
          const sido = m.address?.split(' ')[0] ?? '기타';
          countMap[sido] = (countMap[sido] ?? 0) + 1;
        });
        const stats = REGION_ORDER
          .map((sido) => ({ sido, count: countMap[sido] ?? 0 }))
          .filter((s) => s.count > 0);
        // 등록 없어도 샘플로 서울/경기/부산 표시
        if (stats.length === 0) {
          setRegionStats([
            { sido: '서울', count: 6 },
            { sido: '경기', count: 4 },
            { sido: '부산', count: 2 },
            { sido: '인천', count: 1 },
          ]);
        } else {
          setRegionStats(stats);
        }
      } catch {
        setRegionStats([
          { sido: '서울', count: 6 },
          { sido: '경기', count: 4 },
          { sido: '부산', count: 2 },
          { sido: '인천', count: 1 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const benefits = [
    {
      icon: <Search size={20} />,
      title: '지도 검색 노출',
      desc: '고객이 지역 정비소를 검색할 때 내 정비소가 상단에 노출됩니다.',
    },
    {
      icon: <Video size={20} />,
      title: '유튜브 촬영 지원',
      desc: '꿈꾸는정비사 채널(5.3만 구독)에서 정비소를 직접 촬영·소개합니다.',
    },
    {
      icon: <Bell size={20} />,
      title: '고객 문의 알림',
      desc: '내 지역에 고객 문의가 들어오면 즉시 알림을 받을 수 있습니다.',
    },
  ];

  return (
    <div className="max-w-[520px] mx-auto">
      {/* ── 히어로 ── */}
      <section className="min-h-[calc(100svh-56px)] flex flex-col justify-center px-5 pt-8 pb-16 relative overflow-hidden">
        {/* 배경 골드 글로우 */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[120px] pointer-events-none"
          style={{ backgroundColor: 'rgba(212,175,55,0.08)' }}
        />

        <div className="relative z-10">
          {/* 배지 */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border"
            style={{ borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(212,175,55,0.06)' }}
          >
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: '#D4AF37' }}>
              정비사 전용
            </span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D4AF37' }} />
            <span className="text-white/50 text-[10px]">구당 {REGION_QUOTA}자리 한정</span>
          </motion.div>

          {/* 헤드라인 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-black text-white leading-[1.15] mb-6 break-keep"
            style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)', lineHeight: 1.15 }}
          >
            브랜딩 된 정비소는
            <br />
            <span style={{ color: '#D4AF37' }}>잊혀질 수 없습니다.</span>
          </motion.h1>

          {/* 서브카피 */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/50 text-[15px] leading-[1.65] mb-10 break-keep"
          >
            20년 경력 정비 전문가가 직접 소개합니다.
            <br />
            지역 한정 자리가 빠르게 마감되고 있습니다.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <a
              href={KAKAO_LOGIN_URL}
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all duration-150"
              style={{ backgroundColor: '#D4AF37', color: '#1A1A1A' }}
            >
              카카오로 1초 가입
              <ArrowRight size={18} />
            </a>
            <a
              href={KAKAO_LOGIN_URL}
              className="text-center text-sm text-white/40 hover:text-white/70 transition-colors py-2"
            >
              이미 가입하셨나요? 로그인
            </a>
            <a
              href="/"
              className="text-center text-sm text-white/30 hover:text-white/50 transition-colors py-1"
            >
              일반 고객이신가요? 소비자 페이지로 →
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 지역 등록 현황 ── */}
      <section className="px-5 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212,175,55,0.15)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1" style={{ color: '#D4AF37' }}>
                  지역별 등록 현황
                </p>
                <p className="text-white/40 text-[11px]">구당 {REGION_QUOTA}자리 한정 · 실시간</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                LIVE
              </span>
            </div>
            <div className="flex flex-col gap-3.5">
              {regionStats.map((r) => (
                <RegionBar key={r.sido} sido={r.sido} count={r.count} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 등록된 정비소 카드 ── */}
      {!loading && mechanics.length > 0 && (
        <section className="px-5 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1" style={{ color: '#D4AF37' }}>
              등록된 정비소
            </p>
            <h2 className="text-white font-bold text-lg mb-5 break-keep">이미 함께하고 있습니다</h2>
            <div className="grid grid-cols-2 gap-3">
              {mechanics.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="rounded-xl overflow-hidden border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  {/* 사진 */}
                  <div className="aspect-[4/3] bg-white/5 relative">
                    {(m.mainImageUrl || m.galleryImages?.[0]) ? (
                      <img
                        src={m.mainImageUrl || m.galleryImages![0]}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    {/* PRO 배지 */}
                    <span
                      className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#D4AF37', color: '#1A1A1A', letterSpacing: '0.08em' }}
                    >
                      PRO
                    </span>
                  </div>
                  {/* 정보 */}
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold leading-tight truncate">{m.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-white/30 shrink-0" />
                      <p className="text-white/40 text-[11px] truncate">{m.address?.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── 혜택 섹션 ── */}
      <section className="px-5 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-semibold tracking-[0.12em] uppercase mb-1" style={{ color: '#D4AF37' }}>
            혜택
          </p>
          <h2 className="text-white font-bold text-lg mb-5 break-keep">사장님께 드리는 3가지</h2>
          <div className="flex flex-col gap-3">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-4 p-4 rounded-xl border"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}
                >
                  {b.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1 break-keep">{b.title}</p>
                  <p className="text-white/45 text-[13px] leading-[1.65] break-keep">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 최종 CTA ── */}
      <section className="px-5 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl p-6 text-center border"
          style={{ backgroundColor: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.2)' }}
        >
          <p className="text-white font-bold text-lg mb-2 break-keep">지금 자리를 확보하세요</p>
          <p className="text-white/45 text-sm mb-6 break-keep">가입은 무료입니다. 카카오 1초면 완료!</p>
          <a
            href={KAKAO_LOGIN_URL}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all duration-150"
            style={{ backgroundColor: '#D4AF37', color: '#1A1A1A' }}
          >
            카카오로 1초 가입
            <ArrowRight size={18} />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
