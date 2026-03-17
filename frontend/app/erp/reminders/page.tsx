'use client';

import { useEffect, useState, useCallback } from 'react';
import ErpLayout from '@/components/erp/ErpLayout';
import { erpApi } from '@/lib/erp-api';
import {
  Bell,
  Phone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Car,
} from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────────────────────────

type ReminderStatus = 'pending' | 'sent' | 'completed' | 'dismissed';

type ReminderType =
  | 'no_visit_3m'
  | 'no_visit_6m'
  | 'oil_change'
  | 'tire_rotation'
  | 'inspection';

interface ReminderVehicle {
  plateNumber: string;
  ownerName: string;
  phone: string;
  carModel: string;
}

interface Reminder {
  id: number;
  vehicleCode: string;
  reminderType: ReminderType;
  dueDate: string;
  status: ReminderStatus;
  message: string;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  vehicle: ReminderVehicle;
}

interface ReminderMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GeneratedItem {
  vehicleCode: string;
  reminderType: string;
  reason: string;
}

interface GenerateResult {
  generated: number;
  items: GeneratedItem[];
  generatedAt: string;
}

// ── 상수 ──────────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: ReminderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'sent', label: '발송완료' },
  { value: 'completed', label: '처리완료' },
  { value: 'dismissed', label: '해제' },
];

const REMINDER_TYPE_CONFIG: Record<
  ReminderType,
  { label: string; badgeCls: string; iconCls: string }
> = {
  no_visit_3m: {
    label: '3개월 미방문',
    badgeCls: 'bg-orange-50 text-orange-700 border border-orange-200',
    iconCls: 'text-orange-500',
  },
  no_visit_6m: {
    label: '6개월 미방문',
    badgeCls: 'bg-red-50 text-red-700 border border-red-200',
    iconCls: 'text-red-500',
  },
  oil_change: {
    label: '오일 교환',
    badgeCls: 'bg-blue-50 text-blue-700 border border-blue-200',
    iconCls: 'text-blue-500',
  },
  tire_rotation: {
    label: '타이어 교체',
    badgeCls: 'bg-purple-50 text-purple-700 border border-purple-200',
    iconCls: 'text-purple-500',
  },
  inspection: {
    label: '자동차 검사',
    badgeCls: 'bg-green-50 text-green-700 border border-green-200',
    iconCls: 'text-green-500',
  },
};

const STATUS_CONFIG: Record<
  ReminderStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  pending: {
    label: '대기중',
    cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    icon: <Clock className="w-3 h-3" />,
  },
  sent: {
    label: '발송완료',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <Bell className="w-3 h-3" />,
  },
  completed: {
    label: '처리완료',
    cls: 'bg-green-50 text-green-700 border border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  dismissed: {
    label: '해제',
    cls: 'bg-gray-50 text-gray-500 border border-gray-200',
    icon: <X className="w-3 h-3" />,
  },
};

const REMINDER_TYPE_LABELS: Record<string, string> = {
  no_visit_3m: '3개월 미방문',
  no_visit_6m: '6개월 미방문',
  oil_change: '오일 교환',
  tire_rotation: '타이어 교체',
  inspection: '자동차 검사',
};

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isPastDue(dueDateIso: string): boolean {
  return new Date(dueDateIso) < new Date();
}

// ── 리마인더 카드 ─────────────────────────────────────────────────────────────

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const typeConfig = REMINDER_TYPE_CONFIG[reminder.reminderType] ?? {
    label: reminder.reminderType,
    badgeCls: 'bg-gray-50 text-gray-700 border border-gray-200',
    iconCls: 'text-gray-400',
  };
  const statusConfig = STATUS_CONFIG[reminder.status];
  const overdue = isPastDue(reminder.dueDate) && reminder.status === 'pending';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* 왼쪽: 아이콘 + 정보 */}
        <div className="flex items-start gap-4 min-w-0">
          <div className={`p-2.5 rounded-xl ${typeConfig.badgeCls} flex-shrink-0`}>
            <Car className={`w-5 h-5 ${typeConfig.iconCls}`} />
          </div>

          <div className="min-w-0">
            {/* 유형 배지 + 상태 배지 */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${typeConfig.badgeCls}`}
              >
                {typeConfig.label}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.cls}`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                  <AlertCircle className="w-3 h-3" />
                  지연
                </span>
              )}
            </div>

            {/* 차량 + 고객 정보 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-1.5">
              <span className="font-bold text-gray-900 text-sm">
                {reminder.vehicle.plateNumber}
              </span>
              <span className="text-gray-400 text-xs">|</span>
              <span className="text-gray-600 text-sm">{reminder.vehicle.carModel}</span>
              <span className="text-gray-400 text-xs">|</span>
              <span className="text-gray-700 text-sm font-medium">
                {reminder.vehicle.ownerName}
              </span>
            </div>

            {/* 전화번호 */}
            <a
              href={`tel:${reminder.vehicle.phone}`}
              className="inline-flex items-center gap-1.5 text-[#7C4DFF] hover:text-[#6B3DE8] text-sm font-medium mb-3 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {reminder.vehicle.phone}
            </a>

            {/* 메시지 */}
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              {reminder.message}
            </p>

            {/* 예정일 */}
            <p
              className={`text-xs ${
                overdue ? 'text-red-500 font-semibold' : 'text-gray-400'
              }`}
            >
              예정일: {formatDate(reminder.dueDate)}
              {reminder.sentAt && (
                <span className="ml-3 text-gray-400">
                  발송: {formatDate(reminder.sentAt)}
                </span>
              )}
              {reminder.completedAt && (
                <span className="ml-3 text-gray-400">
                  완료: {formatDate(reminder.completedAt)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 오른쪽: 액션 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            disabled
            title="카카오톡 알림톡 (준비 중)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-200 opacity-60 cursor-not-allowed"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 fill-current"
              aria-hidden="true"
            >
              <path d="M12 3C6.477 3 2 6.582 2 11c0 2.745 1.548 5.181 3.938 6.7-.168.617-.61 2.225-.698 2.573-.108.424.155.42.326.306.134-.09 2.12-1.44 2.978-2.024A11.3 11.3 0 0012 19c5.522 0 10-3.582 10-8S17.523 3 12 3z" />
            </svg>
            카카오톡 보내기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 생성 결과 모달 ─────────────────────────────────────────────────────────────

function GenerateResultModal({
  result,
  onClose,
}: {
  result: GenerateResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">리마인더 생성 완료</h2>
            <p className="text-sm text-gray-500 mt-0.5">{result.generatedAt} 기준</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-center gap-3 p-4 bg-purple-50 rounded-xl">
            <Bell className="w-6 h-6 text-[#7C4DFF]" />
            <span className="text-2xl font-bold text-[#7C4DFF]">
              {result.generated}건
            </span>
            <span className="text-gray-600 text-sm">새 리마인더 생성됨</span>
          </div>
        </div>

        {result.items.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              생성 목록
            </p>
            <ul className="space-y-2">
              {result.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-400 font-mono">
                      {item.vehicleCode}
                    </span>
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {REMINDER_TYPE_LABELS[item.reminderType] ?? item.reminderType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {item.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#7C4DFF] text-white text-sm font-semibold hover:bg-[#6B3DE8] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 페이지 본체 ───────────────────────────────────────────────────────────────

export default function ErpRemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [meta, setMeta] = useState<ReminderMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>('all');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  const fetchReminders = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: { status?: string; page: number; limit: number } = {
          page,
          limit: 20,
        };
        if (statusFilter !== 'all') params.status = statusFilter;

        const res = await erpApi.getReminders(params);
        const body = res.data as { data: Reminder[]; meta: ReminderMeta };
        setReminders(body.data ?? []);
        setMeta(body.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
      } catch {
        setError('리마인더를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  // 탭별 카운트 — 전체 상태 각각 조회
  const fetchCounts = useCallback(async () => {
    try {
      const statuses: Array<ReminderStatus | 'all'> = [
        'all',
        'pending',
        'sent',
        'completed',
        'dismissed',
      ];
      const results = await Promise.allSettled(
        statuses.map((s) =>
          erpApi.getReminders(
            s === 'all' ? { page: 1, limit: 1 } : { status: s, page: 1, limit: 1 }
          )
        )
      );
      const newCounts: Record<string, number> = {};
      statuses.forEach((s, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          const body = r.value.data as { meta?: { total?: number } };
          newCounts[s] = body.meta?.total ?? 0;
        }
      });
      setCounts(newCounts);
    } catch {
      // 카운트 실패는 조용히 무시
    }
  }, []);

  useEffect(() => {
    fetchReminders(1);
  }, [fetchReminders]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // 리마인더 생성
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await erpApi.generateReminders();
      const body = res.data as { data: GenerateResult };
      setGenerateResult(body.data);
      // 목록 및 카운트 갱신
      await Promise.all([fetchReminders(1), fetchCounts()]);
    } catch {
      setError('리마인더 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchReminders(newPage);
  };

  return (
    <ErpLayout>
      <div className="max-w-5xl mx-auto">
        {/* 헤더 행 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">리마인더 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              고객 방문 주기 및 정비 일정 알림을 관리합니다.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C4DFF] text-white text-sm font-semibold hover:bg-[#6B3DE8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? '생성 중...' : '리마인더 생성'}
          </button>
        </div>

        {/* 에러 배너 */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 상태 필터 탭 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const count = counts[tab.value];
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-[#7C4DFF] text-white border-[#7C4DFF] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#7C4DFF]/50 hover:text-[#7C4DFF]'
                }`}
              >
                {tab.label}
                {count != null && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active ? 'bg-[#6B3DE8] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 리마인더 목록 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200" />
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#7C4DFF] absolute top-0" />
            </div>
            <p className="text-gray-500 text-sm">리마인더를 불러오는 중...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-100">
            <Bell className="w-12 h-12 text-gray-200" />
            <p className="text-gray-400 text-sm font-medium">리마인더가 없습니다.</p>
            <p className="text-gray-300 text-xs">
              &quot;리마인더 생성&quot; 버튼으로 새 리마인더를 만들어 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-[#7C4DFF]/50 hover:text-[#7C4DFF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>
            <span className="text-sm text-gray-500">
              {meta.page} / {meta.totalPages}
              <span className="ml-2 text-gray-400">({meta.total}건)</span>
            </span>
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-[#7C4DFF]/50 hover:text-[#7C4DFF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 생성 결과 모달 */}
      {generateResult && (
        <GenerateResultModal
          result={generateResult}
          onClose={() => setGenerateResult(null)}
        />
      )}
    </ErpLayout>
  );
}
