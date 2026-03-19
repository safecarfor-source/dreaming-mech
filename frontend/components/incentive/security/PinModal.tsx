'use client';

/**
 * PinModal.tsx
 *
 * 역할(manager, director, viewer) 로그인 후 개인 탭 잠금 해제용 PIN 입력 모달.
 * admin / 662 계정은 이 모달을 사용하지 않는다.
 *
 * 원본 HTML: showPinModal() / closePinModal() / submitPin() / getPinHash() / setPinHash()
 *
 * IncentiveLayout 통합 방법:
 *   1. import PinModal from '@/components/incentive/security/PinModal';
 *   2. const [pinOpen, setPinOpen] = useState(false);
 *      const [pinUnlocked, setPinUnlocked] = useState(false);
 *   3. user 로그인 완료 시 (needsBlurForUser(user) 가 true면) setPinOpen(true);
 *   4. <PinModal
 *        open={pinOpen}
 *        loginId={user.loginId}
 *        onUnlock={() => { setPinUnlocked(true); setPinOpen(false); }}
 *        onCancel={() => setPinOpen(false)}
 *      />
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── 로컬스토리지 PIN 헬퍼 ────────────────────────────────────────────────────
// 기존 HTML의 DEFAULT_PINS, getPinHash, setPinHash 1:1 변환
const DEFAULT_PINS: Record<string, string> = { kkj: '0000', ljs: '1111' };

function storageKey(loginId: string) {
  return 'inc_pin_' + loginId;
}

function getPinHash(loginId: string): string | null {
  if (typeof window === 'undefined') return null;
  let stored = localStorage.getItem(storageKey(loginId));
  // 기본 PIN 있으면 자동 설정
  if (!stored && DEFAULT_PINS[loginId]) {
    stored = btoa(DEFAULT_PINS[loginId]);
    localStorage.setItem(storageKey(loginId), stored);
  }
  return stored;
}

function setPinHash(loginId: string, pin: string) {
  localStorage.setItem(storageKey(loginId), btoa(pin));
}

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface PinModalProps {
  open: boolean;
  loginId: string;
  /** PIN 검증(또는 설정) 성공 시 호출 */
  onUnlock: () => void;
  /** 취소 버튼 클릭 시 호출 */
  onCancel: () => void;
  /** 3회 실패 시 호출 — 호출하는 쪽에서 로그아웃 처리 */
  onMaxFailure?: () => void;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

const PIN_LENGTH = 4;
const MAX_FAIL = 3;
const ACCENT = '#3EA6FF';

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function PinModal({
  open,
  loginId,
  onUnlock,
  onCancel,
  onMaxFailure,
}: PinModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  // setup: PIN 없을 때 최초 설정 모드, verify: 이후 인증 모드
  const [mode, setMode] = useState<'setup' | 'verify'>('verify');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (!open) return;
    const hasPin = !!getPinHash(loginId);
    setMode(hasPin ? 'verify' : 'setup');
    setDigits(Array(PIN_LENGTH).fill(''));
    setError('');
    // 첫 번째 칸에 포커스
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }, [open, loginId]);

  // 마지막 칸 입력 시 자동 제출
  useEffect(() => {
    const filled = digits.every((d) => d.length === 1);
    if (filled) {
      // 모바일 딜레이 대응
      const t = setTimeout(() => handleSubmit(), 50);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const handleDigitInput = useCallback(
    (index: number, value: string) => {
      const single = value.replace(/\D/g, '').slice(-1);
      const next = [...digits];
      next[index] = single;
      setDigits(next);
      // 다음 칸으로 이동
      if (single && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  function handleSubmit() {
    const pin = digits.join('');
    if (pin.length < PIN_LENGTH) {
      setError(`${PIN_LENGTH}자리를 모두 입력하세요`);
      return;
    }

    if (mode === 'setup') {
      setPinHash(loginId, pin);
      onUnlock();
      return;
    }

    // verify 모드
    const stored = getPinHash(loginId);
    if (btoa(pin) === stored) {
      setFailCount(0);
      onUnlock();
    } else {
      const next = failCount + 1;
      setFailCount(next);
      if (next >= MAX_FAIL) {
        setError('PIN 3회 오류 — 자동 로그아웃됩니다');
        setTimeout(() => {
          onMaxFailure?.();
        }, 1000);
        return;
      }
      setError(`PIN이 틀렸습니다 (${next}/${MAX_FAIL}회)`);
      setDigits(Array(PIN_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 10);
    }
  }

  if (!open) return null;

  const title = mode === 'setup' ? 'PIN 설정' : 'PIN 입력';
  const subtitle =
    mode === 'setup'
      ? `${PIN_LENGTH}자리 숫자를 설정하세요`
      : `${PIN_LENGTH}자리 PIN을 입력하세요`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        {/* 자물쇠 아이콘 */}
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {mode === 'setup' ? '🔑' : '🔒'}
        </div>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 6,
            color: '#1A1A1A',
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          {subtitle}
        </p>

        {/* 숫자 입력 칸 */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => {
                // 모바일 터치 시 기존 값 클리어
                const next = [...digits];
                next[i] = '';
                setDigits(next);
              }}
              style={{
                width: 52,
                height: 60,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 700,
                border: `2px solid ${d ? ACCENT : '#E0E0E0'}`,
                borderRadius: 12,
                background: d ? '#EBF5FF' : '#F5F5F5',
                color: '#1A1A1A',
                outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
                // 모바일: 숫자 키패드 강제
                caretColor: 'transparent',
              }}
            />
          ))}
        </div>

        {/* 에러 메시지 */}
        <div
          style={{
            minHeight: 20,
            marginBottom: 20,
            fontSize: 13,
            color: '#FF4E45',
            fontWeight: 500,
          }}
        >
          {error}
        </div>

        {/* 모바일 숫자 키패드 */}
        <Keypad
          onPress={(num) => {
            const idx = digits.findIndex((d) => !d);
            if (idx !== -1) handleDigitInput(idx, num);
          }}
          onDelete={() => {
            // 마지막으로 채워진 칸 지우기
            const idx = [...digits].reverse().findIndex((d) => d);
            if (idx !== -1) {
              const realIdx = PIN_LENGTH - 1 - idx;
              const next = [...digits];
              next[realIdx] = '';
              setDigits(next);
              inputRefs.current[realIdx]?.focus();
            }
          }}
        />

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 12,
              background: 'none',
              border: '1px solid #E0E0E0',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: 12,
              background: ACCENT,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 모바일 숫자 키패드 ────────────────────────────────────────────────────────

interface KeypadProps {
  onPress: (num: string) => void;
  onDelete: () => void;
}

function Keypad({ onPress, onDelete }: KeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        marginTop: 4,
      }}
    >
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />;
        const isDelete = k === '⌫';
        return (
          <button
            key={i}
            onClick={() => (isDelete ? onDelete() : onPress(k))}
            style={{
              padding: '14px 0',
              fontSize: isDelete ? 18 : 20,
              fontWeight: isDelete ? 400 : 600,
              background: isDelete ? '#FFE9E8' : '#F5F5F5',
              color: isDelete ? '#FF4E45' : '#1A1A1A',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.1s',
            }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
