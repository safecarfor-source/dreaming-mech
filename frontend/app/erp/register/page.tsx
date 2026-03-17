'use client';

import { useState } from 'react';
import ErpLayout from '@/components/erp/ErpLayout';
import { erpApi } from '@/lib/erp-api';
import { UserPlus, ShoppingCart, Package, Wrench } from 'lucide-react';

type TabType = 'customer' | 'sale' | 'purchase' | 'repair';

export default function ErpRegisterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('customer');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: 'customer' as TabType, label: '고객등록', icon: UserPlus },
    { id: 'sale' as TabType, label: '매출등록', icon: ShoppingCart },
    { id: 'purchase' as TabType, label: '매입등록', icon: Package },
    { id: 'repair' as TabType, label: '정비등록', icon: Wrench },
  ];

  return (
    <ErpLayout>
      <div className="max-w-lg mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#7C4DFF] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Forms */}
        {activeTab === 'customer' && <CustomerForm onSuccess={showToast} />}
        {activeTab === 'sale' && <SaleForm onSuccess={showToast} saleType="2" title="매출등록" />}
        {activeTab === 'purchase' && <SaleForm onSuccess={showToast} saleType="1" title="매입등록" />}
        {activeTab === 'repair' && <RepairForm onSuccess={showToast} />}
      </div>
    </ErpLayout>
  );
}

// ===== 고객/차량 등록 폼 =====
function CustomerForm({ onSuccess }: { onSuccess: (type: 'success' | 'error', msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plateNumber: '',
    ownerName: '',
    phone: '',
    carModel: '',
    modelYear: '',
    color: '',
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber.trim() || !form.ownerName.trim()) {
      onSuccess('error', '차량번호와 고객명은 필수입니다');
      return;
    }
    setLoading(true);
    try {
      const res = await erpApi.createVehicle(form);
      if (res.data.success) {
        onSuccess('success', `고객 등록 완료: ${form.ownerName} (${form.plateNumber})`);
        setForm({ plateNumber: '', ownerName: '', phone: '', carModel: '', modelYear: '', color: '', memo: '' });
      } else {
        onSuccess('error', res.data.error || '등록 실패');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      onSuccess('error', axiosErr.response?.data?.message || '등록 실패');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">신규 고객/차량 등록</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">차량번호 *</label>
        <input
          type="text"
          value={form.plateNumber}
          onChange={e => setForm({ ...form, plateNumber: e.target.value })}
          placeholder="12가 3456"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">고객명 *</label>
        <input
          type="text"
          value={form.ownerName}
          onChange={e => setForm({ ...form, ownerName: e.target.value })}
          placeholder="홍길동"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder="010-1234-5678"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">차종</label>
          <input
            type="text"
            value={form.carModel}
            onChange={e => setForm({ ...form, carModel: e.target.value })}
            placeholder="소나타"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연식</label>
          <input
            type="text"
            value={form.modelYear}
            onChange={e => setForm({ ...form, modelYear: e.target.value })}
            placeholder="2024"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
        <input
          type="text"
          value={form.color}
          onChange={e => setForm({ ...form, color: e.target.value })}
          placeholder="흰색"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          value={form.memo}
          onChange={e => setForm({ ...form, memo: e.target.value })}
          placeholder="특이사항"
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#7C4DFF] text-white rounded-lg font-semibold text-sm hover:bg-[#6A3DE8] transition-colors disabled:opacity-50"
      >
        {loading ? '등록 중...' : '고객 등록'}
      </button>
    </form>
  );
}

// ===== 매출/매입 등록 폼 =====
function SaleForm({
  onSuccess,
  saleType,
  title,
}: {
  onSuccess: (type: 'success' | 'error', msg: string) => void;
  saleType: '1' | '2';
  title: string;
}) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().substring(0, 10);
  const [form, setForm] = useState({
    saleDate: today,
    customerCode: '',
    productCode: '',
    productName: '',
    qty: 1,
    unitPrice: 0,
    amount: 0,
  });

  // 수량 × 단가 자동 계산
  const handleCalcChange = (field: string, value: number) => {
    const updated = { ...form, [field]: value };
    if (field === 'qty' || field === 'unitPrice') {
      updated.amount = Math.round(updated.qty * updated.unitPrice);
    }
    setForm(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerCode.trim() || !form.productCode.trim()) {
      onSuccess('error', '거래처 코드와 상품 코드는 필수입니다');
      return;
    }
    setLoading(true);
    try {
      const res = await erpApi.createSale({ ...form, saleType });
      if (res.data.success) {
        const typeLabel = saleType === '2' ? '매출' : '매입';
        onSuccess('success', `${typeLabel} 등록 완료: ${form.amount.toLocaleString()}원`);
        setForm({ saleDate: today, customerCode: '', productCode: '', productName: '', qty: 1, unitPrice: 0, amount: 0 });
      } else {
        onSuccess('error', res.data.error || '등록 실패');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      onSuccess('error', axiosErr.response?.data?.message || '등록 실패');
    }
    setLoading(false);
  };

  const accentColor = saleType === '2' ? '#7C4DFF' : '#FF6B35';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
        <input
          type="date"
          value={form.saleDate}
          onChange={e => setForm({ ...form, saleDate: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">거래처 코드 *</label>
        <input
          type="text"
          value={form.customerCode}
          onChange={e => setForm({ ...form, customerCode: e.target.value })}
          placeholder="거래처 코드 입력"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상품 코드 *</label>
        <input
          type="text"
          value={form.productCode}
          onChange={e => setForm({ ...form, productCode: e.target.value })}
          placeholder="상품 코드 입력"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
        <input
          type="text"
          value={form.productName}
          onChange={e => setForm({ ...form, productName: e.target.value })}
          placeholder="상품명 입력"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
          <input
            type="number"
            value={form.qty}
            onChange={e => handleCalcChange('qty', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">단가</label>
          <input
            type="number"
            value={form.unitPrice}
            onChange={e => handleCalcChange('unitPrice', parseFloat(e.target.value) || 0)}
            min="0"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
          <input
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            min="0"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-colors disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {loading ? '등록 중...' : title}
      </button>
    </form>
  );
}

// ===== 정비 등록 폼 =====
function RepairForm({ onSuccess }: { onSuccess: (type: 'success' | 'error', msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().substring(0, 10);
  const [form, setForm] = useState({
    vehicleCode: '',
    repairDate: today,
    productName: '',
    productCode: '',
    qty: 1,
    unitPrice: 0,
    amount: 0,
    mileage: undefined as number | undefined,
    memo: '',
  });

  const handleCalcChange = (field: string, value: number) => {
    const updated = { ...form, [field]: value };
    if (field === 'qty' || field === 'unitPrice') {
      updated.amount = Math.round(updated.qty * updated.unitPrice);
    }
    setForm(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleCode.trim() || !form.productName.trim()) {
      onSuccess('error', '차량 코드와 정비 항목은 필수입니다');
      return;
    }
    setLoading(true);
    try {
      const res = await erpApi.createRepair({
        vehicleCode: form.vehicleCode,
        repairDate: form.repairDate,
        productName: form.productName,
        productCode: form.productCode || undefined,
        qty: form.qty,
        unitPrice: form.unitPrice,
        amount: form.amount,
        mileage: form.mileage,
        memo: form.memo || undefined,
      });
      if (res.data.success) {
        onSuccess('success', `정비 등록 완료: ${form.productName} (${form.amount.toLocaleString()}원)`);
        setForm({ vehicleCode: '', repairDate: today, productName: '', productCode: '', qty: 1, unitPrice: 0, amount: 0, mileage: undefined, memo: '' });
      } else {
        onSuccess('error', res.data.error || '등록 실패');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      onSuccess('error', axiosErr.response?.data?.message || '등록 실패');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">정비 등록</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">차량 코드 *</label>
          <input
            type="text"
            value={form.vehicleCode}
            onChange={e => setForm({ ...form, vehicleCode: e.target.value })}
            placeholder="V00001"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
          <input
            type="date"
            value={form.repairDate}
            onChange={e => setForm({ ...form, repairDate: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">정비 항목 *</label>
        <input
          type="text"
          value={form.productName}
          onChange={e => setForm({ ...form, productName: e.target.value })}
          placeholder="엔진오일 교환, 타이어 교체 등"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상품 코드</label>
        <input
          type="text"
          value={form.productCode}
          onChange={e => setForm({ ...form, productCode: e.target.value })}
          placeholder="N0-001 (선택)"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
          <input
            type="number"
            value={form.qty}
            onChange={e => handleCalcChange('qty', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">단가</label>
          <input
            type="number"
            value={form.unitPrice}
            onChange={e => handleCalcChange('unitPrice', parseFloat(e.target.value) || 0)}
            min="0"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
          <input
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            min="0"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">주행거리 (km)</label>
        <input
          type="number"
          value={form.mileage ?? ''}
          onChange={e => setForm({ ...form, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="120000"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
        <textarea
          value={form.memo}
          onChange={e => setForm({ ...form, memo: e.target.value })}
          placeholder="특이사항"
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#7C4DFF] focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#22C55E] text-white rounded-lg font-semibold text-sm hover:bg-[#16A34A] transition-colors disabled:opacity-50"
      >
        {loading ? '등록 중...' : '정비 등록'}
      </button>
    </form>
  );
}
