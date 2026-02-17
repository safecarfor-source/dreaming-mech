'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  Trash2,
  RefreshCw,
  Flag,
  MessageSquare,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  Send,
} from 'lucide-react';
import { syncApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { SyncMessage, SyncStats } from '@/types';

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: '대기',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    icon: <Clock size={14} />,
  },
  IN_PROGRESS: {
    label: '진행 중',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    icon: <Play size={14} />,
  },
  COMPLETED: {
    label: '완료',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    icon: <CheckCircle size={14} />,
  },
  CANCELLED: {
    label: '취소',
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
    icon: <XCircle size={14} />,
  },
};

const priorityBadge: Record<number, { label: string; color: string }> = {
  0: { label: '보통', color: 'text-gray-500' },
  1: { label: '높음', color: 'text-yellow-400' },
  2: { label: '긴급', color: 'text-red-400' },
};

export default function SyncDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { limit: 50 };
      if (filter) params.status = filter;

      const [msgRes, statsRes] = await Promise.all([
        syncApi.getAll(params),
        syncApi.getStats(),
      ]);
      setMessages(msgRes.data.data);
      setStats(statsRes.data);
      setLastRefresh(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [isAuthenticated, router, loadData]);

  // 자동 새로고침 (5초마다)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await syncApi.update(id, { status });
      loadData();
    } catch {
      alert('상태 변경 실패');
    }
  };

  const handleReply = async (id: number) => {
    if (!replyText.trim()) return;
    try {
      await syncApi.update(id, { reply: replyText.trim() });
      setReplyingId(null);
      setReplyText('');
      loadData();
    } catch {
      alert('답변 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await syncApi.delete(id);
      loadData();
    } catch {
      alert('삭제 실패');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="p-2 -ml-2 hover:bg-white/5 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <Monitor size={20} className="text-purple-400" />
            <h1 className="font-bold text-lg">동기화 대시보드</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/sync/phone')}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Smartphone size={16} />
              <span>폰 모드</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  autoRefresh
                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                    : 'border-white/10 text-gray-500'
                }`}
              >
                <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? '실시간' : '수동'}
              </button>
              {!autoRefresh && (
                <button
                  onClick={loadData}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '대기', value: stats.pending, color: 'yellow' },
              { label: '진행 중', value: stats.inProgress, color: 'blue' },
              { label: '완료', value: stats.completed, color: 'green' },
              { label: '전체', value: stats.total, color: 'purple' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`bg-[#111111] rounded-xl border border-white/5 p-4 text-center`}
              >
                <p className="text-2xl font-bold" style={{ color: `var(--color-${color})` }}>
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 필터 */}
        <div className="flex items-center gap-2 mb-4">
          {['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                filter === s
                  ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                  : 'border-white/10 text-gray-500 hover:text-white'
              }`}
            >
              {s === '' ? '전체' : statusConfig[s]?.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-600">
            마지막 갱신: {lastRefresh.toLocaleTimeString('ko-KR')}
          </span>
        </div>

        {/* 메시지 목록 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Monitor size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">지시가 없습니다</p>
            <p className="text-sm mt-2">폰에서 지시를 보내면 여기에 실시간으로 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg, i) => {
                const sc = statusConfig[msg.status];
                const pb = priorityBadge[msg.priority];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`bg-[#111111] rounded-xl border transition-colors ${
                      msg.priority === 2
                        ? 'border-red-500/30'
                        : msg.priority === 1
                        ? 'border-yellow-500/20'
                        : 'border-white/5'
                    } p-5`}
                  >
                    {/* 상단 메타 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                        {msg.priority > 0 && (
                          <span className={`flex items-center gap-1 text-xs ${pb.color}`}>
                            <Flag size={12} /> {pb.label}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          {msg.deviceFrom === 'phone' ? (
                            <Smartphone size={12} />
                          ) : (
                            <Monitor size={12} />
                          )}
                          {msg.deviceFrom}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {new Date(msg.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>

                    {/* 본문 */}
                    <p className="text-white whitespace-pre-wrap mb-3">{msg.content}</p>

                    {/* 이미지 */}
                    {msg.images && Array.isArray(msg.images) && msg.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {msg.images.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-colors"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* 답변 */}
                    {msg.reply && (
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 mb-3">
                        <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
                          <MessageSquare size={12} /> 답변
                        </div>
                        <p className="text-sm text-purple-200">{msg.reply}</p>
                      </div>
                    )}

                    {/* 답변 입력 */}
                    {replyingId === msg.id && (
                      <div className="flex gap-2 mb-3">
                        <input
                          autoFocus
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(msg.id)}
                          placeholder="답변 입력..."
                          className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={() => handleReply(msg.id)}
                          className="px-3 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700"
                        >
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                          className="px-3 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      {msg.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'IN_PROGRESS')}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <Play size={12} /> 시작
                        </button>
                      )}
                      {(msg.status === 'PENDING' || msg.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'COMPLETED')}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle size={12} /> 완료
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReplyingId(replyingId === msg.id ? null : msg.id);
                          setReplyText(msg.reply || '');
                        }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                      >
                        <MessageSquare size={12} /> 답변
                      </button>
                      {msg.status !== 'CANCELLED' && msg.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(msg.id, 'CANCELLED')}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-white/5 transition-colors"
                        >
                          <XCircle size={12} /> 취소
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                      >
                        <Trash2 size={12} /> 삭제
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
