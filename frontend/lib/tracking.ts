// URL에서 ref 파라미터 캡처 → sessionStorage 저장
export function captureTrackingCode(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    sessionStorage.setItem('tracking_code', ref);
  }
  return ref || sessionStorage.getItem('tracking_code');
}

// 저장된 tracking code 반환
export function getTrackingCode(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('tracking_code');
}

// tracking code 삭제 (회원가입 완료 후 등)
export function clearTrackingCode(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('tracking_code');
}
