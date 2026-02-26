'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Eye, MapPin, Globe, Users, Activity, Link2, UserPlus } from 'lucide-react';
import { mechanicsApi, analyticsApi } from '@/lib/api';
import { MONTHS } from '@/lib/constants';
import type { Mechanic, TopMechanic } from '@/types';
import SiteTrafficStats from '@/components/analytics/SiteTrafficStats';
import CountUp from '@/components/animations/CountUp';
import AnimatedSection from '@/components/animations/AnimatedSection';

interface ReferralStat {
  refCode: string;
  views: number;
  visitors: number;
  signups: number;
}

type TabType = 'mechanics' | 'traffic' | 'referral';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('mechanics');
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  // 기간별 TOP 5 상태
  const [topMechanicsPeriod, setTopMechanicsPeriod] = useState<number | 'monthly'>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear] = useState<number>(new Date().getFullYear());
  const [topMechanicsData, setTopMechanicsData] = useState<TopMechanic[]>([]);
  const [topMechanicsLoading, setTopMechanicsLoading] = useState(false);
  const [topMechanicsError, setTopMechanicsError] = useState<string | null>(null);

  // 레퍼럴 통계 상태
  const [referralData, setReferralData] = useState<ReferralStat[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralDays, setReferralDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await mechanicsApi.getAll();
        setMechanics(response.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 기간별 TOP 5 데이터 페칭
  const fetchTopMechanics = async () => {
    setTopMechanicsLoading(true);
    setTopMechanicsError(null);

    try {
      let response;
      if (topMechanicsPeriod === 'monthly') {
        // monthly인 경우 월별 API 사용
        response = await analyticsApi.getTopMechanicsByMonth(selectedYear, selectedMonth, 5);
      } else {
        // 숫자인 경우 일별 API 사용
        response = await analyticsApi.getTopMechanics('daily', {
          limit: 5,
          days: topMechanicsPeriod as number, // Type-safe: 이미 'monthly'가 아님을 확인
        });
      }
      setTopMechanicsData(response.data);
    } catch (error) {
      console.error('인기 정비사 조회 실패:', error);
      setTopMechanicsError('인기 정비사 데이터를 불러올 수 없습니다.');
    } finally {
      setTopMechanicsLoading(false);
    }
  };

  // 레퍼럴 통계 데이터 페칭
  const fetchReferralStats = async () => {
    setReferralLoading(true);
    try {
      const response = await analyticsApi.getReferralStats(referralDays);
      setReferralData(response.data);
    } catch (error) {
      console.error('레퍼럴 통계 조회 실패:', error);
    } finally {
      setReferralLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mechanics') {
      fetchTopMechanics();
    } else if (activeTab === 'referral') {
      fetchReferralStats();
    }
  }, [topMechanicsPeriod, selectedMonth, activeTab, referralDays]);

  // 통계 계산
  const totalClicks = mechanics.reduce((sum, m) => sum + m.clickCount, 0);
  const avgClicks = mechanics.length > 0 ? Math.round(totalClicks / mechanics.length) : 0;
  const topMechanics = [...mechanics].sort((a, b) => b.clickCount - a.clickCount).slice(0, 5);
  const totalMechanics = mechanics.length;

  // 지역별 통계
  const locationStats = mechanics.reduce((acc, m) => {
    acc[m.location] = (acc[m.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 탭 - 모던한 세그먼트 컨트롤 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 inline-flex gap-1 w-full sm:w-auto"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mechanics'}
            aria-controls="mechanics-panel"
            onClick={() => setActiveTab('mechanics')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
              activeTab === 'mechanics'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={18} className="hidden sm:block" aria-hidden="true" />
            <span className="text-sm sm:text-base">정비사 통계</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'traffic'}
            aria-controls="traffic-panel"
            onClick={() => setActiveTab('traffic')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
              activeTab === 'traffic'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Globe size={18} className="hidden sm:block" aria-hidden="true" />
            <span className="text-sm sm:text-base">사이트 트래픽</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'referral'}
            aria-controls="referral-panel"
            onClick={() => setActiveTab('referral')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
              activeTab === 'referral'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Link2 size={18} className="hidden sm:block" aria-hidden="true" />
            <span className="text-sm sm:text-base">링크 추적</span>
          </button>
        </motion.div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'mechanics' ? (
          <>
            {/* 요약 카드 - 전문적인 메트릭 카드 디자인 */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {/* 총 조회수 */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                      <Eye size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                      Total
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                      총 조회수
                    </p>
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">
                      {loading ? (
                        <span className="inline-block w-24 h-10 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        <CountUp end={totalClicks} duration={2000} />
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 평균 조회수 */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      Average
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                      평균 조회수
                    </p>
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">
                      {loading ? (
                        <span className="inline-block w-24 h-10 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        <CountUp end={avgClicks} duration={2000} delay={100} />
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 등록 정비사 */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-200 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/30">
                      <Users size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                      등록 정비사
                    </p>
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">
                      {loading ? (
                        <span className="inline-block w-24 h-10 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        <CountUp end={totalMechanics} duration={1800} delay={200} />
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 등록 지역 */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-cyan-200 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg shadow-cyan-500/30">
                      <MapPin size={24} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full">
                      Locations
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                      등록 지역
                    </p>
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">
                      {loading ? (
                        <span className="inline-block w-24 h-10 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        <>
                          <CountUp end={Object.keys(locationStats).length} duration={1500} delay={300} />
                          <span className="text-2xl text-gray-500 ml-1">개</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="grid grid-cols-1 gap-8"
            >
              {/* 인기 정비사 TOP 5 - 기간 선택 추가 */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                  <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="text-purple-600" size={20} />
                        <span>인기 정비사 TOP 5</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {topMechanicsPeriod === 'monthly'
                          ? `${selectedMonth}월 클릭 수 기준`
                          : `최근 ${topMechanicsPeriod}일 클릭 수 기준`}
                      </p>
                    </div>

                    {/* 기간 선택 세그먼트 컨트롤 */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setTopMechanicsPeriod(1)}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                          topMechanicsPeriod === 1
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        1일
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopMechanicsPeriod(7)}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                          topMechanicsPeriod === 7
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        7일
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopMechanicsPeriod('monthly')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                          topMechanicsPeriod === 'monthly'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        월별
                      </button>
                    </div>
                  </div>

                  {/* 월별 선택 시 월 선택 */}
                  {topMechanicsPeriod === 'monthly' && (
                    <div className="mt-4 px-4 sm:px-6">
                      <div className="flex flex-col gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">월 선택</p>
                          <p className="text-xs text-gray-500 mt-0.5">조회할 월을 선택하세요 ({selectedYear}년)</p>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                          {MONTHS.map((month) => (
                            <button
                              key={month.value}
                              type="button"
                              onClick={() => setSelectedMonth(month.value)}
                              className={`px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                selectedMonth === month.value
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              {month.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 로딩/에러/데이터 표시 */}
                <div className="p-6">
                  {topMechanicsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : topMechanicsError ? (
                    <div className="flex flex-col items-center justify-center h-40">
                      <p className="text-red-600 mb-4">{topMechanicsError}</p>
                      <button
                        type="button"
                        onClick={fetchTopMechanics}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : topMechanicsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40">
                      <div className="w-16 h-16 bg-gray-100 rounded-full mb-3 flex items-center justify-center">
                        <BarChart3 className="text-gray-400" size={32} />
                      </div>
                      <p className="text-gray-500">데이터가 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {topMechanicsData.map((mechanic, index) => (
                        <AnimatedSection
                          key={mechanic.id}
                          animation="slideLeft"
                          delay={index * 0.08}
                          duration={0.4}
                        >
                          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                              <div
                                className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-white text-sm sm:text-base ${
                                  index === 0
                                    ? 'bg-yellow-500'
                                    : index === 1
                                    ? 'bg-gray-400'
                                    : index === 2
                                    ? 'bg-orange-600'
                                    : 'bg-purple-600'
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{mechanic.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-500 break-words">{mechanic.address}</p>
                              </div>
                            </div>
                            <div className="text-right ml-3 sm:ml-4 flex-shrink-0">
                              <p className="text-lg sm:text-2xl font-bold text-purple-600 tabular-nums">
                                <CountUp end={mechanic.clickCount} duration={1500} delay={index * 100} />
                              </p>
                              <p className="text-xs text-gray-500">클릭</p>
                            </div>
                          </div>
                        </AnimatedSection>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        ) : activeTab === 'traffic' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SiteTrafficStats />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* 레퍼럴 링크 안내 */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Link2 size={20} className="text-purple-600" />
                링크 추적 사용법
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                공유 링크에 <code className="bg-white px-2 py-0.5 rounded text-purple-600 font-mono text-xs">?ref=코드명</code>을 붙이면 자동으로 추적됩니다.
              </p>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">예시:</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  https://사이트주소/?ref=카톡단체방
                </p>
                <p className="text-sm font-mono text-gray-800 break-all mt-1">
                  https://사이트주소/for-mechanics?ref=블로그홍보
                </p>
              </div>
            </div>

            {/* 기간 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">기간:</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setReferralDays(d)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      referralDays === d
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>

            {/* 레퍼럴 데이터 테이블 */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Link2 className="text-purple-600" size={20} />
                  레퍼럴 코드별 통계
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  최근 {referralDays}일 기준
                </p>
              </div>
              <div className="p-6">
                {referralLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : referralData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mb-3 flex items-center justify-center">
                      <Link2 className="text-gray-400" size={32} />
                    </div>
                    <p className="text-gray-500">아직 추적 데이터가 없습니다</p>
                    <p className="text-gray-400 text-sm mt-1">링크에 ?ref=코드를 붙여서 공유해보세요</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">레퍼럴 코드</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">페이지뷰</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">방문자(IP)</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">가입</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralData.map((item, index) => (
                          <tr key={item.refCode} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                <span className="font-medium text-gray-900">{item.refCode}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-gray-900 tabular-nums">{item.views.toLocaleString()}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-blue-600 tabular-nums">{item.visitors.toLocaleString()}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.signups > 0 ? (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-sm font-semibold">
                                  <UserPlus size={14} />
                                  {item.signups}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
