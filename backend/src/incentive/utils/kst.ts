// KST(한국 표준시, UTC+9) 기준 날짜/시간 유틸리티

export function nowKST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

export function todayKST(): string {
  const d = nowKST();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getYearMonthKST(): { year: number; month: number } {
  const d = nowKST();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
