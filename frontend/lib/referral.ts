const REF_STORAGE_KEY = 'ref_code';

/** URL의 ?ref= 파라미터를 읽어서 localStorage에 저장 */
export function captureRefCode(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');

  if (ref) {
    localStorage.setItem(REF_STORAGE_KEY, ref);
  }

  return ref || localStorage.getItem(REF_STORAGE_KEY);
}

/** 저장된 레퍼럴 코드 가져오기 */
export function getRefCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REF_STORAGE_KEY);
}
