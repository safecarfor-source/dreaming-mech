'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Eye,
  Users,
  TrendingUp,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';

export default function ForMechanicsPage() {
  // 유튜브 채널 통계 (추후 API 연동 가능)
  const youtubeSubscribers = '53,000';
  const monthlyViews = '120만';

  return (
    <Layout>
      {/* ── 섹션 1: 역발상 히어로 (이상한마케팅 스타일) ── */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-8 break-keep">
              세상에서{' '}
              <span className="bg-[#bf00ff] px-2 py-1 inline-block">나를 알아주지 않으면</span>
              <br />
              아무도 오지 않습니다.
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-4 break-keep">
              실력이 아무리 좋아도, 고객이 모르면 소용없습니다.
            </p>
            <p className="text-xl md:text-2xl text-white font-bold mb-12 break-keep">
              세상에 나를 알려야 합니다.{' '}
              <span className="text-[#bf00ff] underline decoration-2 underline-offset-4">
                3분이면 확인 가능합니다.
              </span>
            </p>

            <Link
              href="/owner/login"
              className="inline-flex items-center justify-center gap-2 bg-[#bf00ff] hover:bg-[#a000dd] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#bf00ff]/30 hover:shadow-[#bf00ff]/50"
            >
              무료로 시작하기
              <ArrowRight size={20} />
            </Link>
          </motion.div>

          {/* 스크롤 인디케이터 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex justify-start"
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

      {/* ── 섹션 2: 유튜브 채널 신뢰 증거 (숫자로 증명) ── */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[#bf00ff] text-sm font-semibold tracking-widest mb-4">
                  YOUTUBE CHANNEL
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-6 break-keep">
                  구독자{' '}
                  <span className="text-[#bf00ff]">{youtubeSubscribers}명</span>의 채널
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto break-keep">
                  20년차 자동차 정비사가 운영하는 &quot;꿈꾸는 정비사&quot; 유튜브 채널.
                  <br />
                  매달 <span className="font-bold text-[#111]">{monthlyViews} 조회수</span>의
                  트래픽이 발생합니다.
                </p>
              </div>

              {/* 유튜브 통계 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <Users size={28} className="text-[#bf00ff] mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-[#111]">5.3만</p>
                  <p className="text-gray-500 text-sm mt-1">구독자</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <Eye size={28} className="text-[#bf00ff] mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-[#111]">{monthlyViews}</p>
                  <p className="text-gray-500 text-sm mt-1">월간 조회수</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <TrendingUp size={28} className="text-[#bf00ff] mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-[#111]">20년</p>
                  <p className="text-gray-500 text-sm mt-1">정비 경력</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <CheckCircle2 size={28} className="text-[#bf00ff] mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-[#111]">전국</p>
                  <p className="text-gray-500 text-sm mt-1">정비소 네트워크</p>
                </div>
              </div>

              {/* 핵심 메시지: 1%만 온다면? */}
              <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a0a2e] rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#bf00ff]/20 rounded-full blur-3xl" />
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl md:text-4xl font-black text-white mb-6 break-keep">
                    매달 <span className="text-[#bf00ff]">{monthlyViews}</span> 조회수 중
                    <br />
                    단 <span className="text-[#bf00ff] text-5xl md:text-7xl">1%</span>만
                    온다면?
                  </h3>
                  <p className="text-gray-400 text-lg md:text-xl mb-2 break-keep">
                    그것만으로도 매달 <span className="text-white font-bold">수천 명</span>이
                    사장님의 정비소를 볼 수 있습니다.
                  </p>
                  <p className="text-gray-500 text-base break-keep">
                    유튜브 시청자가 → 웹사이트 방문 → 사장님의 정비소를 발견합니다.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 3: 차별화 포지셔닝 ── */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-8 break-keep">
                방문 전, <span className="bg-[#bf00ff] text-white px-3 py-1">유튜브</span>에서
                <br />
                그리고{' '}
                <span className="bg-[#bf00ff] text-white px-3 py-1">플랫폼</span>에서
                <br />
                고객님과 만나세요.
              </h2>

              <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 break-keep">
                고객은 더 이상 간판만 보고 정비소를 선택하지 않습니다.
                <br />
                유튜브에서 먼저 신뢰를 쌓고, 플랫폼에서 정보를 확인한 후 방문합니다.
              </p>

              {/* 플로우 설명 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 mb-12">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 relative">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#111] mb-2">유튜브에서 발견</h3>
                  <p className="text-gray-500 text-sm break-keep">
                    꿈꾸는 정비사 영상을 통해
                    <br />
                    고객이 정비소를 알게 됩니다
                  </p>
                  <div className="hidden md:block absolute top-1/2 -right-5 transform -translate-y-1/2 text-[#bf00ff]">
                    <ArrowRight size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-200 relative">
                  <div className="w-12 h-12 bg-[#bf00ff] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Eye size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111] mb-2">플랫폼에서 확인</h3>
                  <p className="text-gray-500 text-sm break-keep">
                    위치, 사진, 소개를 보고
                    <br />
                    신뢰를 확인합니다
                  </p>
                  <div className="hidden md:block absolute top-1/2 -right-5 transform -translate-y-1/2 text-[#bf00ff]">
                    <ArrowRight size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-200">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Phone size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111] mb-2">전화 or 방문</h3>
                  <p className="text-gray-500 text-sm break-keep">
                    확인한 고객이 직접
                    <br />
                    전화하거나 방문합니다
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 4: 핵심 가치 (단 한 고객이라도) ── */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-[#bf00ff]/5 to-purple-50 rounded-3xl p-8 md:p-16 border border-[#bf00ff]/10">
                <div className="text-center">
                  <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-8 break-keep leading-tight">
                    단 <span className="text-[#bf00ff]">한 고객님</span>이라도
                    <br />더 온다면
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-600 mb-4 break-keep">
                    여기 웹사이트에 참여한 가치는
                  </p>
                  <p className="text-2xl md:text-4xl font-black text-[#bf00ff] mb-12">
                    충분해집니다.
                  </p>

                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg max-w-2xl mx-auto">
                    <div className="space-y-4 text-left">
                      {[
                        '등록비 무료, 유지비 무료',
                        '5분이면 등록 완료',
                        '사장님이 직접 사진, 소개글, 위치 관리',
                        '유튜브 영상과 연동 가능',
                        '조회수, 클릭수 실시간 통계 제공',
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle2 size={20} className="text-[#bf00ff] flex-shrink-0" />
                          <p className="text-gray-700 font-medium break-keep">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 가입 프로세스 ── */}
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
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: 1, title: '간편 가입', desc: '네이버 또는 카카오로 가입' },
                { step: 2, title: '승인 대기', desc: '사업자등록증 확인 후 승인' },
                { step: 3, title: '정비소 등록', desc: '사진, 위치, 소개글 직접 등록' },
                { step: 4, title: '고객 유입', desc: '사이트 노출 → 고객 방문 증가' },
              ].map((item, index) => (
                <AnimatedSection key={item.step} animation="slideUp" delay={index * 0.15} duration={0.5}>
                  <div className="text-center relative">
                    {index < 3 && (
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

      {/* ── 최종 CTA ── */}
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

      {/* ── 플로팅 CTA 버튼 ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a
          href="https://www.youtube.com/@dreaming_mechanic"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          title="유튜브 채널"
        >
          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </a>
        <Link
          href="/owner/login"
          className="w-14 h-14 bg-[#bf00ff] hover:bg-[#a000dd] rounded-full flex items-center justify-center shadow-lg shadow-[#bf00ff]/30 transition-all hover:scale-110"
          title="무료 등록"
        >
          <MessageCircle size={24} className="text-white" />
        </Link>
      </div>
    </Layout>
  );
}
