'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authYt } from '../lib/api';

interface YtAuthGateProps {
  onAuth: (token: string) => void;
}

export default function YtAuthGate({ onAuth }: YtAuthGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { token } = await authYt(password);
      localStorage.setItem('yt_auth_token', token);
      onAuth(token);
    } catch {
      setError('비밀번호가 틀렸습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* 아이콘 */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-violet-600/20 rounded-2xl flex items-center justify-center border border-violet-500/30">
            <Lock className="w-7 h-7 text-violet-400" />
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">
          유튜브 서포터
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
          접근 권한이 필요합니다
        </p>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="비밀번호 입력"
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs px-1"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? '확인 중...' : '입장하기'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
