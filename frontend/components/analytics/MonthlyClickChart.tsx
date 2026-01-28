'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MonthlyData {
  month: string;
  clicks: number;
}

interface Props {
  data: MonthlyData[];
  mechanicName?: string;
}

// 커스텀 툴팁
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          <span className="text-sm text-gray-600">클릭 수:</span>
          <span className="text-base font-bold text-purple-600 tabular-nums">
            {payload[0].value.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// 커스텀 범례
const CustomLegend = ({ mechanicName }: { mechanicName?: string }) => {
  return (
    <div className="flex items-center justify-center gap-6 py-3">
      <div className="flex items-center gap-2">
        <div className="w-4 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
        <span className="text-sm font-medium text-gray-700">
          {mechanicName ? `${mechanicName} - 클릭 추이` : '월별 클릭 수'}
        </span>
      </div>
    </div>
  );
};

export default function MonthlyClickChart({ data, mechanicName }: Props) {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
          <h3 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="sm:text-xl">{mechanicName ? `${mechanicName} - 월별 클릭 추이` : '월별 클릭 차트'}</span>
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 sm:h-80 bg-gray-50">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500 font-medium text-sm sm:text-base">데이터가 없습니다</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">클릭 데이터가 수집되면 여기에 표시됩니다</p>
        </div>
      </motion.div>
    );
  }

  // 최대값, 최소값, 평균 계산
  const clicks = data.map(d => d.clicks);
  const maxClicks = Math.max(...clicks);
  const minClicks = Math.min(...clicks);
  const avgClicks = Math.round(clicks.reduce((a, b) => a + b, 0) / clicks.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={20} />
              <span className="sm:text-xl">{mechanicName ? `${mechanicName}` : '월별 클릭 추이'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">시간대별 클릭 패턴 분석</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500">총 데이터 포인트</p>
            <p className="text-lg sm:text-xl font-bold text-purple-600">{data.length}개월</p>
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50 border-b border-gray-200"
      >
        <div className="px-3 sm:px-6 py-3 sm:py-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">최고</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 tabular-nums">{maxClicks.toLocaleString()}</p>
        </div>
        <div className="px-3 sm:px-6 py-3 sm:py-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">평균</p>
          <p className="text-lg sm:text-2xl font-bold text-purple-600 tabular-nums">{avgClicks.toLocaleString()}</p>
        </div>
        <div className="px-3 sm:px-6 py-3 sm:py-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">최저</p>
          <p className="text-lg sm:text-2xl font-bold text-orange-600 tabular-nums">{minClicks.toLocaleString()}</p>
        </div>
      </motion.div>

      {/* 차트 영역 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="p-4 sm:p-6"
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis
              dataKey="month"
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
              dataKey="clicks"
              stroke="#8B5CF6"
              strokeWidth={3}
              fill="url(#colorClicks)"
              name="클릭 수"
              dot={{
                fill: '#8B5CF6',
                strokeWidth: 2,
                r: 4,
                stroke: '#fff'
              }}
              activeDot={{
                r: 7,
                strokeWidth: 3,
                stroke: '#fff',
                fill: '#8B5CF6'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* 차트 범례 */}
        <CustomLegend mechanicName={mechanicName} />
      </motion.div>

      {/* 푸터 인사이트 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">성장률</span>
          </div>
          <div className="text-right">
            {data.length >= 2 && (
              <div className="flex items-center gap-2">
                <span className="text-purple-100 text-xs sm:text-sm">전월 대비</span>
                {(() => {
                  const lastMonth = data[data.length - 1].clicks;
                  const prevMonth = data[data.length - 2].clicks;
                  const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1) : 0;
                  const isPositive = Number(growth) >= 0;
                  return (
                    <span className={`font-bold text-base sm:text-lg tabular-nums ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                      {isPositive ? '+' : ''}{growth}%
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
