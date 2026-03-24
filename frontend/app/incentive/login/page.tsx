'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import incentiveApi from '@/lib/incentive-api';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import type { IncentiveUser } from '@/types/incentive';

const ACCENT = '#3EA6FF';

export default function IncentiveLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isExpired, login } = useIncentiveAuthStore();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 인증된 상태면 team으로 이동
  useEffect(() => {
    if (isAuthenticated && !isExpired()) {
      router.replace('/incentive/gd-vehicle');
    }
  }, [isAuthenticated, isExpired, router]);

  async function handleLogin() {
    setError('');
    if (!loginId.trim() || !password) {
      setError('아이디와 비밀번호를 입력하세요');
      return;
    }
    setLoading(true);
    try {
      const res = await incentiveApi.post<{ token: string; user: IncentiveUser; expiresAt?: string }>(
        '/auth/login',
        { loginId: loginId.trim(), password },
      );
      const { token, user, expiresAt } = res.data;
      login(token, user, expiresAt);
      router.replace('/incentive/gd-vehicle');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      if (err.response) {
        setError(err.response.data?.message || '로그인 실패');
      } else {
        setError('서버 연결 실패');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #FFFFFF; color: #1A1A1A;
          -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
        }
        .inc-login-input {
          width: 100%; padding: 14px 16px; border: 1px solid #E0E0E0; border-radius: 12px;
          font-size: 15px; font-family: inherit; margin-bottom: 12px; outline: none;
          transition: border-color 0.2s, background 0.2s;
          background: #F5F5F5; color: #1A1A1A;
        }
        .inc-login-input:focus { border-color: ${ACCENT}; background: #fff; }
        .inc-login-input::placeholder { color: #999; }
        .inc-login-btn {
          width: 100%; padding: 14px; background: ${ACCENT}; color: #fff; border: none;
          border-radius: 12px; font-size: 16px; font-weight: 700; font-family: inherit;
          cursor: pointer; margin-top: 8px; transition: opacity 0.2s;
        }
        .inc-login-btn:hover { opacity: 0.9; }
        .inc-login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', padding: 24, background: '#FFFFFF',
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '48px 32px',
          width: '100%', maxWidth: 400,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 14px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            인센티브 현황판
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>
            꿈꾸는 정비사
          </p>

          <input
            type="text"
            className="inc-login-input"
            placeholder="아이디"
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type="password"
            className="inc-login-input"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="inc-login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div style={{
            color: '#FF4E45', fontSize: 13, marginTop: 12, minHeight: 20,
          }}>
            {error}
          </div>
        </div>
      </div>
    </>
  );
}
