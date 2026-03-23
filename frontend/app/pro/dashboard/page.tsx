import { redirect } from 'next/navigation';

// /pro/dashboard → /owner로 리다이렉트
// 사장님 대시보드는 /owner에서 통합 관리
export default function ProDashboardPage() {
  redirect('/owner');
}
