'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DiscoverTab from '../components/tabs/DiscoverTab';

export default function DiscoverPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/yt')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-white font-bold text-xl">주제 찾기</h1>
        </div>

        {/* DiscoverTab 재사용 */}
        <DiscoverTab />
      </div>
    </div>
  );
}
