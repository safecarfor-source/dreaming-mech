'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIncentiveAuthStore } from '@/lib/incentive-auth';
import incentiveApi from '@/lib/incentive-api';

const ACCENT = '#3EA6FF';

interface Tab {
  id: string;
  label: string;
  href: string;
}

function getTabsForUser(user: {
  loginId: string;
  role: string;
  access: string[];
}): Tab[] {
  const tabs: Tab[] = [];

  if (user.loginId === '662') {
    tabs.push({ id: 'gd-vehicle', label: '차량조회', href: '/incentive/gd-vehicle' });
    tabs.push({ id: 'gd-product', label: '상품조회', href: '/incentive/gd-product' });
  }

  tabs.push({ id: 'team', label: '팀 인센티브', href: '/incentive/team' });

  if (user.access.includes('manager')) {
    tabs.push({ id: 'manager', label: '김권중', href: '/incentive/manager' });
  }
  if (user.access.includes('director')) {
    tabs.push({ id: 'director', label: '이정석', href: '/incentive/director' });
  }
  if (user.access.includes('admin')) {
    tabs.push({ id: 'settlement', label: '월말결산', href: '/incentive/settlement' });
    tabs.push({ id: 'insight', label: '인사이트', href: '/incentive/insight' });
    tabs.push({ id: 'cash-ledger', label: '시재관리', href: '/incentive/cash-ledger' });
    tabs.push({ id: 'admin', label: '관리자', href: '/incentive/admin' });
  }

  return tabs;
}

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  manager: '매니저',
  director: '부장',
  viewer: '',
};

const ROLE_BADGE_STYLE: Record<string, { background: string; color: string }> = {
  admin: { background: '#EBF5FF', color: ACCENT },
  manager: { background: '#EBF5FF', color: ACCENT },
  director: { background: '#F0FFF4', color: '#2BA640' },
  viewer: { background: '#E0E0E0', color: '#666666' },
};

interface ChangePwModalProps {
  onClose: () => void;
}

function ChangePwModal({ onClose }: ChangePwModalProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!current || !next || !confirm) {
      setError('모든 항목을 입력하세요');
      return;
    }
    if (next !== confirm) {
      setError('새 비밀번호가 일치하지 않습니다');
      return;
    }
    if (next.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다');
      return;
    }
    setLoading(true);
    try {
      await incentiveApi.post('/auth/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || '비밀번호 변경 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 999,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, width: '100%',
        maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', margin: 16,
      }}>
        <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>비밀번호 변경</h3>
        <input
          type="password"
          placeholder="현재 비밀번호"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          style={{
            width: '100%', padding: '12px', border: '1px solid #E0E0E0',
            borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
            marginBottom: 10, background: '#F5F5F5', color: '#1A1A1A',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="새 비밀번호"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          style={{
            width: '100%', padding: '12px', border: '1px solid #E0E0E0',
            borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
            marginBottom: 10, background: '#F5F5F5', color: '#1A1A1A',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={{
            width: '100%', padding: '12px', border: '1px solid #E0E0E0',
            borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
            marginBottom: 16, background: '#F5F5F5', color: '#1A1A1A',
            outline: 'none', boxSizing: 'border-box',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        {error && (
          <div style={{ color: '#FF4E45', fontSize: 13, minHeight: 20, marginBottom: 8 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12, background: 'none', border: '1px solid #E0E0E0',
              borderRadius: 10, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
              color: '#666',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: 12, background: ACCENT, color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '변경 중...' : '변경'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface IncentiveLayoutProps {
  children: React.ReactNode;
}

export default function IncentiveLayout({ children }: IncentiveLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isExpired, logout } = useIncentiveAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 비인증 상태 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || isExpired()) {
      logout();
      router.replace('/incentive/login');
    }
  }, [isAuthenticated, isExpired, logout, router]);

  // 외부 클릭 시 모바일 메뉴 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAuthenticated || !user) return null;

  const tabs = getTabsForUser(user);
  const roleLabel = ROLE_LABEL[user.role] ?? user.role;
  const badgeStyle = ROLE_BADGE_STYLE[user.role] ?? ROLE_BADGE_STYLE.viewer;

  function handleLogout() {
    logout();
    router.replace('/incentive/login');
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; width: 100%; }
        body {
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #FFFFFF; color: #1A1A1A; min-height: 100vh;
          -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
        }
        .inc-inline-tabs { display: flex; gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; flex: 1; min-width: 0; scrollbar-width: none; }
        .inc-inline-tabs::-webkit-scrollbar { display: none; }
        .inc-tab-btn {
          padding: 0 14px; font-size: 13px; font-weight: 500; font-family: inherit;
          color: #666; background: none; border: none; border-bottom: 2px solid transparent;
          cursor: pointer; white-space: nowrap; transition: all 0.2s; height: 52px; line-height: 52px;
        }
        .inc-tab-btn:hover { color: #1A1A1A; }
        .inc-tab-btn.active { color: ${ACCENT}; border-bottom-color: ${ACCENT}; font-weight: 700; }
        .inc-btn-outline {
          padding: 6px 14px; background: none; border: 1px solid #E0E0E0; border-radius: 8px;
          font-size: 13px; font-family: inherit; cursor: pointer; color: #666; white-space: nowrap;
          transition: all 0.15s;
        }
        .inc-btn-outline:hover { background: #FEF2F2; color: #FF4E45; border-color: #FF4E45; }
        .inc-btn-pw {
          padding: 6px 14px; background: none; border: 1px solid ${ACCENT}; border-radius: 8px;
          font-size: 13px; font-family: inherit; cursor: pointer; color: ${ACCENT}; white-space: nowrap;
        }
        .inc-btn-pw:hover { background: #EBF5FF; }
        .inc-hamburger {
          display: none; background: none; border: none; font-size: 24px; cursor: pointer;
          padding: 4px 8px; color: #1A1A1A; line-height: 1;
        }
        .inc-mobile-dropdown {
          display: none; position: absolute; top: 100%; right: 16px; background: #fff;
          border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); padding: 8px 0;
          min-width: 180px; z-index: 200;
        }
        .inc-mobile-dropdown.open { display: block; }
        .inc-mobile-dropdown button {
          display: block; width: 100%; text-align: left; padding: 12px 20px; background: none;
          border: none; font-size: 14px; font-family: inherit; cursor: pointer; color: #1A1A1A;
        }
        .inc-mobile-dropdown button:hover { background: #F0F0F0; }
        .inc-dd-info { padding: 12px 20px; font-size: 13px; color: #666; border-bottom: 1px solid #E0E0E0; }
        .inc-content { padding: 20px; padding-top: 72px; max-width: 1200px; margin: 0 auto; }
        @media (max-width: 768px) {
          .inc-user-name, .inc-role-badge, .inc-btn-pw, .inc-btn-outline { display: none !important; }
          .inc-hamburger { display: block !important; }
          .inc-tab-btn { padding: 0 10px; font-size: 12px; }
          .inc-logo { font-size: 14px !important; margin-right: 4px !important; }
          .inc-content { padding: 16px; padding-top: 60px; }
        }
        @media (max-width: 480px) {
          .inc-content { padding: 12px; padding-top: 60px; }
        }
      `}</style>

      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 20px',
        background: '#fff', borderBottom: '1px solid #E0E0E0',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        gap: 0, height: 52,
      }}>
        {/* 로고 */}
        <span className="inc-logo" style={{
          fontSize: 16, fontWeight: 800, color: ACCENT,
          whiteSpace: 'nowrap', marginRight: 8, flexShrink: 0,
        }}>
          인센티브 현황판
        </span>

        {/* 인라인 탭 */}
        <div className="inc-inline-tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <button
                key={tab.id}
                className={`inc-tab-btn${isActive ? ' active' : ''}`}
                onClick={() => router.push(tab.href)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 사용자 정보 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, position: 'relative' }} ref={menuRef}>
          <span className="inc-user-name" style={{ fontWeight: 600, color: '#1A1A1A' }}>
            {user.role !== 'viewer' ? user.name : ''}
          </span>
          {user.role !== 'viewer' && (
            <span
              className="inc-role-badge"
              style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                ...badgeStyle,
              }}
            >
              {roleLabel}
            </span>
          )}
          <button className="inc-btn-pw" onClick={() => setShowChangePw(true)}>
            비밀번호 변경
          </button>
          <button className="inc-btn-outline" onClick={handleLogout}>
            로그아웃
          </button>
          {/* 햄버거 (모바일) */}
          <button
            className="inc-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
          >
            ☰
          </button>
          {/* 모바일 드롭다운 */}
          <div className={`inc-mobile-dropdown${menuOpen ? ' open' : ''}`}>
            <div className="inc-dd-info">
              {user.role !== 'viewer'
                ? `${user.name} · ${roleLabel}`
                : '공용 계정'}
            </div>
            <button onClick={() => { setShowChangePw(true); setMenuOpen(false); }}>
              비밀번호 변경
            </button>
            <button onClick={handleLogout}>로그아웃</button>
          </div>
        </div>
      </div>

      {/* 페이지 콘텐츠 */}
      <div className="inc-content">
        {children}
      </div>

      {/* 비밀번호 변경 모달 */}
      {showChangePw && (
        <ChangePwModal onClose={() => setShowChangePw(false)} />
      )}
    </>
  );
}
