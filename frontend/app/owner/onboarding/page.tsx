'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ownerAuthApi, uploadApi } from '@/lib/api';
import { useOwnerStore } from '@/lib/auth';
import {
  CheckCircle,
  ChevronRight,
  Phone,
  MapPin,
  User,
  Wrench,
  Building2,
  Image as ImageIcon,
  X,
  ShieldCheck,
  BadgeCheck,
  Youtube,
  Bell,
} from 'lucide-react';

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const { login } = useOwnerStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미 프로필 정보가 있으면 채우기
  useEffect(() => {
    ownerAuthApi.getProfile().then((res) => {
      const profile = res.data;
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.address) setAddress(profile.address);
      if (profile.businessName) setBusinessName(profile.businessName);
      if (profile.businessLicenseUrl) setLicensePreview(profile.businessLicenseUrl);
    }).catch(() => {});
  }, []);

  // 전화번호 자동 포맷
  const formatPhone = (value: string) => {
    const nums = value.replace(/[^\d]/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setLicenseFile(file);
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => setLicensePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { alert('성함을 입력해주세요.'); return; }
    if (!phone.trim()) { alert('전화번호를 입력해주세요.'); return; }
    const phoneNums = phone.replace(/[^\d]/g, '');
    if (phoneNums.length !== 11) { alert('올바른 전화번호를 입력해주세요. (예: 010-1234-5678)'); return; }
    if (!address.trim()) { alert('매장 주소를 입력해주세요.'); return; }
    if (!businessName.trim()) { alert('상호명을 입력해주세요.'); return; }
    if (!licenseFile && !licensePreview) { alert('사업자등록증 사진을 업로드해주세요.'); return; }

    setSaving(true);
    setUploadError('');

    try {
      // 사업자등록증 업로드 (새 파일이 있을 때만)
      let businessLicenseUrl = licensePreview || '';
      if (licenseFile) {
        const uploadRes = await uploadApi.uploadImage(licenseFile);
        businessLicenseUrl = uploadRes.data.url;
      }

      // 사업자 정보 통합 제출
      await ownerAuthApi.submitBusinessInfo({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        businessName: businessName.trim(),
        businessLicenseUrl,
      });

      // 프로필 새로고침
      const profileRes = await ownerAuthApi.getProfile();
      login(profileRes.data);

      setDone(true);
      setTimeout(() => router.replace('/owner'), 2000);
    } catch {
      setUploadError('제출에 실패했습니다. 다시 시도해주세요.');
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
          <h2 className="text-xl font-bold text-gray-900">제출 완료!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            관리자가 확인 중입니다.<br />
            승인 후 정비소를 등록할 수 있습니다.
          </p>
          <p className="text-gray-400 text-xs">대시보드로 이동 중...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사업자 정보 등록</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            정비소 등록을 위해 아래 정보를 입력해주세요.<br />
            <span className="text-[#7C4DFF] font-medium">관리자 확인 후 승인</span>되면 정비소를 등록할 수 있습니다.
          </p>
        </div>

        {/* 팩트 체크 안내 */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">정확한 팩트 체크를 위한 정보입니다</p>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              실제 정비소를 운영하시는 사장님만 플랫폼에 등록할 수 있습니다.
              제출하신 정보는 확인 용도로만 사용되며, 외부에 공개되지 않습니다.
            </p>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {/* 성함 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <User size={15} className="text-[#7C4DFF]" />
              성함 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C4DFF] text-gray-900 transition-colors"
            />
          </div>

          {/* 상호명 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Building2 size={15} className="text-[#7C4DFF]" />
              상호명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="예: 꿈꾸는정비소"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C4DFF] text-gray-900 transition-colors"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Phone size={15} className="text-[#7C4DFF]" />
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="예: 010-1234-5678"
              maxLength={13}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C4DFF] text-gray-900 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">고객 연결 및 알림 수신에 사용됩니다</p>
          </div>

          {/* 매장 주소 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <MapPin size={15} className="text-[#7C4DFF]" />
              매장 주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예: 경기도 수원시 영통구 ○○로 123"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C4DFF] text-gray-900 transition-colors"
            />
          </div>

          {/* 사업자등록증 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <ImageIcon size={15} className="text-[#7C4DFF]" />
              사업자등록증 <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {licensePreview ? (
              <div className="relative">
                <img
                  src={licensePreview}
                  alt="사업자등록증 미리보기"
                  className="w-full rounded-xl border border-gray-200 max-h-60 object-contain bg-gray-50"
                />
                <button
                  onClick={() => {
                    setLicenseFile(null);
                    setLicensePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#7C4DFF] hover:bg-[#F5F3FF] transition-colors"
              >
                <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">클릭하여 사업자등록증 사진을 업로드하세요</p>
                <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP (최대 10MB)</p>
              </button>
            )}
          </div>

          {uploadError && (
            <p className="text-red-500 text-sm text-center">{uploadError}</p>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-[#7C4DFF] text-white py-4 rounded-xl font-bold text-base hover:bg-[#6B3FE0] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              '제출 중...'
            ) : (
              <>
                사업자 정보 제출하기
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* 나중에 하기 */}
        <button
          onClick={() => router.replace('/owner')}
          className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          나중에 입력하기
        </button>

        {/* 미리보기 섹션 */}
        <div className="mt-12">
          {/* 구분선 + 헤더 */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">승인 후 노출 예시</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              ✨ 승인 후 이렇게 노출됩니다
            </h2>
            <p className="text-sm text-gray-500">실제 등록된 정비소 예시</p>
          </div>

          {/* 정비소 카드 미리보기 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* 상단: 그라데이션 배경 */}
            <div className="relative h-40 bg-gradient-to-br from-[#7C4DFF] to-[#5B2DE0] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Wrench size={32} className="text-white" />
                </div>
                <span className="text-white/80 text-xs font-medium tracking-wide">정비소 대표 이미지</span>
              </div>
              {/* 유튜브 촬영 태그 */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                <Youtube size={11} />
                유튜브 촬영 지원
              </div>
              {/* 검증 배지 */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 text-[#7C4DFF] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                <BadgeCheck size={13} />
                검증된 정비소
              </div>
            </div>

            {/* 하단: 정비소 정보 */}
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  티스테이션 인천대공원점
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  최신장비와 최고의 전문가들과 함께 25년이 넘게 운영되고 있는 인천대공원점입니다.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={13} className="text-[#7C4DFF] flex-shrink-0" />
                  <span>인천광역시 남동구 수인로 3566</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={13} className="text-[#7C4DFF] flex-shrink-0" />
                  <span>032-464-8333</span>
                </div>
              </div>

              {/* 전문분야 태그 */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['타이어', '경정비', '브레이크', '배터리', '휠얼라이먼트'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#F5F3FF] text-[#7C4DFF] px-2 py-0.5 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 혜택 요약 */}
          <div className="mt-6 bg-[#F5F3FF] rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-[#7C4DFF] uppercase tracking-wide">등록하면 받는 혜택</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MapPin size={14} className="text-[#7C4DFF]" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  지도 검색 + 지역별 목록에 사장님의 정비소가 노출됩니다
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Youtube size={14} className="text-red-500" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  유튜브 채널(5.3만 구독)에서 정비 실력을 직접 촬영·소개합니다
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bell size={14} className="text-[#7C4DFF]" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  내 지역에 고객 문의가 들어오면 실시간 알림을 받습니다
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
