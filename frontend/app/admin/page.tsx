'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, Eye, TrendingUp, Calendar, MessageCircle } from 'lucide-react';
import { mechanicsApi, serviceInquiryApi } from '@/lib/api';
import type { Mechanic } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [serviceInquiryCount, setServiceInquiryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mechanicsRes, serviceInquiriesRes] = await Promise.all([
          mechanicsApi.getAll(),
          serviceInquiryApi.getAll(1, 1000),
        ]);
        setMechanics(mechanicsRes.data.data || []);
        setServiceInquiryCount(serviceInquiriesRes.data.data?.data?.length || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalClicks = mechanics.reduce((sum, m) => sum + m.clickCount, 0);
  const activeMechanics = mechanics.filter((m) => m.isActive).length;

  const stats = [
    {
      label: '전체 정비사',
      value: mechanics.length,
      icon: Users,
      color: 'bg-purple-600',
      href: '/admin/mechanics',
    },
    {
      label: '활성 정비사',
      value: activeMechanics,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/admin/mechanics',
    },
    {
      label: '서비스 문의',
      value: serviceInquiryCount,
      icon: MessageCircle,
      color: 'bg-purple-500',
      href: '/admin/service-inquiries',
    },
    {
      label: '총 조회수',
      value: totalClicks.toLocaleString(),
      icon: Eye,
      color: 'bg-blue-500',
      href: '/admin/stats',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">꿈꾸는정비사 관리자 페이지</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              onClick={() => stat.href && router.push(stat.href)}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${
                stat.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? '-' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 최근 정비사 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">최근 등록된 정비사</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-gray-500">로딩 중...</div>
            ) : mechanics.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                등록된 정비사가 없습니다.
              </div>
            ) : (
              mechanics.slice(0, 5).map((mechanic) => (
                <div
                  key={mechanic.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden">
                      {mechanic.mainImageUrl ? (
                        <img
                          src={mechanic.mainImageUrl}
                          alt={mechanic.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          없음
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 break-words">{mechanic.name}</p>
                      <p className="text-sm text-gray-500 break-words">{mechanic.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-purple-600">
                      조회수 {mechanic.clickCount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mechanic.isActive ? '활성' : '비활성'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
