'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ownerAuthApi } from '@/lib/api';
import { CheckCircle, ChevronRight, Phone, MapPin, User, Wrench } from 'lucide-react';

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // 이미 프로필 정보가 있으면 스킵
  useEffect(() => {
    ownerAuthApi.getProfile().then((res) => {
      const profile = res.data;
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.address) setAddress(profile.address);
    }).catch(() => {});
  }, []);

  // 전화번호 자동 포맷
  const formatPhone = (value: string) => {
    const nums = value.replace(/[^\d]/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  const handleSubmit = async () => {
    if (!name.trim()) { alert('성함을 입력해주세요.'); return; }
    if (!phone.trim()) { alert('전화번호를 입력해주세요.'); return; }
    const phoneNums = phone.replace(/[^\d]/g, '');
    if (phoneNums.length !== 11) { alert('올바른 전화번호를 입력해주세요. (예: 010-1234-5678)'); return; }
    if (!address.trim()) { alert('매장 주소를 입력해주세요.'); return; }

    setSaving(true);
    try {
      await ownerAuthApi.updateProfile({ name, phone, address });
      setDone(true);
      // 2초 후 대시보드로
      setTimeout(() => router.replace('/owner'), 2000);
    } catch {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">등록 완료!</h2>
          <p className="text-gray-500">대시보드로 이동 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7C4DFF] rounded-lg flex items-center justify-center">
            <Wrench size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">꿈꾸는정비사</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">정보 등록</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            고객 문의를 받으려면 아래 정보를 입력해주세요.<br />
            <span className="text-[#7C4DFF] font-medium">입력 후 관리자 승인</span>을 거쳐 서비스 이용이 가능합니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {/* 성함 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <User size={15} className="text-purple-500" />
              성함 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 text-gray-900 transition-colors"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Phone size={15} className="text-purple-500" />
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="예: 010-1234-5678"
              maxLength={13}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 text-gray-900 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">고객 연결 및 알림 수신에 사용됩니다</p>
          </div>

          {/* 매장 주소 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <MapPin size={15} className="text-purple-500" />
              매장 주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 경기도 수원시 영통구 ○○로 123"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 text-gray-900 transition-colors"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-[#7C4DFF] text-white py-4 rounded-xl font-bold text-base hover:bg-[#6B3FE0] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              '저장 중...'
            ) : (
              <>
                등록 완료
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* 안내문 */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-bold">📋 가입 절차 안내</span><br />
            정보 등록 후 관리자 검토를 거쳐 승인됩니다. 승인 후 고객 문의를 확인하고 연락할 수 있습니다.<br />
            <span className="text-amber-600 font-medium">• 승인 소요: 보통 24시간 이내</span>
          </p>
        </div>

        {/* 나중에 하기 */}
        <button
          onClick={() => router.replace('/owner')}
          className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          나중에 입력하기
        </button>
      </div>
    </div>
  );
}
