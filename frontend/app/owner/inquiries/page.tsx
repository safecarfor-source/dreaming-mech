'use client';

import { useEffect, useState } from 'react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import { ownerInquiriesApi } from '@/lib/api';
import { MessageSquare, MapPin, Wrench, Car, Phone, User, Clock, ChevronRight, X } from 'lucide-react';

type OwnerInquiry = {
  id: number;
  name: string | null;
  phone: string | null;
  regionSido: string;
  regionSigungu: string;
  serviceType: string;
  description: string | null;
  vehicleNumber: string | null;
  vehicleModel: string | null;
  status: string;
  sharedAt: string | null;
  shareClickCount: number;
  mechanic: { id: number; name: string; address: string } | null;
  createdAt: string;
};

const getServiceTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    TIRE: '🛞 타이어',
    OIL: '🛢️ 엔진오일',
    BRAKE: '🔴 브레이크',
    MAINTENANCE: '🔧 경정비',
    CONSULT: '💬 종합상담',
  };
  return map[type] || type;
};

const getStatusLabel = (status: string) => {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: '접수됨', color: 'bg-yellow-100 text-yellow-700' },
    SHARED: { label: '공유됨', color: 'bg-blue-100 text-blue-700' },
    CONNECTED: { label: '연결됨', color: 'bg-green-100 text-green-700' },
    COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-500' },
  };
  return map[status] || { label: status, color: 'bg-gray-100 text-gray-500' };
};

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? '오후' : '오전';
  const h12 = hours % 12 || 12;
  return `${month}/${day} ${ampm} ${h12}:${minutes}`;
};

export default function OwnerInquiriesPage() {
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<OwnerInquiry | null>(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const res = await ownerInquiriesApi.getAll();
        setInquiries(res.data || []);
      } catch {
        // 무시
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  return (
    <OwnerLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">고객 문의</h1>
            <p className="text-gray-500 text-sm mt-1">내 정비소를 선택한 고객 문의가 표시됩니다</p>
          </div>
          {inquiries.length > 0 && (
            <span className="bg-[#7C4DFF] text-white text-xs font-bold px-3 py-1 rounded-full">
              {inquiries.length}건
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-16">불러오는 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">아직 접수된 문의가 없습니다.</p>
            <p className="text-gray-400 text-xs mt-1">고객이 문의 시 내 정비소를 선택하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => {
              const badge = getStatusLabel(inq.status);
              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiry(inq)}
                  className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#7C4DFF]/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{getServiceTypeLabel(inq.serviceType)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {inq.regionSido} {inq.regionSigungu}
                        </span>
                        {inq.vehicleModel && (
                          <span className="flex items-center gap-1">
                            <Car size={12} /> {inq.vehicleModel}
                          </span>
                        )}
                        {inq.name && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {inq.name}
                          </span>
                        )}
                      </div>
                      {inq.description && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-1">{inq.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">{formatDateTime(inq.createdAt)}</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-[#7C4DFF] transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 문의 상세 모달 */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">문의 상세</h3>
              <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{getServiceTypeLabel(selectedInquiry.serviceType)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusLabel(selectedInquiry.status).color}`}>
                  {getStatusLabel(selectedInquiry.status).label}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{selectedInquiry.regionSido} {selectedInquiry.regionSigungu}</span>
                </div>
                {selectedInquiry.name && (
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span>{selectedInquiry.name}</span>
                  </div>
                )}
                {selectedInquiry.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${selectedInquiry.phone}`} className="text-[#7C4DFF] font-medium hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                )}
                {selectedInquiry.vehicleModel && (
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-gray-400" />
                    <span>{selectedInquiry.vehicleModel} {selectedInquiry.vehicleNumber || ''}</span>
                  </div>
                )}
                {selectedInquiry.mechanic && (
                  <div className="flex items-center gap-2">
                    <Wrench size={14} className="text-gray-400" />
                    <span>{selectedInquiry.mechanic.name}</span>
                  </div>
                )}
              </div>

              {selectedInquiry.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">문의 내용</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedInquiry.description}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                <Clock size={12} className="inline mr-1" />
                {formatDateTime(selectedInquiry.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}
