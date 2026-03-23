'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, Globe, Video, Bell, ArrowRight } from 'lucide-react';
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

  const benefits = [
    {
      icon: <Phone size={22} />,
      title: '가입 즉시 고객 전화번호 확인',
      desc: '카카오 3초 가입만 하면 접수된 고객 문의의 연락처를 바로 확인할 수 있습니다.',
    },
    {
      icon: <Globe size={22} />,
      title: '정비소 등록 = 플랫폼 노출',
      desc: '지도 검색, 지역별 목록에 사장님의 정비소가 노출됩니다.',
    },
    {
      icon: <Video size={22} />,
      title: '유튜브 촬영까지 무료',
      desc: '꿈꾸는정비사 채널에서 사장님의 정비 실력을 직접 촬영·소개합니다.',
    },
    {
      icon: <Bell size={22} />,
      title: '내 지역 문의 실시간 알림',
      desc: '고객이 내 지역에서 정비 문의를 하면 즉시 웹 알림이 갑니다.',
    },
  ];

  const steps = [
    {
      step: 1,
      title: '카카오 가입',
      desc: '카카오 로그인 3초면 끝. 가입 즉시 고객 전화번호를 확인할 수 있습니다.',
    },
    {
      step: 2,
      title: '사업자 정보 제출',
      desc: '사업자등록증, 상호, 전화번호를 제출하면 팩트 체크 후 승인됩니다.',
    },
    {
      step: 3,
      title: '정비소 등록',
      desc: '승인 후 정비소를 등록하면 플랫폼에 노출되고, 유튜브 촬영까지 진행됩니다.',
    },
  ];

  return (
    <Layout>
      {/* ══════════════════════════════════════════════
          섹터 1 — 히어로 + 유튜브 입증 통합 (다크 배경)
      ══════════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0a0a] pt-20 pb-16 md:pt-24 md:pb-20">
        {/* 배경 그라디언트 장식 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-consumer-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-5 md:px-6 relative z-10 flex flex-col items-center text-center">
          {/* 유튜브 배지 */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-4 py-2 mb-8 md:mb-10"
          >
            <span className="text-[#FF0000] text-xs font-bold tracking-wide">YouTube</span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-white/70 text-xs">꿈꾸는정비사</span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white text-xs font-semibold">조회수 4,041만</span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white text-xs font-semibold">구독자 5.3만</span>
          </motion.div>

          {/* 메인 h1 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="font-black text-white leading-[1.15] mb-6 md:mb-8 break-keep"
            style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}
          >
            사장님의 실력,
            <br />
            <span className="text-consumer-500">4,041만 시청자</span>에게
            <br />
            알립니다
          </motion.h1>

          {/* 서브카피 */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="text-gray-400 text-base md:text-lg leading-[1.65] mb-10 md:mb-12 max-w-md break-keep"
          >
            20년 경력 정비 전문가가 직접 촬영·소개합니다.
            <br />
            가입만 하면 바로 시작됩니다.
          </motion.p>

          {/* CTA 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link
              href="/pro/login?from=pro"
              className="inline-flex items-center gap-2.5 bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] px-8 py-4 md:px-10 md:py-5 rounded-2xl font-bold text-base md:text-lg transition-all duration-150 shadow-lg shadow-[#FEE500]/20"
              style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              카카오로 3초 가입
              <ArrowRight size={18} />
            </Link>
          </motion.div>

          {/* 통계 카드 3개 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="grid grid-cols-3 gap-3 md:gap-5 mt-14 md:mt-20 w-full max-w-xl"
          >
            {[
              { value: '4,041만+', label: '총 조회수' },
              { value: '5.3만+', label: '구독자' },
              { value: '500+', label: '영상 수' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/6 border border-white/10 rounded-xl md:rounded-2xl px-3 py-4 md:px-5 md:py-6 text-center"
              >
                <p className="text-white font-black text-xl md:text-3xl leading-tight">{stat.value}</p>
                <p className="text-white/50 text-[11px] md:text-xs mt-1.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 다크 → 라이트 전환 */}
      <div className="h-12 md:h-16 bg-gradient-to-b from-[#0a0a0a] to-white" />

      {/* ══════════════════════════════════════════════
          섹터 2 — 4가지 혜택 (라이트 배경 white)
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.6}>
            <div className="text-center mb-10 md:mb-16">
              <p className="text-consumer-500 text-xs font-semibold tracking-[0.15em] mb-3 uppercase">
                Benefits
              </p>
              <h2
                className="font-black text-gray-900 break-keep leading-[1.2]"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2.75rem)' }}
              >
                사장님께 드리는 혜택
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {benefits.map((benefit, i) => (
              <AnimatedSection key={i} animation="slideUp" delay={i * 0.08} duration={0.5}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-7 h-full">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-consumer-50 rounded-xl flex items-center justify-center text-consumer-500 mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-gray-900 font-bold text-base md:text-lg leading-[1.3] mb-2 break-keep">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-[1.65] break-keep">
                    {benefit.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹터 3 — 3단계 프로세스 (연한 핑크 배경 consumer-50)
      ══════════════════════════════════════════════ */}
      <section className="bg-consumer-50 py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.6}>
            <div className="text-center mb-10 md:mb-16">
              <p className="text-consumer-500 text-xs font-semibold tracking-[0.15em] mb-3 uppercase">
                How It Works
              </p>
              <h2
                className="font-black text-gray-900 break-keep leading-[1.2]"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2.75rem)' }}
              >
                간단한 3단계로 시작하세요
              </h2>
            </div>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-start">
              {steps.map((item, i) => (
                <AnimatedSection key={item.step} animation="slideUp" delay={i * 0.1} duration={0.5}>
                  <div className="flex md:flex-col md:items-center md:text-center flex-1 relative">
                    {/* 연결선 (데스크탑) */}
                    {i < steps.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-consumer-500/20" />
                    )}
                    {/* 번호 원 */}
                    <div className="w-12 h-12 rounded-full bg-consumer-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-consumer-500/25 md:mb-4 mr-4 md:mr-0 relative z-10">
                      <span className="text-white font-black text-lg">{item.step}</span>
                    </div>
                    {/* 텍스트 */}
                    <div className="md:px-4">
                      <h3 className="text-gray-900 font-bold text-base md:text-lg leading-tight mb-1 break-keep">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-[1.65] break-keep">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹터 4 — 최종 CTA (다크 배경 #0a0a0a)
      ══════════════════════════════════════════════ */}
      <section className="bg-[#0a0a0a] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-consumer-500/12 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-5 md:px-6 relative z-10">
          <AnimatedSection animation="slideUp" duration={0.6}>
            <div className="text-center max-w-lg mx-auto">
              <h2
                className="font-black text-white break-keep leading-[1.2] mb-4 md:mb-6"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2.75rem)' }}
              >
                지금 바로 시작하세요
              </h2>
              <p className="text-gray-400 text-base leading-[1.65] mb-8 md:mb-10 break-keep">
                가입은 무료입니다. 카카오 로그인 3초면 완료!
              </p>
              <Link
                href="/pro/login?from=pro"
                className="inline-flex items-center gap-2.5 bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] px-8 py-4 md:px-10 md:py-5 rounded-2xl font-bold text-base md:text-lg transition-all duration-150 shadow-lg shadow-[#FEE500]/20"
                style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                카카오로 3초 가입
                <ArrowRight size={18} />
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
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div
          className="bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Link
            href="/pro/login?from=pro"
            className="flex items-center justify-center gap-2 w-full bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] py-3.5 rounded-xl font-bold text-sm transition-all duration-150"
            style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            카카오로 3초 가입
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
