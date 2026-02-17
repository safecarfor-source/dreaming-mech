'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Smartphone,
  Monitor,
  CheckCircle,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  Trash2,
  Flag,
} from 'lucide-react';
import { syncApi, uploadApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { SyncMessage } from '@/types';

const priorityLabels = ['보통', '높음', '긴급'];
const priorityColors = ['text-gray-400', 'text-yellow-400', 'text-red-400'];
const statusLabels: Record<string, string> = {
  PENDING: '대기',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-gray-500/20 text-gray-400',
};

export default function SyncPhonePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState('');
  const [priority, setPriority] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadMessages();
  }, [isAuthenticated, router]);

  const loadMessages = async () => {
    try {
      const res = await syncApi.getAll({ limit: 20 });
      setMessages(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await syncApi.create({
        content: content.trim(),
        deviceFrom: 'phone',
        priority,
        images: images.length > 0 ? images : undefined,
      });
      setContent('');
      setPriority(0);
      setImages([]);
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      loadMessages();
    } catch {
      alert('전송 실패');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setImages((prev) => [...prev, res.data.url]);
    } catch {
      alert('이미지 업로드 실패');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-purple-400" />
            <span className="font-bold">폰 지시</span>
          </div>
          <button
            onClick={() => router.push('/sync/dashboard')}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            <Monitor size={16} />
            <span>PC</span>
          </button>
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] rounded-2xl border border-white/10 p-4"
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="지시 내용을 입력하세요..."
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[120px] text-base"
            rows={4}
          />

          {/* 이미지 미리보기 */}
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0 right-0 bg-red-500 rounded-bl-lg p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 하단 도구 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              {/* 우선순위 */}
              <button
                onClick={() => setPriority((p) => (p + 1) % 3)}
                className={`flex items-center gap-1 text-sm ${priorityColors[priority]}`}
              >
                <Flag size={16} />
                <span>{priorityLabels[priority]}</span>
              </button>

              {/* 이미지 첨부 */}
              <label className="flex items-center gap-1 text-sm text-gray-400 cursor-pointer hover:text-white">
                {uploadingImage ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImageIcon size={16} />
                )}
                <span>사진</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 전송 버튼 */}
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-5 py-2 rounded-xl font-bold text-sm transition-colors"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : sent ? (
                <CheckCircle size={16} />
              ) : (
                <Send size={16} />
              )}
              {sent ? '전송됨!' : '전송'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* 최근 지시 목록 */}
      <div className="px-4 pb-24">
        <h2 className="text-sm font-bold text-gray-500 mb-3">최근 지시</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Smartphone size={40} className="mx-auto mb-3 opacity-50" />
            <p>아직 지시가 없습니다</p>
            <p className="text-sm mt-1">위에서 첫 지시를 보내보세요</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#111111] rounded-xl border border-white/5 p-4 mb-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white flex-1 whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[msg.status]}`}>
                    {statusLabels[msg.status]}
                  </span>
                </div>
                {msg.priority > 0 && (
                  <span className={`text-xs mt-1 inline-block ${priorityColors[msg.priority]}`}>
                    {msg.priority === 2 ? '🔴 긴급' : '🟡 높음'}
                  </span>
                )}
                {msg.reply && (
                  <div className="mt-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-xs text-purple-300">{msg.reply}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <Clock size={12} />
                  <span>{new Date(msg.createdAt).toLocaleString('ko-KR')}</span>
                  {msg.deviceFrom === 'phone' ? (
                    <Smartphone size={12} />
                  ) : (
                    <Monitor size={12} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 전송 성공 토스트 */}
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              전송 완료!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
