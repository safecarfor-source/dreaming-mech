'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye } from 'lucide-react';
import type { Mechanic } from '@/types';

interface Props {
  mechanic: Mechanic;
  index: number;
}

export default function SortableItem({ mechanic, index }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mechanic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 sm:gap-4 bg-white rounded-xl border p-3 sm:p-4 transition-shadow ${
        isDragging
          ? 'shadow-xl border-purple-400 ring-2 ring-purple-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-purple-600 transition-colors touch-none flex-shrink-0"
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical size={20} />
      </button>

      {/* 순번 */}
      <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-bold flex-shrink-0">
        {index + 1}
      </span>

      {/* 썸네일 */}
      <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
        {mechanic.mainImageUrl ? (
          <img
            src={mechanic.mainImageUrl}
            alt={mechanic.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            없음
          </div>
        )}
      </div>

      {/* 이름 + 지역 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
          {mechanic.name}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 truncate">
          {mechanic.location}
        </p>
      </div>

      {/* 조회수 */}
      <div className="flex items-center gap-1 text-purple-600 text-xs sm:text-sm flex-shrink-0">
        <Eye size={16} />
        <span className="font-medium">{mechanic.clickCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
