'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useOwnerStore } from '@/lib/auth';
import { ownerAuthApi, uploadApi } from '@/lib/api';
import {
  LayoutDashboard,
  Store,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const menuItems = [
  { href: '/owner', label: '대시보드', icon: LayoutDashboard },
  { href: '/owner/mechanics', label: '내 매장 관리', icon: Store },
];

export default function OwnerLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, owner, logout, login } = useOwnerStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 재신청 상태 (REJECTED에서만 사용)
  const [showReapply, setShowReapply] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/owner/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/owner/login');
    }
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

  const handleReapply = async () => {
    if (!licenseFile || !businessName.trim()) {
      setUploadError('업체명과 사업자등록증 사진을 모두 입력해주세요.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // 1. 이미지 업로드
      const uploadRes = await uploadApi.uploadImage(licenseFile);
      const imageUrl = uploadRes.data.url;

      // 2. 재신청 API 호출
      await ownerAuthApi.reapply({
        businessLicenseUrl: imageUrl,
        businessName: businessName.trim(),
      });

      // 3. 프로필 새로고침
      const profileRes = await ownerAuthApi.getProfile();
      login(profileRes.data);

      setShowReapply(false);
      alert('재신청이 완료되었습니다. 관리자 확인 후 승인됩니다.');
    } catch {
      setUploadError('재신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 거절 상태
  if (owner?.status === 'REJECTED') {
    // 재신청 폼
    if (showReapply) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <RefreshCw className="mx-auto text-purple-500 mb-3" size={48} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">재신청하기</h2>
              <p className="text-gray-500 text-sm">
                업체명과 사업자등록증을 다시 제출해주세요.
              </p>
            </div>

            {/* 업체명 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">업체명</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="예: 한국타이어 시흥총판"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
              />
            </div>

            {/* 사업자등록증 업로드 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록증 사진</label>
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
                    className="w-full rounded-xl border border-gray-200 max-h-80 object-contain bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      setLicenseFile(null);
                      setLicensePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <ImageIcon size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">클릭하여 사업자등록증 사진을 업로드하세요</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP (최대 10MB)</p>
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-red-500 text-sm mb-4 text-center">{uploadError}</p>
            )}

            <button
              onClick={handleReapply}
              disabled={uploading || !licenseFile || !businessName.trim()}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? '제출 중...' : '재신청하기'}
            </button>

            <button
              onClick={() => {
                setShowReapply(false);
                setLicenseFile(null);
                setLicensePreview(null);
                setBusinessName('');
                setUploadError('');
              }}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              뒤로가기
            </button>
          </div>
        </div>
      );
    }

    // 거절 상태 메인 화면
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">&#10060;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">가입이 거절되었습니다</h2>

          {/* 거절 사유 표시 */}
          {owner?.rejectionReason ? (
            <div className="mt-4 mb-6 p-4 bg-red-50 rounded-xl border border-red-100 text-left">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-600 font-medium">거절 사유</p>
              </div>
              <p className="text-sm text-red-700">{owner.rejectionReason}</p>
            </div>
          ) : (
            <p className="text-gray-500 mb-6">
              관리자에게 문의해주세요.
            </p>
          )}

          {/* 재신청 버튼 */}
          <button
            onClick={() => {
              setShowReapply(true);
              setBusinessName(owner?.businessName || '');
            }}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            사업자등록증 다시 제출하기
          </button>

          <button
            onClick={handleLogout}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#111111] z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-white">
              <span className="text-purple-600">꿈꾸는</span>정비사
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            {owner?.profileImage && (
              <img
                src={owner.profileImage}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="text-sm text-gray-400 truncate">
              {owner?.name || owner?.email || '사장님'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <div className="text-sm text-gray-500">
            {owner?.name || '사장님'}
            <span className="ml-2 text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">
              {owner?.provider === 'naver' ? '네이버' : '카카오'}
            </span>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
