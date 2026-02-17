'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Search, X, Link2, Unlink } from 'lucide-react';
import { adminOwnerApi } from '@/lib/api';
import type { Owner } from '@/types';

interface OwnerLinkSectionProps {
  ownerId: number | null;
  onOwnerChange: (ownerId: number | null) => void;
}

export default function OwnerLinkSection({ ownerId, onOwnerChange }: OwnerLinkSectionProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      const res = await adminOwnerApi.getAll('APPROVED');
      setOwners(res.data || []);
    } catch (error) {
      console.error('Failed to load owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedOwner = owners.find((o) => o.id === ownerId);

  const filteredOwners = owners.filter((owner) => {
    const term = searchTerm.toLowerCase();
    return (
      (owner.name?.toLowerCase().includes(term) ?? false) ||
      (owner.email?.toLowerCase().includes(term) ?? false) ||
      (owner.businessName?.toLowerCase().includes(term) ?? false)
    );
  });

  const handleSelect = (owner: Owner) => {
    onOwnerChange(owner.id);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleUnlink = () => {
    onOwnerChange(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <UserCheck className="text-purple-600" />
        사장님 연결
      </h2>

      <p className="text-sm text-gray-500">
        승인된 사장님 계정을 이 정비소에 연결하면, 해당 사장님이 직접 정비소 정보를 관리할 수 있습니다.
      </p>

      {/* 현재 연결된 사장님 */}
      {selectedOwner ? (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link2 className="text-purple-600" size={20} />
            <div>
              <p className="font-medium text-gray-900">
                {selectedOwner.name || '이름 없음'}
                {selectedOwner.businessName && (
                  <span className="text-purple-600 ml-2">({selectedOwner.businessName})</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{selectedOwner.email || ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUnlink}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Unlink size={14} />
            연결 해제
          </button>
        </div>
      ) : (
        <div className="relative">
          <div
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Search className="text-gray-400" size={18} />
            <span className="text-gray-400 text-sm">사장님을 검색하여 연결하세요</span>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-20 top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-hidden">
              {/* 검색 입력 */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <Search className="text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="이름, 이메일, 사업장명 검색..."
                    className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* 사장님 목록 */}
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-400">로딩 중...</div>
                ) : filteredOwners.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    {searchTerm ? '검색 결과가 없습니다' : '승인된 사장님이 없습니다'}
                  </div>
                ) : (
                  filteredOwners.map((owner) => (
                    <button
                      key={owner.id}
                      type="button"
                      onClick={() => handleSelect(owner)}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {owner.name || '이름 없음'}
                        {owner.businessName && (
                          <span className="text-purple-600 ml-2">({owner.businessName})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {owner.email || ''}
                        {owner._count?.mechanics !== undefined && (
                          <span className="ml-2 text-gray-400">
                            등록 매장 {owner._count.mechanics}개
                          </span>
                        )}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* 닫기 */}
              <div className="p-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
