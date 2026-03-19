'use client';

/**
 * BlurOverlay.tsx
 *
 * 개인 탭(김권중/이정석) 금액 블러 처리 컴포넌트.
 * 원본 HTML의 applyBlurState() / blur-overlay CSS / togglePrivacy() 1:1 변환.
 *
 * 블러 면제 조건: role === 'admin' 또는 loginId === '662'
 * 블러 해제: pinUnlocked === true && privacyMode === false
 *
 * IncentiveLayout 통합 방법:
 *   1. import BlurOverlay, { needsBlurForUser } from '@/components/incentive/security/BlurOverlay';
 *   2. Layout 내 상태:
 *      const [pinUnlocked, setPinUnlocked] = useState(false);
 *      const [privacyMode, setPrivacyMode] = useState(false);
 *   3. 개인 탭 콘텐츠를 BlurOverlay로 감싼다:
 *      <BlurOverlay
 *        active={needsBlurForUser(user) && (!pinUnlocked || privacyMode)}
 *        onUnlockRequest={() => setPinOpen(true)}
 *      >
 *        {children}
 *      </BlurOverlay>
 *   4. 헤더에 프라이버시 토글 버튼 추가 (needsBlurForUser(user) 일 때만 표시):
 *      <button onClick={() => {
 *        setPrivacyMode((v) => !v);
 *        if (!privacyMode) setPinUnlocked(false); // 잠금 시 pinUnlocked 초기화
 *      }}>
 *        {privacyMode ? '🔒' : '🔓'}
 *      </button>
 *   5. 탭 전환 이벤트(visibilitychange)에서 lockScreen() 연동:
 *      document.addEventListener('visibilitychange', () => {
 *        if (document.hidden && needsBlurForUser(user)) setPinUnlocked(false);
 *      });
 */

import { type ReactNode } from 'react';

// ── 헬퍼: 블러 필요 여부 판정 ─────────────────────────────────────────────────
// 원본 HTML의 needsBlur() 함수 1:1 변환

export function needsBlurForUser(user: {
  role: string;
  loginId: string;
} | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return false;
  if (user.loginId === '662') return false;
  return true;
}

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface BlurOverlayProps {
  /** true이면 블러 활성화 */
  active: boolean;
  /** "내 인센 보기" 버튼 클릭 시 PIN 모달 열기 요청 */
  onUnlockRequest: () => void;
  children: ReactNode;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function BlurOverlay({
  active,
  onUnlockRequest,
  children,
}: BlurOverlayProps) {
  return (
    <div style={{ position: 'relative' }}>
      {children}

      {/* 블러 오버레이 레이어 */}
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // 원본 HTML: backdrop-filter: blur(12px)
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(255,255,255,0.35)',
            borderRadius: 'inherit',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 36 }}>🔒</div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#1A1A1A',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            잠긴 화면입니다
          </p>
          <button
            onClick={onUnlockRequest}
            style={{
              padding: '10px 24px',
              background: '#3EA6FF',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(62,166,255,0.35)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = '1')
            }
          >
            내 인센 보기
          </button>
        </div>
      )}
    </div>
  );
}

// ── 고정 잠금 해제 버튼 (화면 우하단 플로팅) ──────────────────────────────────
// 원본 HTML의 fixedUnlockBtn 1:1 변환.
// 개인 탭이 활성화된 상태에서 blur가 걸려 있을 때만 표시.
//
// IncentiveLayout 통합 방법:
//   <FixedUnlockButton
//     visible={needsBlurForUser(user) && isPersonalTab && (!pinUnlocked || privacyMode)}
//     onClick={() => setPinOpen(true)}
//   />
//   (isPersonalTab: pathname이 /incentive/manager 또는 /incentive/director 일 때 true)

export interface FixedUnlockButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function FixedUnlockButton({ visible, onClick }: FixedUnlockButtonProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        padding: '12px 20px',
        background: '#3EA6FF',
        color: '#fff',
        border: 'none',
        borderRadius: 50,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(62,166,255,0.4)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      🔓 잠금 해제
    </button>
  );
}
