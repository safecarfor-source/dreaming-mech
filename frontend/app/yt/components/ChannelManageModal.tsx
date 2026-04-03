'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, ChevronDown, Tag, Loader2 } from 'lucide-react';
import {
  getChannels,
  createChannel,
  deleteChannel,
  getCategories,
  createCategory,
  deleteCategory,
} from '../lib/api';

interface Channel {
  id: string;
  channelUrl: string;
  channelName?: string;
  thumbnail?: string;
  subscriberCount?: number;
  category?: string;
  memo?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChannelManageModal({ open, onClose }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // 채널 추가 폼
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingChannel, setAddingChannel] = useState(false);

  // 카테고리 관리 패널
  const [showCatPanel, setShowCatPanel] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open]);

  const loadData = async () => {
    setLoadingChannels(true);
    try {
      const [ch, cats] = await Promise.all([getChannels(), getCategories()]);
      setChannels(Array.isArray(ch) ? ch : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setChannels([]);
      setCategories([]);
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAddingChannel(true);
    try {
      const ch = await createChannel({
        channelUrl: newUrl.trim(),
        category: newCategory || undefined,
      });
      setChannels((prev) => [...prev, ch]);
      setNewUrl('');
      setNewCategory('');
    } catch {
      // 실패 시 무시
    } finally {
      setAddingChannel(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // 실패 시 무시
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const cat = await createCategory(newCatName.trim());
      setCategories((prev) => [...prev, cat]);
      setNewCatName('');
    } catch {
      // 실패 시 무시
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // 실패 시 무시
    }
  };

  const formatNumber = (n?: number) => {
    if (!n) return '';
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
    return String(n);
  };

  // 카테고리별 채널 그룹화
  const grouped: Record<string, Channel[]> = { 미분류: [] };
  categories.forEach((cat) => { grouped[cat.name] = []; });
  channels.forEach((ch) => {
    const key = ch.category && grouped[ch.category] !== undefined ? ch.category : '미분류';
    grouped[key].push(ch);
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 백드롭 */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg max-h-[85vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
                <h2 className="text-white font-bold text-base">채널 관리</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {/* 채널 목록 */}
                {loadingChannels ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  </div>
                ) : channels.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    등록된 채널이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([catName, list]) => {
                      if (list.length === 0) return null;
                      return (
                        <div key={catName}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Tag className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-500 text-xs font-medium">{catName}</span>
                          </div>
                          <div className="space-y-2">
                            {list.map((ch) => (
                              <div
                                key={ch.id}
                                className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-xl"
                              >
                                {/* 채널 아이콘 */}
                                <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                                  {ch.thumbnail ? (
                                    <img src={ch.thumbnail} alt={ch.channelName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500 text-sm font-bold">
                                      {(ch.channelName || ch.channelUrl).charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">
                                    {ch.channelName || ch.channelUrl}
                                  </p>
                                  {ch.subscriberCount && (
                                    <p className="text-gray-500 text-xs">구독자 {formatNumber(ch.subscriberCount)}</p>
                                  )}
                                </div>
                                {ch.category && (
                                  <span className="shrink-0 text-xs px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full">
                                    {ch.category}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteChannel(ch.id)}
                                  className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 카테고리 관리 토글 */}
                <div>
                  <button
                    onClick={() => setShowCatPanel((v) => !v)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    카테고리 관리
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${showCatPanel ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showCatPanel && (
                    <div className="mt-3 p-4 bg-gray-800 border border-gray-700 rounded-xl space-y-3">
                      {/* 카테고리 목록 */}
                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => (
                            <div
                              key={cat.id}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 border border-gray-600 rounded-full"
                            >
                              <span className="text-gray-300 text-xs">{cat.name}</span>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 카테고리 추가 */}
                      <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="새 카테고리 이름"
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={addingCat || !newCatName.trim()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          {addingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '추가'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>

              {/* 채널 추가 폼 (하단 고정) */}
              <div className="shrink-0 px-5 py-4 border-t border-gray-800">
                <form onSubmit={handleAddChannel} className="flex gap-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="채널 URL 입력"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {/* 카테고리 선택 */}
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="appearance-none bg-gray-800 border border-gray-700 rounded-xl pl-3 pr-7 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="">카테고리</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    disabled={addingChannel || !newUrl.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {addingChannel ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        추가
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
