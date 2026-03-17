'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useErpAuthStore } from '@/lib/erp-auth';
import { erpApi } from '@/lib/erp-api';

export default function ErpLoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useErpAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미 인증된 경우 대시보드로 이동
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/erp');
    }
  }, [isAuthenticated, router]);

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await erpApi.login(pin.trim());
      const { token, expiresAt } = res.data;
      login(token, expiresAt);
      router.replace('/erp');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        setError('PIN이 올바르지 않습니다.');
      } else {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-[#7C4DFF]">정비소</span> 전산
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            PIN 번호를 입력하세요
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PIN 입력 */}
            <div>
              <label
                htmlFor="pin"
                className="block text-sm text-gray-400 mb-2"
              >
                PIN 번호 (4~6자리)
              </label>
              <input
                ref={inputRef}
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                onKeyDown={handleKeyDown}
                placeholder="••••"
                maxLength={6}
                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white text-2xl text-center tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-[#7C4DFF] transition-colors"
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <p className="text-red-400 text-sm text-center leading-relaxed">
                {error}
              </p>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-[#7C4DFF] hover:bg-[#6B3FE0] disabled:bg-[#7C4DFF]/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
