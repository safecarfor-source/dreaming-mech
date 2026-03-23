import { redirect } from 'next/navigation';

// /pro/login → /pro 랜딩 페이지로 리다이렉트
// 카카오 로그인은 /pro 랜딩의 "카카오로 1초 가입" 버튼에서 직접 처리
export default function ProLoginPage() {
  redirect('/pro');
}
