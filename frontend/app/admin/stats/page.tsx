'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { BarChart3, TrendingUp, Eye, MapPin } from 'lucide-react';
import { mechanicsApi } from '@/lib/api';
import type { Mechanic } from '@/types';

export default function StatsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 통계 계산
  const totalClicks = mechanics.reduce((sum, m) => sum + m.clickCount, 0);
  const avgClicks = mechanics.length > 0 ? Math.round(totalClicks / mechanics.length) : 0;
  const topMechanics = [...mechanics].sort((a, b) => b.clickCount - a.clickCount).slice(0, 5);

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
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">통계</h1>
          <p className="text-gray-500 mt-1">정비사 현황 및 조회 통계</p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Eye size={24} className="text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 조회수</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '-' : totalClicks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">평균 조회수</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '-' : avgClicks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <MapPin size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">등록 지역</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '-' : Object.keys(locationStats).length}개
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 인기 정비사 TOP 5 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-[#8B5CF6]" />
                인기 정비사 TOP 5
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-6 text-center text-gray-500">로딩 중...</div>
              ) : topMechanics.length === 0 ? (
                <div className="p-6 text-center text-gray-500">데이터가 없습니다.</div>
              ) : (
                topMechanics.map((mechanic, index) => (
                  <div
                    key={mechanic.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? 'bg-yellow-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                            ? 'bg-orange-400'
                            : 'bg-gray-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mechanic.name}</p>
                        <p className="text-sm text-gray-500">{mechanic.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#8B5CF6]">
                        {mechanic.clickCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">조회</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 지역별 분포 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-[#8B5CF6]" />
                지역별 정비사 분포
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">로딩 중...</div>
              ) : locationData.length === 0 ? (
                <div className="text-center text-gray-500">데이터가 없습니다.</div>
              ) : (
                locationData.map(([location, count]) => {
                  const percentage = Math.round((count / mechanics.length) * 100);
                  return (
                    <div key={location}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700">{location}</span>
                        <span className="text-sm text-gray-500">
                          {count}개 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8B5CF6] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
