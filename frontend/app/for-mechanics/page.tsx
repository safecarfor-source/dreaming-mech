'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Eye,
  Users,
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
  Play,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';

export default function ForMechanicsPage() {
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 히어로 섹션 높이(약 70vh) 이후 스티키 CTA 표시
      setShowStickyCta(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── 유튜브 스튜디오 실제 데이터 (전체 기간, 2026.02 기준) ──
  const stats = {
    totalViews: '4,041만',
    watchTimeHours: '82.1만',
    subscribers: '5.3만',
    monthlyViewers: '34만',
  };

  // 유튜브 스튜디오 실제 인구통계
  const demographic = {
    gender: { male: 92.7, female: 7.3 },
    ages: [
      { label: '13-17', value: 1.0, color: 'bg-gray-300' },
      { label: '18-24', value: 8.4, color: 'bg-lime-300' },
      { label: '25-34', value: 18.7, color: 'bg-lime-400' },
      { label: '35-44', value: 21.9, color: 'bg-[#a6f546]' },
      { label: '45-54', value: 25.7, color: 'bg-[#65a30d]' },
      { label: '55-64', value: 16.4, color: 'bg-emerald-600' },
      { label: '65+', value: 7.9, color: 'bg-emerald-700' },
    ],
    coreTarget: 82.7, // 25~64세
    viewers: { new: 50.2, returning: 45.8, regular: 4.0 },
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
              입점 신청하기
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

      {/* ══════════════════════════════════════════════
          섹션 2: 시장 변화 — 흑백요리사 비유
      ══════════════════════════════════════════════ */}
      <section className="bg-[#0a0a0a] py-12 md:py-24">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-4xl mx-auto">
              <p className="text-[#a6f546] text-xs font-semibold tracking-[0.2em] mb-3 md:mb-5 text-center">
                MARKET SHIFT
              </p>
              <h2
                className="font-black text-white text-center break-keep leading-tight mb-4 md:mb-6"
                style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
              >
                흑백요리사가 증명했습니다.
              </h2>
              <p className="text-gray-400 text-sm md:text-lg text-center mb-8 md:mb-14 break-keep max-w-xl mx-auto">
                프랜차이즈가 지배하던 요식업계에서,
                <br />
                <span className="text-white font-bold">이름을 건 개인</span>이 시장을 뒤집었습니다.
              </p>

              {/* 비교: 과거 vs 지금 */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-5 mb-10 md:mb-14">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 bg-gray-500 rounded-full" />
                    <span className="text-gray-500 text-xs font-semibold tracking-wider">과거</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-gray-400 mb-3">간판이 곧 신뢰</h3>
                  <ul className="space-y-2 text-gray-500 text-sm">
                    <li className="flex items-start gap-2">
                      <X size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span>큰 프랜차이즈 = 믿을 만하다</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span>개인 정비소 = 괜찮을까?</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span>실력보다 간판을 봤다</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#a6f546]/10 to-[#a6f546]/5 border border-[#a6f546]/30 rounded-xl p-5 md:p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 bg-[#a6f546] rounded-full" />
                    <span className="text-[#a6f546] text-xs font-semibold tracking-wider">지금</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white mb-3">사람이 곧 브랜드</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-[#a6f546] mt-0.5 flex-shrink-0" />
                      <span>영상으로 실력을 직접 확인</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-[#a6f546] mt-0.5 flex-shrink-0" />
                      <span>리뷰에서 신뢰를 검증</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-[#a6f546] mt-0.5 flex-shrink-0" />
                      <span>알려진 정비사에게 고객이 몰린다</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <p className="text-base md:text-xl text-gray-400 mb-1 break-keep">
                  요식업에 흑백요리사가 있다면,
                </p>
                <p
                  className="font-black text-white break-keep"
                  style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.25rem)' }}
                >
                  정비 업계에는 <span className="text-[#a6f546]">꿈꾸는 정비사</span>가 있습니다.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 다크 → 라이트 전환 */}
      <div className="h-16 md:h-24 bg-gradient-to-b from-[#0a0a0a] to-white" />

      {/* ══════════════════════════════════════════════
          섹션 3: 유튜브 채널 실적 — 숫자로 증명
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

              {/* 통계 카드: 모바일 2x2 그리드 */}
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

                  {/* 계산식 — 모바일 세로 / 데스크톱 가로 */}
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
          섹션 4: 인구통계 — 데이터가 증명하는 타겟
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-6 md:mb-10">
                <p className="text-[#65a30d] text-xs font-semibold tracking-[0.2em] mb-3">
                  AUDIENCE DATA
                </p>
                <h2
                  className="font-black text-[#111] break-keep leading-tight mb-3"
                  style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
                >
                  누가 정비소를 찾고 있을까요?
                </h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto break-keep">
                  유튜브 스튜디오 실제 인구통계 데이터
                  <span className="text-gray-400"> · 전체 기간 · 2026.02</span>
                </p>
              </div>

              {/* 핵심 인사이트 배너 */}
              <div className="bg-[#111] text-white rounded-xl px-4 py-3 md:px-6 md:py-4 mb-6 md:mb-10">
                <p className="text-xs md:text-sm text-center break-keep">
                  시청자의{' '}
                  <span className="text-[#a6f546] font-black text-base md:text-lg">92.7%</span> 남성 ·{' '}
                  <span className="text-[#a6f546] font-black text-base md:text-lg">82.7%</span> 25~64세
                  <span className="hidden sm:inline"> = 차량을 직접 관리하는 핵심 고객층</span>
                </p>
              </div>

              {/* 성별 + 연령 (모바일: 세로 스택, md: 가로 그리드) */}
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 mb-6 md:mb-8">
                {/* 성별 */}
                <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-[#111] mb-4 flex items-center gap-2">
                    <Users size={16} className="text-[#65a30d]" />
                    성별 분포
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#111]">남성</span>
                        <span className="text-xs font-black text-[#65a30d]">{demographic.gender.male}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-[#65a30d] h-3 rounded-full" style={{ width: `${demographic.gender.male}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#111]">여성</span>
                        <span className="text-xs font-bold text-gray-500">{demographic.gender.female}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gray-400 h-3 rounded-full" style={{ width: `${demographic.gender.female}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 연령 */}
                <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-[#111] mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#65a30d]" />
                    연령 분포
                  </h3>
                  <div className="space-y-2">
                    {demographic.ages.map((g) => (
                      <div key={g.label}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[11px] font-medium text-[#111]">{g.label}세</span>
                          <span className="text-[11px] font-bold text-[#111]">{g.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`${g.color} h-2.5 rounded-full`} style={{ width: `${g.value * 3.5}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">
                    45-54세(25.7%)가 최다 — 차량 유지에 가장 적극적인 세대
                  </p>
                </div>
              </div>

              {/* 데이터 인사이트 요약 */}
              <div className="bg-gradient-to-br from-[#a6f546]/8 to-lime-50 rounded-xl p-5 md:p-6 border border-[#a6f546]/15">
                <h3 className="text-sm font-bold text-[#111] mb-4 flex items-center gap-2">
                  <Target size={16} className="text-[#65a30d]" />
                  데이터가 말해줍니다
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { bold: '92.7% 남성 시청자', desc: '정비 의사결정권자 그 자체' },
                    { bold: '45-54세 최대 비중', desc: '차량 유지비 지출 1위 연령대' },
                    { bold: '25~64세 합산 82.7%', desc: '경제활동 인구 = 차량 소유자' },
                    { bold: '매달 50.2% 신규 유입', desc: '새 잠재 고객이 계속 유입됨' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-[#65a30d] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700">
                        <span className="font-bold text-[#111]">{item.bold}</span>
                        <br />
                        <span className="text-gray-500">{item.desc}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 5: 비교 — 기존 플랫폼 vs 우리
          모바일: 2열 Before/After 패턴
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8 md:mb-14">
                <p className="text-[#65a30d] text-xs font-semibold tracking-[0.2em] mb-3">
                  WHY US
                </p>
                <h2
                  className="font-black text-[#111] break-keep leading-tight"
                  style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
                >
                  기존 플랫폼은{' '}
                  <span className="line-through text-gray-400">정비소</span>를 팝니다.
                  <br />
                  우리는 <span className="text-[#65a30d]">정비사</span>를 빛냅니다.
                </h2>
              </div>

              {/* 비교: 모바일에서 읽기 좋은 2열 구조 */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8 md:mb-12">
                {/* 헤더 */}
                <div className="grid grid-cols-[1fr,1fr] md:grid-cols-3 border-b border-gray-100">
                  <div className="hidden md:block p-4 bg-gray-50">
                    <p className="text-xs font-bold text-gray-400">비교 항목</p>
                  </div>
                  <div className="p-3 md:p-4 bg-gray-50 text-center">
                    <p className="text-xs font-bold text-gray-400">기존 플랫폼</p>
                    <p className="text-[10px] text-gray-400 hidden md:block">마이클 · 카닥 · 닥터차</p>
                  </div>
                  <div className="p-3 md:p-4 bg-[#a6f546]/10 text-center">
                    <p className="text-xs font-black text-[#65a30d]">꿈꾸는 정비사</p>
                  </div>
                </div>

                {/* 비교 행 */}
                {[
                  { label: '주인공', others: '정비소 (점포)', ours: '정비사 (사람)' },
                  { label: '고객이 보는 것', others: '가격 · 위치', ours: '영상 · 실력 · 인격' },
                  { label: '신뢰 구축', others: '별점 · 리뷰 수', ours: '유튜브 영상으로 확인' },
                  { label: '사장님 역할', others: '견적 응답자', ours: '브랜드 · 크리에이터' },
                  { label: '고객 유입', others: '플랫폼 내 검색', ours: 'YouTube → 사이트 → 방문' },
                  { label: '수수료', others: '중개수수료 발생', ours: '입점 후 직접 연결' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr,1fr] md:grid-cols-3 ${i < 5 ? 'border-b border-gray-50' : ''}`}
                  >
                    {/* 모바일에서는 행 제목을 셀 위에 표시 */}
                    <div className="col-span-2 md:col-span-1 px-3 pt-2 pb-0 md:p-4 flex items-center md:border-none">
                      <p className="text-[10px] md:text-xs font-bold text-gray-400 md:text-[#111]">{row.label}</p>
                    </div>
                    <div className="p-3 md:p-4 flex items-center justify-center text-center border-r border-gray-50 md:border-l">
                      <p className="text-xs text-gray-500">{row.others}</p>
                    </div>
                    <div className="p-3 md:p-4 flex items-center justify-center text-center bg-[#a6f546]/5">
                      <p className="text-xs font-bold text-[#111]">{row.ours}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 차별점 카드: 모바일 1열 */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-5">
                {[
                  {
                    icon: (
                      <div className="w-11 h-11 bg-red-500 rounded-xl flex items-center justify-center">
                        <Play size={18} className="text-white ml-0.5" fill="white" />
                      </div>
                    ),
                    title: '유튜브 영상 연동',
                    desc: '쇼츠·롱폼 영상으로 실력을 직접 증명. 다른 플랫폼에는 없습니다.',
                  },
                  {
                    icon: (
                      <div className="w-11 h-11 bg-[#a6f546] rounded-xl flex items-center justify-center">
                        <Award size={18} className="text-[#111]" />
                      </div>
                    ),
                    title: '나만의 브랜드 페이지',
                    desc: '사진, 전문분야, 영상, 리뷰가 하나의 페이지에. 내 이름으로 된 홈페이지.',
                  },
                  {
                    icon: (
                      <div className="w-11 h-11 bg-[#111] rounded-xl flex items-center justify-center">
                        <Shield size={18} className="text-[#a6f546]" />
                      </div>
                    ),
                    title: '고객과 직접 연결',
                    desc: '중간 단계 없이 고객이 내 페이지를 보고 바로 전화하거나 방문합니다.',
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 md:flex-col md:items-center md:text-center bg-white rounded-xl p-4 md:p-6 border border-gray-100"
                  >
                    {card.icon}
                    <div>
                      <h3 className="font-bold text-[#111] text-sm mb-1">{card.title}</h3>
                      <p className="text-gray-500 text-xs break-keep leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 6: 프로필 미리보기 — 폰 목업
      ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                {/* 왼쪽: 설명 */}
                <div className="text-center lg:text-left">
                  <p className="text-[#65a30d] text-xs font-semibold tracking-[0.2em] mb-3">
                    YOUR BRAND PAGE
                  </p>
                  <h2
                    className="font-black text-[#111] break-keep leading-tight mb-4 md:mb-6"
                    style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
                  >
                    고객이 방문하기 전,
                    <br />
                    <span className="bg-[#a6f546] text-[#111] px-1.5 py-0.5">여기서 먼저</span> 만납니다.
                  </h2>

                  <p className="text-gray-500 text-sm md:text-base mb-6 md:mb-8 break-keep">
                    이제 고객은 간판이 아니라,
                    <br />
                    &quot;이 사람&quot;을 보고 정비소를 선택합니다.
                  </p>

                  <div className="space-y-4 max-w-xs mx-auto lg:mx-0">
                    {[
                      {
                        icon: <Play size={16} className="text-white ml-0.5" fill="white" />,
                        iconBg: 'bg-red-500',
                        title: '유튜브에서 발견',
                        desc: '영상을 통해 정비소의 존재를 알게 됩니다',
                      },
                      {
                        icon: <Eye size={16} className="text-[#111]" />,
                        iconBg: 'bg-[#a6f546]',
                        title: '프로필에서 신뢰 확인',
                        desc: '소개, 영상, 리뷰를 보고 신뢰합니다',
                      },
                      {
                        icon: <Phone size={16} className="text-white" />,
                        iconBg: 'bg-green-500',
                        title: '전화 or 방문',
                        desc: '확신한 고객이 직접 연락합니다',
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-left">
                        <div className={`w-8 h-8 ${step.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#111] mb-0.5">{step.title}</h3>
                          <p className="text-gray-500 text-xs break-keep">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 오른쪽: 폰 프레임 */}
                <div className="flex justify-center">
                  <div className="relative w-[240px] sm:w-[280px] md:w-[300px]">
                    <div className="bg-[#111] rounded-[2rem] p-2.5 shadow-2xl shadow-black/20">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#111] rounded-b-xl z-10" />
                      <div className="bg-white rounded-[1.5rem] overflow-hidden">
                        <div className="bg-white px-3.5 pt-7 pb-2 border-b border-gray-100">
                          <p className="text-[#111] font-bold text-xs sm:text-sm truncate">한국타이어 티스테이션 인천대공원점</p>
                        </div>

                        <div className="relative w-full aspect-[4/3]">
                          <Image
                            src="https://dreaming-mech-images-1770313120.s3.ap-northeast-2.amazonaws.com/mechanics/cb656845-6dbf-44a1-95ca-b7e2f23c39eb.png"
                            alt="정비소 대표 사진"
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>

                        <div className="px-3.5 py-2.5 space-y-2">
                          <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2">
                            YouTube 구독자 5.3만명. 2대를 거쳐 25년간 매년 5천대 이상 정비.
                          </p>

                          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <Image
                              src="https://img.youtube.com/vi/83ndhOghUlk/mqdefault.jpg"
                              alt="유튜브 영상"
                              fill
                              className="object-cover"
                              sizes="260px"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                <Play size={12} className="text-white ml-0.5" fill="white" />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <div className="flex-1 bg-[#a6f546] text-[#111] text-[10px] font-bold py-1.5 rounded-md text-center">
                              전화 문의
                            </div>
                            <div className="bg-gray-100 text-gray-600 text-[10px] font-bold py-1.5 px-2.5 rounded-md text-center">
                              길찾기
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 7: 입점하면 얻는 것
      ══════════════════════════════════════════════ */}
      <section className="bg-[#0a0a0a] py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8 md:mb-14">
                <p className="text-[#a6f546] text-xs font-semibold tracking-[0.2em] mb-3">
                  WHAT YOU GET
                </p>
                <h2
                  className="font-black text-white break-keep"
                  style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
                >
                  입점하면 무엇이 달라지나요?
                </h2>
              </div>

              {/* 모바일: 1열 리스트, md: 2열 그리드 */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-5">
                {[
                  {
                    icon: <Eye size={20} className="text-[#a6f546]" />,
                    title: '노출',
                    desc: '구독자 5.3만 + 월간 시청자 34만의 트래픽으로 내 정비소가 노출됩니다.',
                  },
                  {
                    icon: <Star size={20} className="text-[#a6f546]" />,
                    title: '브랜딩',
                    desc: '사진·영상·리뷰가 연동된 나만의 페이지. 간판 없어도 신뢰가 쌓입니다.',
                  },
                  {
                    icon: <BarChart3 size={20} className="text-[#a6f546]" />,
                    title: '성과 확인',
                    desc: '페이지 조회수, 전화 클릭수를 실시간으로 확인합니다.',
                  },
                  {
                    icon: <Zap size={20} className="text-[#a6f546]" />,
                    title: '직접 연결',
                    desc: '중간 단계 없이, 고객이 내 프로필을 보고 바로 연락합니다.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                    <div className="w-10 h-10 bg-[#a6f546]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-white mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed break-keep">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          섹션 8: 핵심 메시지 + 체크리스트
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatedSection animation="slideUp" duration={0.7}>
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-[#a6f546]/5 to-lime-50 rounded-2xl p-6 md:p-12 border border-[#a6f546]/10">
                <div className="text-center">
                  <h2
                    className="font-black text-[#111] break-keep leading-tight mb-3 md:mb-6"
                    style={{ fontSize: 'clamp(1.375rem, 4vw, 3rem)' }}
                  >
                    단 <span className="text-[#65a30d]">한 고객</span>이라도
                    <br />더 온다면
                  </h2>
                  <p className="text-sm md:text-lg text-gray-600 mb-2 break-keep">
                    여기에 내 정비소를 올린 가치는
                  </p>
                  <p
                    className="font-black text-[#65a30d] mb-6 md:mb-10"
                    style={{ fontSize: 'clamp(1.25rem, 3vw, 2.25rem)' }}
                  >
                    충분합니다.
                  </p>

                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm max-w-md mx-auto">
                    <div className="space-y-3 text-left">
                      {[
                        '5분이면 등록 완료',
                        '사장님이 직접 사진 · 소개 · 위치 관리',
                        '유튜브 영상 연동',
                        '조회수 · 클릭수 실시간 통계',
                        '전문 플랫폼에서 고객과 직접 연결',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-[#65a30d] flex-shrink-0" />
                          <p className="text-gray-700 text-sm font-medium break-keep">{item}</p>
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

      {/* ══════════════════════════════════════════════
          섹션 9: 4단계 프로세스
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
                <span className="text-[#65a30d]">4단계</span>로 시작하세요
              </h2>
            </div>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            {/* 모바일: 세로 리스트, lg: 4열 */}
            <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-5">
              {[
                { step: 1, title: '간편 가입', desc: '카카오로 가입' },
                { step: 2, title: '승인 대기', desc: '사업자등록증 확인' },
                { step: 3, title: '정비소 등록', desc: '사진 · 위치 · 소개글' },
                { step: 4, title: '고객 유입', desc: '노출 → 방문 증가' },
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
          섹션 10: 최종 CTA
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
                입점 신청하기
                <ChevronRight size={18} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 플로팅 문의 버튼 ── */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
        <Link
          href="/inquiry"
          className="w-12 h-12 md:w-14 md:h-14 bg-[#a6f546] hover:bg-[#8fd93a] rounded-full flex items-center justify-center shadow-lg shadow-[#a6f546]/30 transition-all hover:scale-110"
          title="문의하기"
        >
          <MessageCircle size={20} className="text-[#111]" />
        </Link>
      </div>

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
            입점 신청하기
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
