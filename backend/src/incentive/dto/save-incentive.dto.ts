export class SaveIncentiveDto {
  month: string; // "26년 3월"
  items: Record<string, { sales: number; qty: number }>;
}
