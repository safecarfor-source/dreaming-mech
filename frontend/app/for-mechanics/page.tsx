'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Search,
  Shield,
  BarChart3,
  Wrench,
  ChevronRight,
  CheckCircle2,
  Star,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';

const benefits = [
  {
    icon: Users,
    title: '신규 고객 유입',
    description: '전국의 차량 소유주가 믿을 수 있는 정비소를 찾고 있습니다. 등록만으로 새로운 고객을 만나보세요.',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    icon: Search,
    title: '온라인 노출 확대',
    description: '네이버, 구글 검색에서 우리 사이트를 통해 정비소가 더 많이 노출됩니다.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: TrendingUp,
    title: '실시간 통계 제공',
    description: '조회수, 클릭수 등 정비소 관심도를 실시간으로 확인할 수 있습니다.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Shield,
    title: '신뢰도 향상',
    description: '"꿈꾸는 정비사" 유튜브 채널(구독자 5만+)과 함께 소비자 신뢰를 높입니다.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: BarChart3,
    title: '무료 홍보 효과',
    description: '유튜브 영상 노출, SNS 공유 등 추가 비용 없이 정비소를 알립니다.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Wrench,
    title: '정비사 커뮤니티',
    description: '전국 정비사 네트워크에 합류하여 정보를 공유하고 함께 성장합니다.',
    color: 'from-violet-500 to-purple-600',
  },
];

const steps = [
  { step: 1, title: '가입 신청', desc: '네이버 또는 카카오로 간편 가입' },
  { step: 2, title: '관리자 승인', desc: '신청 내용 확인 후 빠른 승인' },
  { step: 3, title: '정비소 등록', desc: '사진, 위치, 소개글 직접 등록' },
  { step: 4, title: '고객 유입 시작', desc: '사이트에 노출되어 고객 방문 증가' },
];

export default function ForMechanicsPage() {
  return (
    <Layout>
      {/* 히어로 섹션 */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-16 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a]">
        {/* 배경 효과 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#bf00ff]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* 배지 */}
            <div className="inline-flex items-center gap-2 bg-[#bf00ff]/20 border border-[#bf00ff]/30 rounded-full px-5 py-2 mb-8">
              <Star size={16} className="text-[#bf00ff]" />
              <span className="text-[#bf00ff] text-sm font-semibold">정비사 전용 페이지</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6 break-keep">
              정비소를 <span className="text-[#bf00ff]">알리세요</span>
              <br />
              고객이 <span className="text-[#bf00ff]">찾아옵니다</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-4 break-keep">
              구독자 5만명의 &quot;꿈꾸는 정비사&quot; 채널과 함께
            </p>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 break-keep">
              전국의 소비자에게 정비소를 소개하세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/owner/login"
                className="inline-flex items-center justify-center gap-2 bg-[#bf00ff] hover:bg-[#a000dd] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#bf00ff]/30 hover:shadow-[#bf00ff]/50"
              >
                무료로 등록하기
                <ArrowRight size={20} />
              </Link>
              <a
                href="#benefits"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white hover:border-white/40 px-8 py-4 rounded-2xl font-bold text-lg transition-all"
              >
                자세히 알아보기
              </a>
            </div>
          </motion.div>

          {/* 스크롤 인디케이터 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex justify-center"
          >
            <div className="w-8 h-14 border-2 border-white/30 rounded-full flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 bg-[#bf00ff] rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 다크 → 흰색 전환 */}
      <div className="h-32 bg-gradient-to-b from-[#0a0a0a] to-white" />

      {/* 혜택 섹션 */}
      <section id="benefits" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center mb-16">
              <p className="text-[#bf00ff] text-sm font-semibold tracking-widest mb-4">
                WHY US
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-4 break-keep">
                왜 <span className="text-[#bf00ff]">꿈꾸는 정비사</span>에 등록해야 할까요?
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto break-keep">
                등록만으로 누릴 수 있는 다양한 혜택을 확인하세요
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <AnimatedSection key={benefit.title} animation="slideUp" delay={index * 0.1} duration={0.5}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 hover:shadow-xl hover:border-[#bf00ff]/30 transition-all group h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <benefit.icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111] mb-3">{benefit.title}</h3>
                  <p className="text-gray-500 leading-relaxed break-keep">{benefit.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 가입 프로세스 */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center mb-16">
              <p className="text-[#bf00ff] text-sm font-semibold tracking-widest mb-4">
                HOW IT WORKS
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-4 break-keep">
                <span className="text-[#bf00ff]">4단계</span>로 시작하세요
              </h2>
              <p className="text-gray-500 text-lg break-keep">간단한 과정으로 정비소를 등록할 수 있습니다</p>
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item, index) => (
                <AnimatedSection key={item.step} animation="slideUp" delay={index * 0.15} duration={0.5}>
                  <div className="text-center relative">
                    {/* 연결선 (데스크톱) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#bf00ff]/40 to-[#bf00ff]/10" />
                    )}
                    <div className="w-16 h-16 bg-[#bf00ff] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#bf00ff]/20 relative z-10">
                      <span className="text-white text-2xl font-black">{item.step}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#111] mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm break-keep">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 유튜브 채널 소개 */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#0a0a0a] to-[#1a0a2e] rounded-3xl p-8 md:p-12 overflow-hidden relative">
              {/* 배경 효과 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#bf00ff]/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-red-500/20 rounded-full px-4 py-1.5 mb-6">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-400 text-xs font-semibold">YouTube</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-4 break-keep">
                      구독자 <span className="text-[#bf00ff]">52,000명</span>의
                      <br />
                      &quot;꿈꾸는 정비사&quot; 채널
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed break-keep">
                      20년 경력의 자동차 정비사가 운영하는 유튜브 채널입니다.
                      소비자에게 올바른 정비 정보를 전달하고,
                      신뢰할 수 있는 전국의 정비소를 소개합니다.
                    </p>

                    <div className="flex flex-wrap gap-4">
                      <div className="bg-white/10 rounded-xl px-4 py-3">
                        <p className="text-[#bf00ff] text-xl font-black">52K+</p>
                        <p className="text-gray-500 text-xs">구독자</p>
                      </div>
                      <div className="bg-white/10 rounded-xl px-4 py-3">
                        <p className="text-[#bf00ff] text-xl font-black">20년</p>
                        <p className="text-gray-500 text-xs">정비 경력</p>
                      </div>
                      <div className="bg-white/10 rounded-xl px-4 py-3">
                        <p className="text-[#bf00ff] text-xl font-black">전국</p>
                        <p className="text-gray-500 text-xs">정비소 네트워크</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <a
                      href="https://www.youtube.com/@dreaming_mechanic"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br from-[#bf00ff]/30 to-purple-900/30 rounded-3xl flex items-center justify-center border border-[#bf00ff]/20 hover:border-[#bf00ff]/50 transition-colors group"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="text-white text-sm font-bold">채널 바로가기</p>
                        <p className="text-gray-500 text-xs mt-1">YouTube</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 체크리스트 섹션 */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-[#111] mb-4 break-keep">
                  이런 분들에게 <span className="text-[#bf00ff]">추천</span>합니다
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  '실력은 있지만 홍보가 어려운 정비소 사장님',
                  '온라인에서 정비소를 더 많이 알리고 싶은 분',
                  '신규 고객 유입이 필요한 분',
                  '소비자의 신뢰를 높이고 싶은 분',
                  '전국 정비사 네트워크에 참여하고 싶은 분',
                ].map((item, index) => (
                  <AnimatedSection key={index} animation="slideUp" delay={index * 0.1} duration={0.4}>
                    <div className="flex items-center gap-4 bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:border-[#bf00ff]/30 transition-colors">
                      <CheckCircle2 size={24} className="text-[#bf00ff] flex-shrink-0" />
                      <p className="text-gray-800 font-medium break-keep">{item}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-gradient-to-br from-[#bf00ff] to-purple-800 py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 break-keep">
                지금 바로 시작하세요
              </h2>
              <p className="text-white/80 text-lg mb-10 break-keep">
                등록은 무료이며, 5분이면 완료됩니다.
                <br />
                소비자가 찾아오는 정비소를 만들어 보세요.
              </p>
              <Link
                href="/owner/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#bf00ff] hover:bg-gray-100 px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl"
              >
                무료 등록 시작하기
                <ChevronRight size={20} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
}
