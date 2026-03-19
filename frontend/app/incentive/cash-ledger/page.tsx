'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';
import type { CashLedgerResponse } from '@/types/incentive';

// ===== 상수 =====

const ACCENT = '#3EA6FF';
const GREEN = '#2BA640';
const RED = '#FF4E45';

// ===== 유틸 =====

function fmt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 이번 달 시작일 / 말일 반환
function getThisMonthRange(): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const start = `${y}-${m}-01`;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

// ===== 공통 스타일 =====

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #E0E0E0',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#F5F5F5',
  color: '#1A1A1A',
  outline: 'none',
  flex: 1,
  minWidth: 120,
};

// ===== 메인 페이지 =====

export default function CashLedgerPage() {
  const { user } = useIncentiveAuthStore();
  const isAdmin = user?.role === 'admin' || user?.access?.includes('admin');

  const initialRange = getThisMonthRange();
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [tableData, setTableData] = useState<CashLedgerResponse | null>(null);
  const [balanceData, setBalanceData] = useState<CashLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (start: string, end: string) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().slice(0, 10);

    try {
      const tableRes = await incentiveApi.get<CashLedgerResponse>(
        `/gd/cash-ledger?startDate=${start}&endDate=${end}`
      );
      const tData = tableRes.data;

      // 시재(금고 잔고)는 항상 오늘까지 계산
      let bData = tData;
      if (end < today) {
        const balRes = await incentiveApi.get<CashLedgerResponse>(
          `/gd/cash-ledger?startDate=${start}&endDate=${today}`
        );
        bData = balRes.data;
      }

      setTableData(tData);
      setBalanceData(bData);
    } catch (e: unknown) {
      const err = e as { message?: string; response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || err.message || '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // 날짜 변경 시 300ms 디바운스 fetch
  useEffect(() => {
    if (!isAdmin) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(startDate, endDate);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [startDate, endDate, fetchData, isAdmin]);

  // 권한 없음
  if (!isAdmin) {
    return (
      <div style={{
        maxWidth: 520, margin: '0 auto',
        textAlign: 'center', padding: '60px 20px', color: '#999',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
          관리자만 접근 가능합니다
        </div>
        <div style={{ fontSize: 13 }}>관리자 계정으로 로그인해주세요</div>
      </div>
    );
  }

  // 시재 요약 계산 (balanceData 기준)
  const totalCashIn = tableData?.totalCashIn ?? 0;
  const totalCashOut = tableData?.totalCashOut ?? 0;
  const carry = balanceData?.carryOver ?? 0;
  const bIn = balanceData?.totalCashIn ?? 0;
  const bOut = balanceData?.totalCashOut ?? 0;
  const finalBalance = carry + bIn - bOut;

  // 입출금 내역 flat list (누계 시재 포함)
  const allEntries: Array<{
    date: string;
    source: string;
    description: string;
    type: 'in' | 'out';
    amount: number;
    balance: number;
  }> = [];

  if (tableData?.dailyEntries) {
    let running = tableData.carryOver ?? 0;
    for (const day of tableData.dailyEntries) {
      for (const entry of day.entries || []) {
        if (entry.type === 'in') running += entry.amount;
        else running -= entry.amount;
        allEntries.push({
          date: day.date,
          source: entry.source || '',
          description: entry.description || '',
          type: entry.type,
          amount: entry.amount,
          balance: running,
        });
      }
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 날짜 범위 선택 */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid #F0F0F0',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ fontSize: 16, color: '#BBBBBB', paddingTop: 18 }}>~</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
          <div style={{
            width: 28, height: 28, border: '3px solid #EEEEEE',
            borderTopColor: ACCENT, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 13 }}>로딩 중...</div>
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 13, color: RED }}>
            데이터 로드 실패<br />
            <span style={{ fontSize: 12, color: '#999' }}>{error}</span>
          </div>
        </div>
      )}

      {/* 요약 카드 */}
      {!loading && !error && tableData && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: 14, padding: '14px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>입금 합계</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: ACCENT, letterSpacing: '-0.5px' }}>
                ₩{fmt(totalCashIn)}
              </div>
            </div>
            <div style={{
              background: '#FFFFFF', borderRadius: 14, padding: '14px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>출금 합계</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: RED, letterSpacing: '-0.5px' }}>
                ₩{fmt(totalCashOut)}
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
              borderRadius: 14, padding: '14px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#2E7D32', marginBottom: 6 }}>시재</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1B5E20', letterSpacing: '-0.5px' }}>
                ₩{fmt(finalBalance)}
              </div>
            </div>
          </div>

          {/* 내역 테이블 */}
          {allEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', fontSize: 13 }}>
              해당 기간 내역이 없습니다.
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              border: '1px solid #F0F0F0',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #E0E0E0' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#666', whiteSpace: 'nowrap' }}>날짜</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#666', whiteSpace: 'nowrap' }}>구분</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#666' }}>적요</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap' }}>입금</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: RED, whiteSpace: 'nowrap' }}>출금</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1B5E20', whiteSpace: 'nowrap' }}>시재</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 이월시재 행 */}
                    <tr style={{ background: '#FFFDE7' }}>
                      <td style={{ padding: '8px 12px', color: '#666', whiteSpace: 'nowrap' }}></td>
                      <td colSpan={2} style={{ padding: '8px 8px', fontWeight: 700, color: '#F57F17' }}>이월시재</td>
                      <td style={{ padding: '8px 8px' }}></td>
                      <td style={{ padding: '8px 8px' }}></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#F57F17', whiteSpace: 'nowrap' }}>
                        {fmt(tableData.carryOver ?? 0)}
                      </td>
                    </tr>
                    {/* 내역 행 */}
                    {allEntries.map((e, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F5F5F5' }}>
                        <td style={{ padding: '8px 12px', color: '#666', whiteSpace: 'nowrap' }}>
                          {formatDateShort(e.date)}
                        </td>
                        <td style={{ padding: '8px 8px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {e.source}
                        </td>
                        <td style={{ padding: '8px 8px', maxWidth: 160, wordBreak: 'keep-all' }}>
                          {e.description}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {e.type === 'in' && (
                            <span style={{ color: ACCENT, fontWeight: 700 }}>{fmt(e.amount)}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {e.type === 'out' && (
                            <span style={{ color: RED, fontWeight: 700 }}>{fmt(e.amount)}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {fmt(e.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#E8F5E9', borderTop: '2px solid #4CAF50' }}>
                      <td colSpan={3} style={{ padding: '10px 12px', fontWeight: 800, fontSize: 14, color: '#1B5E20' }}>
                        합계
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: ACCENT, whiteSpace: 'nowrap' }}>
                        {fmt(totalCashIn)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: RED, whiteSpace: 'nowrap' }}>
                        {fmt(totalCashOut)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#1B5E20', fontSize: 15, whiteSpace: 'nowrap' }}>
                        {fmt(carry + totalCashIn - totalCashOut)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
