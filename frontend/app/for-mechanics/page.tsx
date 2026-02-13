'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Eye,
  Users,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';

export default function ForMechanicsPage() {
  // 유튜브 채널 통계 (추후 API 연동 가능)
  const youtubeSubscribers = '53,000';
  const monthlyViews = '61만';

  return (
    <Layout>
      {/* ── 섹션 1: 역발상 히어로 ── */}
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
              <span className="bg-[#a6f546] text-[#111] px-2 py-1 inline-block">나를 알아주지 않으면</span>
              <br />
              아무도 오지 않습니다.
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-4 break-keep">
              실력이 아무리 좋아도, 고객이 모르면 소용없습니다.
            </p>
            <p className="text-xl md:text-2xl text-white font-bold mb-12 break-keep">
              세상에 나를 알려야 합니다.
              <br />
              <span className="text-[#a6f546] underline decoration-2 underline-offset-4">
                3분이면 확인 가능합니다.
              </span>
            </p>

            <Link
              href="/owner/login"
              className="inline-flex items-center justify-center gap-2 bg-[#a6f546] hover:bg-[#8fd93a] text-[#111] px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#a6f546]/30 hover:shadow-[#a6f546]/50"
            >
              시작하기
              <ArrowRight size={20} />
            </Link>
          </motion.div>

          {/* 스크롤 인디케이터 - 아래 화살표 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex justify-start"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-1"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a6f546" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <path d="M6 9l6 6 6-6" />
              </svg>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a6f546" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 -mt-3">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.div>
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
                <p className="text-[#65a30d] text-sm font-semibold tracking-widest mb-4">
                  YOUTUBE CHANNEL
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-6 break-keep">
                  구독자{' '}
                  <span className="text-[#65a30d]">{youtubeSubscribers}명</span>의 채널
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto break-keep">
                  &quot;꿈꾸는 정비사&quot; 유튜브 채널.
                  <br />
                  매달 <span className="font-bold text-[#111]">{monthlyViews} 조회수</span>의
                  트래픽이 발생합니다.
                </p>
              </div>

              {/* 유튜브 통계 카드 */}
              <div className="grid grid-cols-3 gap-4 md:gap-6 mb-12">
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <Users size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111] whitespace-nowrap">5.3만</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">구독자</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <Eye size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111] whitespace-nowrap">{monthlyViews}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 whitespace-nowrap">월간 조회수</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                  <CheckCircle2 size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111]">전국</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">정비소<br />네트워크</p>
                </div>
              </div>

              {/* 핵심 메시지: 61만 → 1% → 6,100명 직관적 플로우 */}
              <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0a1a05] rounded-3xl px-6 py-8 md:px-10 md:py-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#a6f546]/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-center text-gray-400 text-sm font-semibold tracking-widest mb-6 md:mb-8">
                    단 1%만 온다면?
                  </p>

                  {/* 모바일: 세로 스택 */}
                  <div className="flex flex-col items-center gap-2 md:hidden">
                    <div className="text-center">
                      <p className="text-7xl font-black text-white">61만</p>
                      <p className="text-gray-500 text-xs mt-1">월간 조회수</p>
                    </div>
                    <p className="text-[#a6f546] text-[3.5rem] font-black">×</p>
                    <p className="text-[3.5rem] font-black text-[#a6f546]">1%</p>
                    <p className="text-white text-[3.5rem] font-black rotate-90">=</p>
                    <div className="text-center">
                      <p className="text-7xl font-black text-white">
                        6,100명
                      </p>
                      <p className="text-gray-500 text-xs mt-1">매달 잠재 고객</p>
                    </div>
                  </div>

                  {/* 데스크톱: 가로 레이아웃 - 뷰포트 기반 반응형 크기 */}
                  <div className="hidden md:flex items-center justify-center gap-[2vw]">
                    <div className="text-center">
                      <p className="font-black text-white" style={{ fontSize: 'clamp(4rem, 7vw, 8rem)' }}>61만</p>
                      <p className="text-gray-500 text-sm mt-2">월간 조회수</p>
                    </div>
                    <p className="font-black text-[#a6f546]" style={{ fontSize: 'clamp(2rem, 5.6vw, 6.4rem)' }}>×</p>
                    <p className="font-black text-[#a6f546]" style={{ fontSize: 'clamp(3.2rem, 5.6vw, 6.4rem)' }}>1%</p>
                    <p className="font-black text-white rotate-90" style={{ fontSize: 'clamp(2rem, 5.6vw, 6.4rem)' }}>=</p>
                    <div className="text-center">
                      <p className="font-black text-white" style={{ fontSize: 'clamp(4rem, 7vw, 8rem)' }}>
                        6,100명
                      </p>
                      <p className="text-gray-500 text-sm mt-2">매달 잠재 고객</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 3: 차별화 포지셔닝 + 폰 목업 ── */}
      <section className="bg-gray-50 py-16 md:py-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-6xl mx-auto">
              {/* 모바일: 세로 (폰 먼저 → 문구), 데스크톱: 가로 (문구 왼쪽 → 폰 오른쪽) */}
              <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* 왼쪽(데스크톱) / 아래(모바일): 문구 */}
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-[#111] mb-4 md:mb-8 break-keep leading-tight">
                    방문 전,{' '}
                    <span className="bg-[#a6f546] text-[#111] px-2 md:px-3 py-0.5 md:py-1">플랫폼</span>에서
                    <br />
                    고객님과 만나세요.
                  </h2>

                  <p className="text-gray-500 text-base md:text-xl mb-6 md:mb-10 break-keep">
                    고객은 더 이상 간판만 보고
                    <br />
                    정비소를 선택하지 않습니다.
                  </p>

                  <div className="space-y-4 md:space-y-6 max-w-sm mx-auto lg:mx-0">
                    <div className="flex items-start gap-3 md:gap-4 text-left">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-[#111] mb-0.5">유튜브에서 발견</h3>
                        <p className="text-gray-500 text-xs md:text-sm break-keep">
                          꿈꾸는 정비사 영상을 통해 고객이 정비소를 알게 됩니다
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:gap-4 text-left">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-[#a6f546] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Eye size={18} className="text-[#111] md:hidden" />
                        <Eye size={20} className="text-[#111] hidden md:block" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-[#111] mb-0.5">플랫폼에서 확인</h3>
                        <p className="text-gray-500 text-xs md:text-sm break-keep">
                          사진, 소개, 위치, 영상을 보고 신뢰를 확인합니다
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:gap-4 text-left">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone size={18} className="text-white md:hidden" />
                        <Phone size={20} className="text-white hidden md:block" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-[#111] mb-0.5">전화 or 방문</h3>
                        <p className="text-gray-500 text-xs md:text-sm break-keep">
                          확인한 고객이 직접 전화하거나 방문합니다
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽(데스크톱) / 위(모바일): 폰 프레임 */}
                <div className="flex justify-center">
                  <div className="relative w-[260px] sm:w-[300px] md:w-[320px]">
                    {/* 폰 프레임 */}
                    <div className="bg-[#111] rounded-[2rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 shadow-2xl shadow-black/30">
                      {/* 노치 */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-6 sm:h-7 bg-[#111] rounded-b-2xl z-10" />
                      {/* 스크린 */}
                      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
                        {/* 상단바 */}
                        <div className="bg-white px-4 pt-7 pb-2.5 border-b border-gray-100">
                          <p className="text-[#111] font-bold text-sm sm:text-base truncate">한국타이어 티스테이션 인천대공원점</p>
                        </div>

                        {/* 대표 이미지 */}
                        <div className="relative w-full aspect-[4/3]">
                          <Image
                            src="https://dreaming-mech-images-1770313120.s3.ap-northeast-2.amazonaws.com/mechanics/cb656845-6dbf-44a1-95ca-b7e2f23c39eb.png"
                            alt="한국타이어 티스테이션 인천대공원점"
                            fill
                            className="object-cover"
                            sizes="320px"
                          />
                        </div>

                        {/* 정보 영역 */}
                        <div className="px-4 py-3 space-y-2.5">
                          <div className="flex items-center gap-2 text-gray-600 text-[11px] sm:text-xs">
                            <MapPin size={13} className="text-[#65a30d] flex-shrink-0" />
                            <span>인천광역시 남동구 수인로 3566</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-[11px] sm:text-xs">
                            <Phone size={13} className="text-[#65a30d] flex-shrink-0" />
                            <span>0507-1393-8333</span>
                          </div>

                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-[#111] text-[11px] sm:text-xs font-medium mb-1">소개</p>
                            <p className="text-gray-500 text-[10px] sm:text-[11px] leading-relaxed line-clamp-2">
                              YouTube 구독자 5.3만명의 꿈꾸는 정비사입니다.
                              2대를 거쳐 25년간 매년 5천대 이상의 차량을 정비합니다.
                            </p>
                          </div>

                          {/* 유튜브 영상 목업 */}
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-[#111] text-[11px] sm:text-xs font-medium mb-1.5">영상</p>
                            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                              <Image
                                src="https://img.youtube.com/vi/83ndhOghUlk/mqdefault.jpg"
                                alt="유튜브 영상 썸네일"
                                fill
                                className="object-cover"
                                sizes="280px"
                              />
                              {/* 재생 버튼 오버레이 */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CTA 버튼 */}
                          <div className="flex gap-2 pt-1.5">
                            <div className="flex-1 bg-[#a6f546] text-[#111] text-[11px] sm:text-xs font-bold py-2 rounded-lg text-center">
                              전화 문의하기
                            </div>
                            <div className="bg-gray-100 text-gray-600 text-[11px] sm:text-xs font-bold py-2 px-3 rounded-lg text-center">
                              길찾기
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 장식 요소 */}
                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#a6f546]/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#a6f546]/10 rounded-full blur-2xl" />
                  </div>
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
              <div className="bg-gradient-to-br from-[#a6f546]/5 to-lime-50 rounded-3xl p-8 md:p-16 border border-[#a6f546]/10">
                <div className="text-center">
                  <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-8 break-keep leading-tight">
                    단 <span className="text-[#65a30d]">한 고객님</span>이라도
                    <br />더 온다면
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-600 mb-4 break-keep">
                    여기 웹사이트에 참여한 가치는
                  </p>
                  <p className="text-2xl md:text-4xl font-black text-[#65a30d] mb-12">
                    충분해집니다.
                  </p>

                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg max-w-2xl mx-auto">
                    <div className="space-y-4 text-left">
                      {[
                        '5분이면 등록 완료',
                        '사장님이 직접 사진, 소개글, 위치 관리',
                        '유튜브 영상과 연동 가능',
                        '조회수, 클릭수 실시간 통계 제공',
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle2 size={20} className="text-[#65a30d] flex-shrink-0" />
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
              <p className="text-[#65a30d] text-sm font-semibold tracking-widest mb-4">
                HOW IT WORKS
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-4 break-keep">
                <span className="text-[#65a30d]">4단계</span>로 시작하세요
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
                      <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#a6f546]/40 to-[#a6f546]/10" />
                    )}
                    <div className="w-16 h-16 bg-[#a6f546] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#a6f546]/20 relative z-10">
                      <span className="text-[#111] text-2xl font-black">{item.step}</span>
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
      <section className="bg-gradient-to-br from-[#a6f546] to-[#65a30d] py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-6 break-keep">
                지금 바로 시작하세요
              </h2>
              <p className="text-[#111]/70 text-lg mb-10 break-keep">
                5분이면 등록 완료됩니다.
                <br />
                소비자가 찾아오는 정비소를 만들어 보세요.
              </p>
              <Link
                href="/owner/login"
                className="inline-flex items-center justify-center gap-2 bg-[#111] text-[#a6f546] hover:bg-[#222] px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl"
              >
                등록 시작하기
                <ChevronRight size={20} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 플로팅 CTA 버튼 ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Link
          href="/inquiry"
          className="w-14 h-14 bg-[#a6f546] hover:bg-[#8fd93a] rounded-full flex items-center justify-center shadow-lg shadow-[#a6f546]/30 transition-all hover:scale-110"
          title="문의하기"
        >
          <MessageCircle size={24} className="text-[#111]" />
        </Link>
      </div>
    </Layout>
  );
}
