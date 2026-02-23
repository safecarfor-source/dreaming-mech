'use client';

import { useEffect, useState } from 'react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerMechanicsApi, ownerAuthApi } from '@/lib/api';
import { Mechanic, Owner } from '@/types';
import Link from 'next/link';
import { Plus, Store, Eye } from 'lucide-react';

export default function OwnerDashboardPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mechanicsRes, profileRes] = await Promise.all([
          ownerMechanicsApi.getAll(),
          ownerAuthApi.getProfile(),
        ]);
        setMechanics(mechanicsRes.data);
        setOwner(profileRes.data);
        setPhone(profileRes.data.phone || '');
      } catch {
        // 에러 무시 (OwnerLayout에서 인증 처리)
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 전화번호 포맷팅 (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    const phoneNumbers = phone.replace(/[^\d]/g, '');
    if (phoneNumbers.length !== 11) {
      alert('올바른 전화번호를 입력해주세요. (11자리)');
      return;
    }

    setIsSaving(true);
    try {
      await ownerAuthApi.updateProfile({ phone });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      alert(error.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">내 매장을 관리하세요</p>
      </div>

      {/* 알림톡 수신 설정 */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📱</span>
          <h2 className="text-lg font-bold text-gray-900">알림톡 수신 설정</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            새 문의 알림
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          전화번호를 등록하면 내 지역에 새 고객 문의가 들어올 때 카카오 알림톡으로 알려드려요.
        </p>

        {/* 전화번호 입력 폼 */}
        <div className="flex gap-3">
          <input
            type="text"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            maxLength={13}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-200 focus:border-[#7C4DFF] outline-none transition-all"
          />
          <button
            onClick={handleSavePhone}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#7C4DFF] text-white hover:bg-[#6B3FE0]'
            }`}
          >
            {isSaving ? '저장 중...' : saveSuccess ? '✓ 저장됨' : '저장'}
          </button>
        </div>
        {saveSuccess && (
          <p className="text-sm text-green-600 mt-2">
            ✓ 전화번호가 성공적으로 저장되었습니다.
          </p>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Store size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">등록된 매장</p>
              <p className="text-2xl font-bold">{mechanics.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 조회수</p>
              <p className="text-2xl font-bold">
                {mechanics.reduce((sum, m) => sum + m.clickCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-center">
          <Link
            href="/owner/mechanics/new"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            새 매장 등록
          </Link>
        </div>
      </div>

      {/* 매장 목록 */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">로딩 중...</div>
      ) : mechanics.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">아직 등록된 매장이 없습니다.</p>
          <Link
            href="/owner/mechanics/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus size={18} />
            첫 매장 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mechanics.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.address}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    조회수: {m.clickCount}
                  </p>
                </div>
                <Link
                  href={`/owner/mechanics/${m.id}/edit`}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  수정
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
