'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  Eye,
  Users,
  Clock,
  TrendingUp,
  Wrench,
  Phone,
  Shield,
  MessageCircle,
  MapPin,
  Star,
  Youtube,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';
import ServiceInquiryFunnel from '@/components/ServiceInquiryFunnel';

export default function AboutPage() {
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [recentCount, setRecentCount] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCta(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 최근 7일 문의 통계
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/unified-inquiries/public-stats`);
        if (res.ok) {
          const data = await res.json();
          setRecentCount(data.recentCount);
        }
      } catch {
        // 통계 로드 실패해도 페이지는 정상 표시
      }
    };
    fetchStats();
  }, []);

  // 문의 폼으로 스크롤
  const scrollToInquiry = useCallback(() => {
    const el = document.getElementById('inquiry-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          섹션 1: 히어로 — 유튜브에서 온 방문자 환영
      ══════════════════════════════════════════════ */}
      <section className="min-h-[90vh] flex items-center relative overflow-hidden bg-gradient-to-br from-[#1A0A2E] via-[#0f0520] to-[#0a0a14] pt-16 md:pt-20">
        {/* 배경 글로우 */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-5 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* 유튜브 뱃지 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-6 md:mb-8"
            >
              <Youtube size={16} className="text-red-400" />
              <span className="text-white/80 text-xs md:text-sm font-medium">
                구독자 {stats.subscribers} 유튜브 채널이 만든 플랫폼
              </span>
            </motion.div>

            <h1
              className="font-black text-white leading-[1.1] mb-5 md:mb-8 break-keep"
              style={{ fontSize: 'clamp(1.75rem, 5.5vw, 4rem)' }}
            >
              내 차 정비,
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
                믿을 수 있는 곳
              </span>
              에서.
            </h1>

            <p
              className="text-white/60 mb-4 break-keep max-w-2xl mx-auto"
              style={{ fontSize: 'clamp(0.938rem, 2vw, 1.25rem)' }}
            >
              20년 경력 정비사가 직접 검증한 전국 정비소.
              <br className="hidden md:block" />
              {' '}유튜브가 아닌, <span className="text-white font-semibold">직접 연결</span>해 드립니다.
            </p>

            {recentCount !== null && recentCount > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-brand-300/80 text-sm mb-8 md:mb-10"
              >
                최근 7일간 <span className="font-bold text-brand-300">{recentCount}건</span>의 정비 문의가 접수되었습니다
              </motion.p>
            )}

            {/* 듀얼 CTA — 문의는 페이지 내 스크롤 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={scrollToInquiry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-7 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all shadow-lg shadow-brand-500/25 cursor-pointer"
              >
                <Phone size={18} />
                바로 문의하기
                <ArrowRight size={16} />
              </button>
              <Link
                href="/owner/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-7 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all backdrop-blur-sm"
              >
                <Wrench size={18} />
                정비사 가입하기
                <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* 스크롤 힌트 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center mt-12 md:mt-16"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 다크 → 라이트 전환 */}
      <div className="h-16 md:h-24 bg-gradient-to-b from-[#0a0a14] to-white" />

      {/* ══════════════════════════════════════════════
          섹션 2: 이런 분이 오셨군요 — 세그먼트 안내
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center mb-8 md:mb-14">
              <p className="text-brand-500 text-xs font-semibold tracking-[0.2em] mb-3">
                FOR EVERYONE
              </p>
              <h2
                className="font-black text-[#111] break-keep leading-tight"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 2.5rem)' }}
              >
                어떻게 도와드릴까요?
              </h2>
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* 고객용 카드 — 클릭 시 페이지 내 문의폼으로 스크롤 */}
            <AnimatedSection animation="slideUp" delay={0} duration={0.5}>
              <button onClick={scrollToInquiry} className="block group w-full text-left">
                <div className="relative bg-gradient-to-br from-brand-50 to-white border-2 border-brand-100 hover:border-brand-300 rounded-2xl p-6 md:p-8 transition-all duration-200 hover:shadow-lg hover:shadow-brand-100/50">
                  <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-4 shadow-sm shadow-brand-500/20">
                    <Phone size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111] mb-2">차량 정비가 필요해요</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed break-keep">
                    지역 선택 → 서비스 선택 → 전화번호 입력
                    <br />
                    <span className="font-medium text-gray-700">30초면 문의 완료!</span> 검증된 정비사가 직접 연락드립니다.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {['엔진오일·타이어·브레이크 등', '전국 어디서나 가능', '전화번호만 있으면 OK'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={14} className="text-brand-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1 text-brand-500 font-semibold text-sm group-hover:gap-2 transition-all">
                    아래에서 바로 문의하기
                    <ArrowRight size={16} />
                  </div>
                </div>
              </button>
            </AnimatedSection>

            {/* 정비사용 카드 */}
            <AnimatedSection animation="slideUp" delay={0.1} duration={0.5}>
              <Link href="/for-mechanics" className="block group">
                <div className="relative bg-gradient-to-br from-amber-50 to-white border-2 border-amber-100 hover:border-amber-300 rounded-2xl p-6 md:p-8 transition-all duration-200 hover:shadow-lg hover:shadow-amber-100/50">
                  <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center mb-4 shadow-sm shadow-accent-500/20">
                    <Wrench size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111] mb-2">정비사 사장님이에요</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed break-keep">
                    카카오 3초 가입 → 정비소 등록 → 고객 유입
                    <br />
                    <span className="font-medium text-gray-700">52K 유튜브 채널</span>이 사장님의 정비소를 알립니다.
                  </p>
                  <ul className="space-y-2 mb-5">
                    {['무료 가입 · 무료 등록', '유튜브 + 검색 통한 고객 유입', '문의 알림 → 직접 전화 연결'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={14} className="text-accent-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1 text-accent-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    정비사 가입하기
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 3: 왜 꿈꾸는정비사인가 — 신뢰 근거
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center mb-8 md:mb-14">
              <p className="text-brand-500 text-xs font-semibold tracking-[0.2em] mb-3">
                WHY US
              </p>
              <h2
                className="font-black text-[#111] break-keep leading-tight"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 2.5rem)' }}
              >
                왜 <span className="text-brand-500">꿈꾸는정비사</span>인가요?
              </h2>
            </div>
          </AnimatedSection>

          <div className="max-w-5xl mx-auto">
            {/* 유튜브 통계 */}
            <AnimatedSection animation="slideUp" delay={0.1} duration={0.6}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 mb-8 md:mb-12">
                {[
                  { icon: <Eye size={22} />, value: stats.totalViews, label: '누적 조회수', color: 'text-brand-500' },
                  { icon: <Users size={22} />, value: stats.subscribers, label: '유튜브 구독자', color: 'text-brand-500' },
                  { icon: <TrendingUp size={22} />, value: stats.monthlyViewers, label: '월간 시청자', color: 'text-brand-500' },
                  { icon: <Clock size={22} />, value: stats.watchTimeHours, label: '총 시청 시간', color: 'text-brand-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 md:p-5 text-center border border-gray-100 shadow-sm">
                    <div className={`${s.color} flex justify-center mb-2`}>{s.icon}</div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#111] whitespace-nowrap">{s.value}</p>
                    <p className="text-gray-500 text-[11px] md:text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* 3가지 차별점 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  icon: <Shield size={24} />,
                  title: '20년 경력의 검증',
                  desc: '영상에서만 보던 정비사가 직접 검증한 정비소. 실력 있는 곳만 등록됩니다.',
                  gradient: 'from-brand-500 to-brand-600',
                },
                {
                  icon: <Zap size={24} />,
                  title: '30초 만에 문의',
                  desc: '회원가입 없이 전화번호만 입력하면 끝. 정비사가 먼저 연락드립니다.',
                  gradient: 'from-brand-500 to-brand-600',
                },
                {
                  icon: <MapPin size={24} />,
                  title: '전국 어디서나',
                  desc: '서울부터 제주까지. 내 지역의 검증된 정비소를 바로 찾을 수 있습니다.',
                  gradient: 'from-brand-500 to-brand-600',
                },
              ].map((item, i) => (
                <AnimatedSection key={i} animation="slideUp" delay={i * 0.1} duration={0.5}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                    <div className={`w-11 h-11 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                      <span className="text-white">{item.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#111] mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed break-keep">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 4: 소셜 프루프 — 신뢰 강화
      ══════════════════════════════════════════════ */}
      <section className="bg-[#111] py-12 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent-500/10 rounded-full blur-[80px]" />

        <div className="container mx-auto px-5 md:px-6 relative z-10">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-3xl mx-auto text-center">
              <Star size={32} className="text-accent-400 mx-auto mb-4" />
              <h2
                className="font-black text-white break-keep leading-tight mb-4 md:mb-6"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 2.5rem)' }}
              >
                유튜브에서 보시고
                <br />
                여기까지 오셨죠?
              </h2>
              <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto mb-6 md:mb-8 break-keep leading-relaxed">
                영상으로만 도움 드리는 건 한계가 있었습니다.
                <br />
                그래서 <span className="text-white font-semibold">직접 플랫폼을 만들었습니다</span>.
                <br />
                정비사와 고객을 <span className="text-brand-300 font-semibold">직접 연결</span>하기 위해.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <a
                  href="https://www.youtube.com/@%EA%BF%88%EA%BE%B8%EB%8A%94%EC%A0%95%EB%B9%84%EC%82%AC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  <Youtube size={18} />
                  유튜브 채널 보기
                </a>
                <button
                  onClick={scrollToInquiry}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors backdrop-blur-sm cursor-pointer"
                >
                  <Phone size={18} />
                  바로 문의하기
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 5: 문의 폼 — 페이지 내 직접 접수
      ══════════════════════════════════════════════ */}
      <section id="inquiry-section" className="bg-[#F8F7FC] py-12 md:py-20 scroll-mt-16">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center mb-8 md:mb-10">
              <p className="text-brand-500 text-xs font-semibold tracking-[0.2em] mb-3">
                QUICK INQUIRY
              </p>
              <h2
                className="font-black text-[#111] break-keep leading-tight mb-2"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 2.5rem)' }}
              >
                지금 바로 <span className="text-brand-500">문의</span>하세요
              </h2>
              <p className="text-gray-500 text-sm">
                회원가입 없이 30초면 접수 완료 · 검증된 정비사가 직접 연락드립니다
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-2xl mx-auto">
            <ServiceInquiryFunnel compact />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 6: 정비사 가입 CTA
      ══════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 py-12 md:py-16">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="text-center max-w-lg mx-auto">
              <h2
                className="font-black text-white break-keep mb-3 md:mb-4"
                style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2rem)' }}
              >
                정비사 사장님이시라면?
              </h2>
              <p className="text-white/80 text-sm mb-6 break-keep">
                52K 유튜브 채널이 사장님의 정비소를 알립니다
              </p>
              <Link
                href="/owner/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-600 hover:bg-gray-50 px-7 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all shadow-lg"
              >
                <Wrench size={18} />
                카카오로 3초 가입
                <ChevronRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 모바일 스티키 CTA 바 — 문의는 페이지 내 스크롤 ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          showStickyCta ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex gap-2">
            <button
              onClick={scrollToInquiry}
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              <Phone size={14} />
              바로 문의
            </button>
            <Link
              href="/owner/login"
              className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              <Wrench size={14} />
              사장님
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
