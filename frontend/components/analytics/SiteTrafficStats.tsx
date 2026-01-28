'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { analyticsApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Users, Eye, Activity } from 'lucide-react';

interface SiteStats {
  totalPageViews: number;
  uniqueVisitors: number;
  avgViewsPerDay: number;
  dailyStats: Array<{ date: string; views: number }>;
  topPages: Array<{ path: string; views: number }>;
}

interface Props {
  token: string;
}

// 커스텀 툴팁 컴포넌트
interface TooltipPayload {
  value: number;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        <p className="text-sm text-purple-600 font-bold">
          {payload[0].value.toLocaleString()} 조회
        </p>
      </div>
    );
  }
  return null;
};

export default function SiteTrafficStats({ token }: Props) {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [period, setPeriod] = useState<number | undefined>(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) {
      setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getSiteStats(period, token);
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch site stats:', error);
      setError(
        error.response?.data?.message ||
        '통계 데이터를 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, [period, token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96" role="status" aria-live="polite">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0"></div>
        </div>
        <p className="text-gray-500 mt-4 font-medium">트래픽 데이터 로딩 중...</p>
        <span className="sr-only">트래픽 통계 데이터를 불러오는 중입니다</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12" role="alert" aria-live="assertive">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 max-w-md w-full border border-red-200 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Activity className="text-red-600" size={32} />
          </div>
          <p className="text-red-900 font-bold text-lg text-center mb-2">오류 발생</p>
          <p className="text-gray-700 text-sm text-center mb-6">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg shadow-purple-500/30"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Activity className="text-gray-400" size={32} />
        </div>
        <p className="text-gray-500">통계 데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* 기간 선택 - 모던한 버튼 그룹 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">기간 선택</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">데이터 조회 기간을 선택하세요</p>
        </div>
        <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 flex gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPeriod(7)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
              period === 7
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            7일
          </button>
          <button
            type="button"
            onClick={() => setPeriod(30)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
              period === 30
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            30일
          </button>
          <button
            type="button"
            onClick={() => setPeriod(undefined)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
              period === undefined
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      {/* 통계 카드 - 개선된 메트릭 카드 */}
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
        className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
      >
        {/* 총 페이지뷰 */}
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
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold bg-green-50 px-2.5 py-1 rounded-full">
                <TrendingUp size={14} />
                <span>Live</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                총 페이지뷰
              </p>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {stats.totalPageViews.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">전체 방문 페이지 수</p>
            </div>
          </div>
        </motion.div>

        {/* 고유 방문자 */}
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
                <Users size={24} className="text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Unique
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                고유 방문자
              </p>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {stats.uniqueVisitors.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">순 방문자 수</p>
            </div>
          </div>
        </div>

        {/* 평균 조회/일 */}
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
                <Activity size={24} className="text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                Daily Avg
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                평균 조회/일
              </p>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {stats.avgViewsPerDay.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">일평균 페이지뷰</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 일별 통계 차트 - 개선된 차트 디자인 */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="text-purple-600" size={24} />
                일별 페이지뷰 추이
              </h3>
              <p className="text-sm text-gray-500 mt-1">시간대별 트래픽 분석</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">총 데이터 포인트</p>
              <p className="text-xl font-bold text-purple-600">{stats.dailyStats.length}개</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={stats.dailyStats}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                style={{ fontSize: '12px', fill: '#6B7280' }}
                tickLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '12px', fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#8B5CF6"
                strokeWidth={3}
                fill="url(#colorViews)"
                name="조회수"
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
