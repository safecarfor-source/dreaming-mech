'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  ArrowRight,
  Eye,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';

export default function ForMechanicsPage() {
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCta(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = {
    totalViews: '4,041만',
    watchTimeHours: '82.1만',
    subscribers: '5.3만',
    monthlyViewers: '34만',
  };

  return (
    <Layout>
      {/* ══════════════════════════════════════════════
          섹션 1: 히어로 — 정비사가 공감할 수 있는 메시지
      ══════════════════════════════════════════════ */}
      <section className="min-h-[85vh] md:min-h-screen flex items-center relative overflow-hidden bg-[#0a0a0a] pt-16 md:pt-20">
        <div className="container mx-auto px-5 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl"
          >
            <p className="text-[#a6f546] text-xs md:text-sm font-semibold tracking-[0.2em] mb-4 md:mb-6">
              FOR AUTO MECHANICS
            </p>

            <h1
              className="font-black text-white leading-[1.12] mb-5 md:mb-8 break-keep"
              style={{ fontSize: 'clamp(1.75rem, 6vw, 4.5rem)' }}
            >
              실력만으로는
              <br />
              <span className="bg-[#a6f546] text-[#111] px-1.5 md:px-2 py-0.5">
                고객이 찾아오지 않는
              </span>
              <br />
              시대입니다.
            </h1>

            <p
              className="text-gray-400 mb-3 break-keep"
              style={{ fontSize: 'clamp(0.938rem, 2vw, 1.375rem)' }}
            >
              옆 가게보다 잘 고쳐도, 알려지지 않으면 빈 리프트.
            </p>
            <p
              className="text-white font-bold mb-8 md:mb-12 break-keep"
              style={{ fontSize: 'clamp(0.938rem, 2vw, 1.375rem)' }}
            >
              이제는 <span className="text-[#a6f546]">내 이름을 걸고 알리는</span> 정비사가 이깁니다.
            </p>

            <Link
              href="/owner/login"
              className="inline-flex items-center gap-2 bg-[#a6f546] hover:bg-[#8fd93a] text-[#111] px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg transition-all shadow-lg shadow-[#a6f546]/20"
            >
              카카오로 3초 가입
              <ArrowRight size={18} />
            </Link>
          </motion.div>

          {/* 스크롤 힌트 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 md:mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a6f546" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 다크 → 라이트 전환 */}
      <div className="h-16 md:h-24 bg-gradient-to-b from-[#0a0a0a] to-white" />

      {/* ══════════════════════════════════════════════
          섹션 2: 유튜브 채널 실적 — 숫자로 증명
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8 md:mb-14">
                <p className="text-[#65a30d] text-xs font-semibold tracking-[0.2em] mb-3">
                  YOUTUBE CHANNEL
                </p>
                <h2
                  className="font-black text-[#111] break-keep leading-tight mb-3 md:mb-5"
                  style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
                >
                  누적 <span className="text-[#65a30d]">{stats.totalViews}</span> 조회,
                  <br className="md:hidden" />
                  {' '}이 채널이{' '}
                  <br className="hidden md:block" />
                  사장님의 정비소를 알립니다
                </h2>
                <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto break-keep">
                  &quot;꿈꾸는 정비사&quot; 유튜브 채널이
                  매달 <span className="font-bold text-[#111]">{stats.monthlyViewers}명</span>의 시청자에게
                  도달합니다.
                </p>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 mb-8 md:mb-12">
                {[
                  { icon: <Eye size={22} />, value: stats.totalViews, label: '누적 조회수' },
                  { icon: <Users size={22} />, value: stats.subscribers, label: '구독자' },
                  { icon: <TrendingUp size={22} />, value: stats.monthlyViewers, label: '월간 시청자' },
                  { icon: <Clock size={22} />, value: stats.watchTimeHours, label: '총 시청 시간' },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 md:p-5 text-center border border-gray-100">
                    <div className="text-[#65a30d] flex justify-center mb-2">{s.icon}</div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#111] whitespace-nowrap">{s.value}</p>
                    <p className="text-gray-500 text-[11px] md:text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* 잠재 고객 계산 박스 */}
              <div className="bg-[#111] rounded-2xl px-5 py-6 md:px-10 md:py-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#a6f546]/15 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-center text-gray-400 text-xs font-semibold tracking-widest mb-5 md:mb-6">
                    매달 {stats.monthlyViewers} 시청자 중, 단 1%만 방문한다면?
                  </p>

                  <div className="flex flex-col items-center gap-1 md:flex-row md:justify-center md:gap-[2vw]">
                    <div className="text-center">
                      <p className="text-4xl md:text-6xl lg:text-7xl font-black text-white">34만</p>
                      <p className="text-gray-500 text-[11px] md:text-sm mt-1">월간 시청자</p>
                    </div>
                    <p className="text-2xl md:text-5xl font-black text-[#a6f546]">×</p>
                    <p className="text-2xl md:text-5xl font-black text-[#a6f546]">1%</p>
                    <p className="text-2xl md:text-5xl font-black text-white">=</p>
                    <div className="text-center">
                      <p className="text-4xl md:text-6xl lg:text-7xl font-black text-[#a6f546]">3,400명</p>
                      <p className="text-gray-500 text-[11px] md:text-sm mt-1">매달 잠재 고객</p>
                    </div>
                  </div>

                  <p className="text-center text-gray-500 text-xs md:text-sm mt-5 md:mt-7">
                    이 중 <span className="text-[#a6f546] font-bold">82.7%</span>가 25~64세.{' '}
                    <span className="text-white font-semibold">차량을 소유하고 정비비를 직접 지출하는 핵심 소비층</span>입니다.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 3: 3단계 프로세스 + 최종 CTA
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center mb-8 md:mb-14">
              <p className="text-[#65a30d] text-xs font-semibold tracking-[0.2em] mb-3">
                HOW IT WORKS
              </p>
              <h2
                className="font-black text-[#111] break-keep"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
              >
                <span className="text-[#65a30d]">3단계</span>로 시작하세요
              </h2>
            </div>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-5">
              {[
                { step: 1, title: '카카오 가입', desc: '3초면 완료' },
                { step: 2, title: '정비소 등록', desc: '사진 · 위치 · 소개글' },
                { step: 3, title: '고객 유입', desc: '노출 → 방문 증가' },
              ].map((item, i) => (
                <AnimatedSection key={item.step} animation="slideUp" delay={i * 0.1} duration={0.5}>
                  <div className="flex items-center gap-4 lg:flex-col lg:text-center bg-white rounded-xl p-4 lg:p-5 border border-gray-100">
                    <div className="w-12 h-12 bg-[#a6f546] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#a6f546]/20">
                      <span className="text-[#111] text-lg font-black">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#111]">{item.title}</h3>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 4: 최종 CTA
      ══════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-[#a6f546] to-[#65a30d] py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center max-w-lg mx-auto">
              <h2
                className="font-black text-[#111] break-keep mb-4 md:mb-6"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
              >
                내 이름으로 시작하는
                <br />
                브랜딩, 지금부터.
              </h2>
              <p className="text-[#111]/70 text-sm md:text-base mb-6 md:mb-8 break-keep">
                프랜차이즈가 아닌, <span className="font-bold">사장님의 이름</span>으로 승부하세요.
              </p>
              <Link
                href="/owner/login"
                className="inline-flex items-center gap-2 bg-[#111] text-[#a6f546] hover:bg-[#222] px-7 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg transition-all shadow-xl"
              >
                카카오로 3초 가입
                <ChevronRight size={18} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 모바일 스티키 CTA 바 ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          showStickyCta ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <Link
            href="/owner/login"
            className="flex items-center justify-center gap-2 w-full bg-[#a6f546] hover:bg-[#8fd93a] text-[#111] py-3.5 rounded-xl font-bold text-sm transition-colors"
          >
            카카오로 3초 가입
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
