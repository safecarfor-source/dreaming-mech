'use client';

/**
 * InactivityGuard.tsx
 *
 * 비활동 감지 → 경고 토스트 → 자동 로그아웃 컴포넌트.
 * 원본 HTML의 startInactivityTimer / stopInactivityTimer /
 *   resetInactivity / showInactivityWarning 1:1 변환.
 *
 * 타임라인:
 *   0분 ─────────── 4분(WARN_AFTER) ── 5분(WARN_AFTER+WARNING_SEC) → 자동 로그아웃
 *                    경고 토스트 표시   카운트다운 0 도달
 *
 * IncentiveLayout 통합 방법:
 *   1. import InactivityGuard from '@/components/incentive/security/InactivityGuard';
 *   2. import { useIncentiveAuthStore } from '@/lib/incentive-auth';
 *   3. Layout 내부에서 (isAuthenticated 일 때만 렌더):
 *      const { logout } = useIncentiveAuthStore();
 *
 *      <InactivityGuard
 *        active={isAuthenticated}
 *        onLogout={() => {
 *          logout();
 *          router.replace('/incentive/login');
 *        }}
 *      />
 *   4. InactivityGuard는 DOM을 추가하지 않고 경고 모달만 Portal로 렌더한다.
 *      Layout의 children 위나 아래 어디든 위치 무관.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── 상수 ─────────────────────────────────────────────────────────────────────
// 원본 HTML: INACTIVITY_MS = 4분, WARNING_SEC = 60초

const WARN_AFTER_MS = 4 * 60 * 1000; // 4분 후 경고 시작
const WARNING_SEC = 60;               // 경고 카운트다운 60초

// 활동으로 인정하는 이벤트 목록 (원본 HTML과 동일)
const ACTIVITY_EVENTS = [
  'click',
  'touchstart',
  'scroll',
  'keypress',
  'mousemove',
] as const;

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface InactivityGuardProps {
  /** false이면 타이머 전체 중지 (미로그인 상태) */
  active: boolean;
  /** 카운트다운 만료 시 호출 — 로그아웃 + 리다이렉트 처리 */
  onLogout: () => void;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function InactivityGuard({
  active,
  onLogout,
}: InactivityGuardProps) {
  const [warningVisible, setWarningVisible] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_SEC);

  // 타이머 ref — 클린업에서 사용
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 경고 중지 & 타이머 리셋 ────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setWarningVisible(false);
    setCountdown(WARNING_SEC);
  }, []);

  // ── 경고 모달 표시 + 카운트다운 시작 ─────────────────────────────────────

  const showWarning = useCallback(() => {
    setCountdown(WARNING_SEC);
    setWarningVisible(true);

    let remaining = WARNING_SEC;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        stopAll();
        onLogout();
      }
    }, 1000);
  }, [onLogout, stopAll]);

  // ── 비활동 타이머 시작 ────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    stopAll();
    warnTimerRef.current = setTimeout(showWarning, WARN_AFTER_MS);
  }, [showWarning, stopAll]);

  // ── 활동 감지 시 타이머 리셋 ─────────────────────────────────────────────

  const handleActivity = useCallback(() => {
    // 경고 모달이 표시 중일 때는 리셋 하지 않음 (원본 HTML 동작 일치)
    if (warningVisible) return;
    startTimer();
  }, [warningVisible, startTimer]);

  // ── active 상태 변경 시 타이머 ON/OFF ────────────────────────────────────

  useEffect(() => {
    if (!active) {
      stopAll();
      return;
    }
    startTimer();
    return () => stopAll();
  }, [active, startTimer, stopAll]);

  // ── 이벤트 리스너 등록/해제 ───────────────────────────────────────────────

  useEffect(() => {
    if (!active) return;

    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => {
        document.removeEventListener(evt, handleActivity);
      });
    };
  }, [active, handleActivity]);

  // ── 탭 숨김 → 즉시 경고 (원본 HTML의 visibilitychange 일부) ─────────────
  // 블러 처리는 BlurOverlay가 담당하므로 여기서는 타이머만 가속

  useEffect(() => {
    if (!active) return;

    function handleVisibility() {
      if (document.hidden) {
        // 탭 숨김 시 남은 시간 없이 즉시 경고 표시
        stopAll();
        showWarning();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [active, showWarning, stopAll]);

  // ── 경고 모달 렌더 ────────────────────────────────────────────────────────

  if (!warningVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 36,
          width: '100%',
          maxWidth: 340,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
            color: '#FF4E45',
          }}
        >
          자리를 비우셨나요?
        </h3>
        <p
          style={{
            fontSize: 14,
            color: '#888',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          보안을 위해 곧 자동 로그아웃됩니다
        </p>

        {/* 카운트다운 숫자 */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#FF4E45',
            marginBottom: 24,
            lineHeight: 1,
            // 카운트가 10 이하면 강조
            opacity: countdown <= 10 ? 1 : 0.85,
          }}
        >
          {countdown}
        </div>

        <button
          onClick={() => {
            stopAll();
            startTimer();
          }}
          style={{
            width: '100%',
            padding: 14,
            background: '#3EA6FF',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          계속 사용하기
        </button>

        <button
          onClick={() => {
            stopAll();
            onLogout();
          }}
          style={{
            width: '100%',
            padding: 12,
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: '#aaa',
            fontFamily: 'inherit',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          지금 로그아웃
        </button>
      </div>
    </div>
  );
}
