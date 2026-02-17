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
  Star,
  BarChart3,
  Shield,
  Zap,
  Target,
  Award,
  X,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';

export default function ForMechanicsPage() {
  // ── 유튜브 스튜디오 실제 데이터 (전체 기간, 2026.02 기준) ──
  const totalViews = '4,041만';
  const totalViewsNumber = '40,417,910';
  const watchTimeHours = '82.1만';
  const subscribers = '5.3만';
  const monthlyViewers = '34만';

  // 유튜브 스튜디오 실제 인구통계 데이터
  const demographicData = {
    gender: { male: 92.7, female: 7.3 },
    ageGroups: [
      { label: '13-17', percent: 1.0, color: 'bg-gray-300' },
      { label: '18-24', percent: 8.4, color: 'bg-lime-300' },
      { label: '25-34', percent: 18.7, color: 'bg-lime-400' },
      { label: '35-44', percent: 21.9, color: 'bg-[#a6f546]' },
      { label: '45-54', percent: 25.7, color: 'bg-[#65a30d]' },
      { label: '55-64', percent: 16.4, color: 'bg-emerald-600' },
      { label: '65+', percent: 7.9, color: 'bg-emerald-700' },
    ],
    // 핵심 타겟: 25~64세 = 차량 소유 및 정비 의사결정권을 가진 경제활동 인구
    coreTargetPercent: 82.7, // 18.7 + 21.9 + 25.7 + 16.4
    viewerBehavior: {
      newViewers: 50.2,
      returning: 45.8,
      regular: 4.0,
    },
  };

  return (
    <Layout>
      {/* ── 섹션 1: 히어로 ── */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <p className="text-[#a6f546] text-sm md:text-base font-semibold tracking-widest mb-6">
              BRANDING ERA FOR MECHANICS
            </p>
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
              이제는{' '}
              <span className="text-[#a6f546]">브랜딩</span>하는 정비사가 살아남습니다.
            </p>

            <Link
              href="/owner/login"
              className="inline-flex items-center justify-center gap-2 bg-[#a6f546] hover:bg-[#8fd93a] text-[#111] px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#a6f546]/30 hover:shadow-[#a6f546]/50"
            >
              시작하기
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

      {/* ── 섹션 2: 시장이 변하고 있다 (흑백요리사 비유) ── */}
      <section className="bg-[#0a0a0a] py-20 md:py-28">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-4xl mx-auto">
              <p className="text-[#a6f546] text-sm font-semibold tracking-widest mb-6 text-center">
                MARKET SHIFT
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 text-center break-keep leading-tight">
                흑백요리사가 증명했습니다.
              </h2>
              <p className="text-gray-400 text-lg md:text-xl text-center mb-16 break-keep max-w-2xl mx-auto">
                프랜차이즈가 지배하던 요식업계에서,
                <br />
                <span className="text-white font-bold">개인 브랜드를 가진 요리사</span>가 시장을 뒤집었습니다.
              </p>

              {/* 비교 카드 */}
              <div className="grid md:grid-cols-2 gap-6 mb-16">
                {/* 과거 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-gray-500 rounded-full" />
                    <p className="text-gray-400 text-sm font-semibold tracking-wider">과거</p>
                  </div>
                  <h3 className="text-2xl font-black text-gray-400 mb-4">간판이 곧 실력</h3>
                  <ul className="space-y-3 text-gray-500">
                    <li className="flex items-start gap-2">
                      <X size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                      <span>큰 프랜차이즈 = 신뢰</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                      <span>개인 정비소 = 불안</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                      <span>실력은 몰라도, 간판은 알았다</span>
                    </li>
                  </ul>
                </div>

                {/* 현재 */}
                <div className="bg-gradient-to-br from-[#a6f546]/10 to-[#a6f546]/5 border border-[#a6f546]/30 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-[#a6f546] rounded-full" />
                    <p className="text-[#a6f546] text-sm font-semibold tracking-wider">지금</p>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">사람이 곧 브랜드</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-[#a6f546] mt-1 flex-shrink-0" />
                      <span>유튜브에서 실력을 직접 확인</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-[#a6f546] mt-1 flex-shrink-0" />
                      <span>리뷰에서 신뢰를 검증</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-[#a6f546] mt-1 flex-shrink-0" />
                      <span>브랜딩된 정비사에게 고객이 몰린다</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 핵심 메시지 */}
              <div className="text-center">
                <p className="text-xl md:text-2xl text-gray-400 mb-2 break-keep">
                  요식업계에 흑백요리사가 있다면,
                </p>
                <p className="text-2xl md:text-4xl font-black text-white break-keep">
                  정비 업계에는{' '}
                  <span className="text-[#a6f546]">꿈꾸는 정비사</span>가 있습니다.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 다크 → 흰색 전환 */}
      <div className="h-32 bg-gradient-to-b from-[#0a0a0a] to-white" />

      {/* ── 섹션 3: 유튜브 채널 숫자 증명 (총 조회수 강조) ── */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[#65a30d] text-sm font-semibold tracking-widest mb-4">
                  YOUTUBE CHANNEL
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-6 break-keep leading-tight">
                  누적 조회수{' '}
                  <span className="text-[#65a30d]">{totalViews}</span>,
                  <br />이 채널이 당신의 정비소를 알립니다
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto break-keep">
                  &quot;꿈꾸는 정비사&quot; 유튜브 채널.
                  <br />
                  매달 <span className="font-bold text-[#111]">{monthlyViewers}명</span>의
                  시청자가 자동차 정비 콘텐츠를 시청합니다.
                </p>
              </div>

              {/* 유튜브 통계 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                <div className="bg-gray-50 rounded-2xl p-5 md:p-6 text-center border border-gray-100">
                  <Eye size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111] whitespace-nowrap">{totalViews}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">누적 조회수</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 md:p-6 text-center border border-gray-100">
                  <Users size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111] whitespace-nowrap">{subscribers}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">구독자</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 md:p-6 text-center border border-gray-100">
                  <TrendingUp size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111] whitespace-nowrap">{monthlyViewers}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 whitespace-nowrap">월간 시청자</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 md:p-6 text-center border border-gray-100">
                  <Clock size={28} className="text-[#65a30d] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111] whitespace-nowrap">{watchTimeHours}</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 whitespace-nowrap">총 시청 시간</p>
                </div>
              </div>

              {/* 핵심 메시지: 34만 → 1% → 3,400명 */}
              <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0a1a05] rounded-3xl px-6 py-8 md:px-10 md:py-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#a6f546]/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-center text-gray-400 text-sm font-semibold tracking-widest mb-6 md:mb-8">
                    매달 34만 시청자 중, 단 1%만 온다면?
                  </p>

                  {/* 모바일: 세로 스택 */}
                  <div className="flex flex-col items-center gap-2 md:hidden">
                    <div className="text-center">
                      <p className="text-7xl font-black text-white">34만</p>
                      <p className="text-gray-500 text-xs mt-1">월간 시청자</p>
                    </div>
                    <p className="text-[#a6f546] text-[3.5rem] font-black">×</p>
                    <p className="text-[3.5rem] font-black text-[#a6f546]">1%</p>
                    <p className="text-white text-[3.5rem] font-black rotate-90">=</p>
                    <div className="text-center">
                      <p className="text-7xl font-black text-white">3,400명</p>
                      <p className="text-gray-500 text-xs mt-1">매달 잠재 고객</p>
                    </div>
                  </div>

                  {/* 데스크톱: 가로 레이아웃 */}
                  <div className="hidden md:flex items-center justify-center gap-[2vw]">
                    <div className="text-center">
                      <p className="font-black text-white" style={{ fontSize: 'clamp(4rem, 7vw, 8rem)' }}>34만</p>
                      <p className="text-gray-500 text-sm mt-2">월간 시청자</p>
                    </div>
                    <p className="font-black text-[#a6f546]" style={{ fontSize: 'clamp(2rem, 5.6vw, 6.4rem)' }}>×</p>
                    <p className="font-black text-[#a6f546]" style={{ fontSize: 'clamp(3.2rem, 5.6vw, 6.4rem)' }}>1%</p>
                    <p className="font-black text-white rotate-90" style={{ fontSize: 'clamp(2rem, 5.6vw, 6.4rem)' }}>=</p>
                    <div className="text-center">
                      <p className="font-black text-white" style={{ fontSize: 'clamp(4rem, 7vw, 8rem)' }}>3,400명</p>
                      <p className="text-gray-500 text-sm mt-2">매달 잠재 고객</p>
                    </div>
                  </div>

                  {/* 추가 설명 */}
                  <p className="text-center text-gray-500 text-sm mt-8">
                    그 중 <span className="text-[#a6f546] font-bold">82.7%</span>가 25~64세 경제활동 인구.{' '}
                    <span className="text-white font-bold">차량을 소유하고 정비비를 직접 지출하는 핵심 소비층</span>입니다.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 4: 유튜브 인구통계 데이터 ── */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-6">
                <p className="text-[#65a30d] text-sm font-semibold tracking-widest mb-4">
                  YOUTUBE STUDIO DATA
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-4 break-keep">
                  누가 정비소를 찾고 있을까요?
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto break-keep">
                  유튜브 스튜디오 실제 인구통계 데이터입니다.
                  <br />
                  <span className="text-xs text-gray-400">전체 기간 기준 · 2026년 2월 확인</span>
                </p>
              </div>

              {/* 핵심 인사이트 배너 */}
              <div className="bg-[#111] text-white rounded-2xl px-6 py-4 mb-12 text-center">
                <p className="text-sm md:text-base">
                  시청자의{' '}
                  <span className="text-[#a6f546] font-black text-lg md:text-xl">92.7%</span>가{' '}
                  <span className="font-bold">남성</span>,{' '}
                  <span className="text-[#a6f546] font-black text-lg md:text-xl">82.7%</span>가{' '}
                  <span className="font-bold">25~64세</span> ={' '}
                  <span className="text-[#a6f546] font-bold">차량을 직접 관리하는 핵심 고객층</span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* 성별 분포 */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-[#111] mb-6 flex items-center gap-2">
                    <Users size={20} className="text-[#65a30d]" />
                    성별 분포
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-[#111]">남성</span>
                        <span className="text-sm font-black text-[#65a30d]">{demographicData.gender.male}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-[#65a30d] h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${demographicData.gender.male}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-[#111]">여성</span>
                        <span className="text-sm font-bold text-gray-500">{demographicData.gender.female}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gray-400 h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${demographicData.gender.female}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    * 자동차 정비 서비스의 주 의사결정자 비율과 일치
                  </p>
                </div>

                {/* 연령 분포 */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-[#111] mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-[#65a30d]" />
                    연령 분포
                  </h3>
                  <div className="space-y-3">
                    {demographicData.ageGroups.map((group) => (
                      <div key={group.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-[#111]">{group.label}세</span>
                          <span className="text-sm font-bold text-[#111]">{group.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${group.color} h-3 rounded-full transition-all duration-1000`}
                            style={{ width: `${group.percent * 3.5}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    * 45-54세(25.7%)가 최대 시청 연령대 — 차량 유지보수에 가장 적극적인 세대
                  </p>
                </div>
              </div>

              {/* 시청자 행동 + 핵심 인사이트 */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* 시청자 행동 */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-[#111] mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#65a30d]" />
                    시청자 행동 패턴
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#65a30d] rounded-full" />
                        <span className="text-sm text-[#111]">신규 시청자</span>
                      </div>
                      <span className="text-sm font-black text-[#65a30d]">{demographicData.viewerBehavior.newViewers}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#a6f546] rounded-full" />
                        <span className="text-sm text-[#111]">재방문 시청자</span>
                      </div>
                      <span className="text-sm font-bold text-[#111]">{demographicData.viewerBehavior.returning}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-lime-200 rounded-full" />
                        <span className="text-sm text-[#111]">고정 시청자</span>
                      </div>
                      <span className="text-sm font-bold text-[#111]">{demographicData.viewerBehavior.regular}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    * 재방문+고정 시청자 49.8% → 자동차에 지속적 관심을 가진 충성 시청자
                  </p>
                </div>

                {/* 데이터가 말해주는 것 */}
                <div className="bg-gradient-to-br from-[#a6f546]/10 to-lime-50 rounded-2xl p-6 md:p-8 border border-[#a6f546]/20">
                  <h3 className="text-lg font-bold text-[#111] mb-6 flex items-center gap-2">
                    <Target size={20} className="text-[#65a30d]" />
                    데이터가 말해줍니다
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#65a30d] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 break-keep">
                        <span className="font-bold text-[#111]">92.7%가 남성</span> — 자동차 정비의 주 의사결정자
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#65a30d] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 break-keep">
                        <span className="font-bold text-[#111]">45-54세가 최대 비중(25.7%)</span> — 차량 유지비 지출 1위 연령대
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#65a30d] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 break-keep">
                        <span className="font-bold text-[#111]">25~64세 합산 82.7%</span> — 경제활동 인구이자 차량 소유자
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#65a30d] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 break-keep">
                        <span className="font-bold text-[#111]">매달 50.2%가 신규 유입</span> — 새로운 잠재 고객이 계속 들어옴
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 5: 경쟁 플랫폼과의 차이 ── */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[#65a30d] text-sm font-semibold tracking-widest mb-4">
                  WHY US, NOT THEM
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-[#111] mb-6 break-keep leading-tight">
                  다른 플랫폼은{' '}
                  <span className="line-through text-gray-400">정비소</span>를 팝니다.
                  <br />
                  우리는{' '}
                  <span className="text-[#65a30d]">정비사</span>를 빛냅니다.
                </h2>
              </div>

              {/* 비교 테이블 */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm mb-12">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-3 border-b border-gray-100">
                  <div className="p-4 md:p-6 bg-gray-50">
                    <p className="text-sm font-bold text-gray-400">비교 항목</p>
                  </div>
                  <div className="p-4 md:p-6 bg-gray-50 text-center">
                    <p className="text-sm font-bold text-gray-400">기존 플랫폼</p>
                    <p className="text-xs text-gray-400">마이클 · 카닥 · 닥터차</p>
                  </div>
                  <div className="p-4 md:p-6 bg-[#a6f546]/10 text-center">
                    <p className="text-sm font-black text-[#65a30d]">꿈꾸는 정비사</p>
                  </div>
                </div>

                {/* 비교 행 */}
                {[
                  {
                    label: '주인공',
                    others: '정비소 (점포)',
                    ours: '정비사 (사람)',
                  },
                  {
                    label: '고객이 보는 것',
                    others: '가격 · 위치 · 후기',
                    ours: '영상 · 실력 · 인격',
                  },
                  {
                    label: '신뢰 구축 방식',
                    others: '별점 · 리뷰 수',
                    ours: '유튜브 영상으로 직접 확인',
                  },
                  {
                    label: '사장님 역할',
                    others: '견적 응답자',
                    ours: '크리에이터 · 브랜드',
                  },
                  {
                    label: '고객 유입',
                    others: '플랫폼 내 검색',
                    ours: '유튜브 → 웹사이트 → 방문',
                  },
                  {
                    label: '수수료',
                    others: '중개 수수료 발생',
                    ours: '무료',
                  },
                ].map((row, index) => (
                  <div key={index} className={`grid grid-cols-3 ${index < 5 ? 'border-b border-gray-50' : ''}`}>
                    <div className="p-4 md:p-5 flex items-center">
                      <p className="text-sm font-bold text-[#111]">{row.label}</p>
                    </div>
                    <div className="p-4 md:p-5 flex items-center justify-center text-center border-l border-gray-50">
                      <p className="text-sm text-gray-500">{row.others}</p>
                    </div>
                    <div className="p-4 md:p-5 flex items-center justify-center text-center bg-[#a6f546]/5 border-l border-[#a6f546]/10">
                      <p className="text-sm font-bold text-[#111]">{row.ours}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 핵심 차별점 카드 */}
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#111] mb-2">유튜브 영상 연동</h3>
                  <p className="text-gray-500 text-sm break-keep">
                    쇼츠와 롱폼 영상으로 실력을 직접 증명합니다. 다른 플랫폼에는 없는 기능.
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-[#a6f546] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award size={24} className="text-[#111]" />
                  </div>
                  <h3 className="font-bold text-[#111] mb-2">개인 브랜딩 페이지</h3>
                  <p className="text-gray-500 text-sm break-keep">
                    정비사 개인의 프로필, 전문분야, 영상, 리뷰가 한 페이지에. 나만의 홈페이지.
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield size={24} className="text-[#a6f546]" />
                  </div>
                  <h3 className="font-bold text-[#111] mb-2">수수료 0원</h3>
                  <p className="text-gray-500 text-sm break-keep">
                    중개 수수료 없이 고객과 직접 연결됩니다. 마이클 · 카닥은 수수료가 발생합니다.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 6: 브랜딩의 시대 - 정비사 프로필 + 폰 목업 ── */}
      <section className="bg-white py-16 md:py-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* 왼쪽: 문구 */}
                <div className="text-center lg:text-left">
                  <p className="text-[#65a30d] text-sm font-semibold tracking-widest mb-4">
                    YOUR BRAND PAGE
                  </p>
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
                        <h3 className="text-base md:text-lg font-bold text-[#111] mb-0.5">프로필에서 신뢰 확인</h3>
                        <p className="text-gray-500 text-xs md:text-sm break-keep">
                          사진, 소개, 위치, 영상, 리뷰를 보고 &quot;이 정비사&quot;를 신뢰합니다
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

                {/* 오른쪽: 폰 프레임 */}
                <div className="flex justify-center">
                  <div className="relative w-[260px] sm:w-[300px] md:w-[320px]">
                    <div className="bg-[#111] rounded-[2rem] sm:rounded-[2.5rem] p-2.5 sm:p-3 shadow-2xl shadow-black/30">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-6 sm:h-7 bg-[#111] rounded-b-2xl z-10" />
                      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
                        <div className="bg-white px-4 pt-7 pb-2.5 border-b border-gray-100">
                          <p className="text-[#111] font-bold text-sm sm:text-base truncate">한국타이어 티스테이션 인천대공원점</p>
                        </div>

                        <div className="relative w-full aspect-[4/3]">
                          <Image
                            src="https://dreaming-mech-images-1770313120.s3.ap-northeast-2.amazonaws.com/mechanics/cb656845-6dbf-44a1-95ca-b7e2f23c39eb.png"
                            alt="한국타이어 티스테이션 인천대공원점"
                            fill
                            className="object-cover"
                            sizes="320px"
                          />
                        </div>

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
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

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

                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#a6f546]/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#a6f546]/10 rounded-full blur-2xl" />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 7: 정비사가 얻는 것 ── */}
      <section className="bg-[#0a0a0a] py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection animation="slideUp" duration={0.8}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[#a6f546] text-sm font-semibold tracking-widest mb-4">
                  WHAT YOU GET
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 break-keep">
                  등록하면 무엇이 달라지나요?
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    icon: <Eye size={24} className="text-[#a6f546]" />,
                    title: '노출',
                    desc: '유튜브 구독자 5.3만 + 월간 시청자 34만명의 트래픽을 통해 내 정비소가 자연스럽게 노출됩니다.',
                  },
                  {
                    icon: <Star size={24} className="text-[#a6f546]" />,
                    title: '브랜딩',
                    desc: '사진, 소개글, 유튜브 영상이 연동된 나만의 프로필 페이지. 간판 없이도 신뢰를 만듭니다.',
                  },
                  {
                    icon: <BarChart3 size={24} className="text-[#a6f546]" />,
                    title: '데이터',
                    desc: '내 페이지 조회수, 클릭수, 전화 문의수를 실시간으로 확인. 마케팅 효과를 직접 봅니다.',
                  },
                  {
                    icon: <Zap size={24} className="text-[#a6f546]" />,
                    title: '비용 0원',
                    desc: '가입비, 월 이용료, 중개 수수료 전부 무료. 마이클·카닥처럼 수수료를 내지 않습니다.',
                  },
                ].map((item, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                    <div className="w-12 h-12 bg-[#a6f546]/10 rounded-xl flex items-center justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed break-keep">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 섹션 8: 핵심 가치 (단 한 고객이라도) ── */}
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
                        '중개 수수료 0원, 완전 무료',
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
                { step: 1, title: '간편 가입', desc: '카카오로 간편 가입' },
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
                브랜딩의 시작,
                <br />
                지금 바로 하세요
              </h2>
              <p className="text-[#111]/70 text-lg mb-10 break-keep">
                프랜차이즈가 아닌, <span className="font-bold">당신의 이름</span>으로 승부하세요.
                <br />
                5분이면 나만의 브랜드 페이지가 만들어집니다.
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
