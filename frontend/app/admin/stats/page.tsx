'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Eye, MapPin, Globe, Users, Activity } from 'lucide-react';
import { mechanicsApi, analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import type { Mechanic, PeriodType, TopMechanic } from '@/types';
import SiteTrafficStats from '@/components/analytics/SiteTrafficStats';

type TabType = 'mechanics' | 'traffic';

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('mechanics');
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  // 기간별 TOP 5 상태
  const [topMechanicsPeriod, setTopMechanicsPeriod] = useState<PeriodType>('realtime');
  const [topMechanicsData, setTopMechanicsData] = useState<TopMechanic[]>([]);
  const [topMechanicsLoading, setTopMechanicsLoading] = useState(false);
  const [topMechanicsError, setTopMechanicsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await mechanicsApi.getAll();
        setMechanics(data);
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
    if (!token) return;

    setTopMechanicsLoading(true);
    setTopMechanicsError(null);

    try {
      const response = await analyticsApi.getTopMechanics(topMechanicsPeriod, {
        limit: 5,
        days: 7,
        months: 6,
        token,
      });
      setTopMechanicsData(response.data);
    } catch (error) {
      console.error('인기 정비사 조회 실패:', error);
      setTopMechanicsError('인기 정비사 데이터를 불러올 수 없습니다.');
    } finally {
      setTopMechanicsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mechanics' && token) {
      fetchTopMechanics();
    }
  }, [topMechanicsPeriod, activeTab, token]);

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
                        totalClicks.toLocaleString()
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
                        avgClicks.toLocaleString()
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
                        totalMechanics.toLocaleString()
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
                          {Object.keys(locationStats).length}
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
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">클릭 수 기준 상위 정비사</p>
                    </div>

                    {/* 기간 선택 세그먼트 컨트롤 */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setTopMechanicsPeriod('realtime')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                          topMechanicsPeriod === 'realtime'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        실시간
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopMechanicsPeriod('daily')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                          topMechanicsPeriod === 'daily'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        일별
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
                      className="space-y-3 sm:space-y-4"
                    >
                      {topMechanicsData.map((mechanic, index) => (
                        <motion.div
                          key={mechanic.id}
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
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
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{mechanic.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{mechanic.address}</p>
                            </div>
                          </div>
                          <div className="text-right ml-3 sm:ml-4 flex-shrink-0">
                            <p className="text-lg sm:text-2xl font-bold text-purple-600 tabular-nums">
                              {mechanic.clickCount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">클릭</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SiteTrafficStats token={token || ''} />
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
