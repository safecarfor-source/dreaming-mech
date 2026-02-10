'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Save, ArrowDownUp, RotateCcw } from 'lucide-react';
import { mechanicsApi } from '@/lib/api';
import SortableItem from './SortableItem';
import type { Mechanic } from '@/types';

interface Props {
  mechanics: Mechanic[];
  onSaved: () => void;
}

export default function OrderManagement({ mechanics, onSaved }: Props) {
  const [items, setItems] = useState<Mechanic[]>(mechanics);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }, []);

  // 조회수순 정렬 (높은 순)
  const handleSortByViews = () => {
    setItems((prev) => [...prev].sort((a, b) => b.clickCount - a.clickCount));
    setHasChanges(true);
  };

  // 원래 순서로 복원
  const handleReset = () => {
    setItems(mechanics);
    setHasChanges(false);
  };

  // 순서 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      const orderedIds = items.map((m) => m.id);
      await mechanicsApi.reorder(orderedIds);
      alert('순서가 저장되었습니다!');
      setHasChanges(false);
      onSaved();
    } catch (error) {
      console.error(error);
      alert('순서 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 안내 문구 */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm text-purple-800">
          <span className="font-bold">☰ 아이콘</span>을 잡고 드래그하여 순서를 변경하세요.
          변경 후 <span className="font-bold">&quot;순서 저장&quot;</span> 버튼을 눌러 저장합니다.
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSortByViews}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
        >
          <ArrowDownUp size={16} />
          조회수순 정렬
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={16} />
          원래대로
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
        >
          <Save size={16} />
          {saving ? '저장 중...' : '순서 저장'}
        </button>
      </div>

      {/* 변경사항 알림 */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium">
          ⚠️ 변경사항이 있습니다. &quot;순서 저장&quot; 버튼을 눌러 저장하세요.
        </div>
      )}

      {/* 드래그앤드롭 리스트 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((mechanic, index) => (
              <SortableItem
                key={mechanic.id}
                mechanic={mechanic}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
