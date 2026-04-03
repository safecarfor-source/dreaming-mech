'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Tag } from 'lucide-react';
import { getSkills, YtSkill } from '../../lib/api';

const CATEGORIES = ['전체', '정비 기술', '진단', '부품', '고객 응대', '기타'];

export default function CleanupTab() {
  const [skills, setSkills] = useState<YtSkill[]>([]);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSkills(
          activeCategory === '전체' ? undefined : activeCategory
        );
        setSkills(data);
      } catch {
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeCategory]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setExpandedId(null);
    setLoading(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5">
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 스킬 목록 */}
      {loading ? (
        <div className="py-16 text-center text-gray-600 text-sm">
          불러오는 중...
        </div>
      ) : skills.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            아직 스킬 노트가 없습니다
          </p>
          <p className="text-gray-600 text-xs mt-1">
            [학습] 탭에서 콘텐츠를 분석하면 자동으로 저장됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <motion.div
              key={skill.id}
              layout
              className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden"
            >
              {/* 노트 헤더 */}
              <button
                onClick={() => toggleExpand(skill.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-750 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-md border border-gray-600">
                      <Tag className="w-2.5 h-2.5" />
                      {skill.category}
                    </span>
                  </div>
                  <h4 className="text-white font-medium text-sm leading-snug">
                    {skill.title}
                  </h4>
                  {expandedId !== skill.id && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {skill.preview}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-gray-500 mt-0.5">
                  {expandedId === skill.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* 노트 상세 */}
              <AnimatePresence>
                {expandedId === skill.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-gray-700/50">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mt-3">
                        {skill.content}
                      </p>
                      {skill.source && (
                        <div className="flex items-center gap-1.5 mt-3 text-gray-600 text-xs">
                          <ExternalLink className="w-3 h-3" />
                          <span>출처: {skill.source}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
