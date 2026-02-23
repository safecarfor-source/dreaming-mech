'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerAuthApi, serviceInquiryApi } from '@/lib/api';
import { useCustomerStore } from '@/lib/customer-store';
import type { ServiceType } from '@/types';

interface TempInquiryData {
  regionSido: string;
  regionSigungu: string;
  serviceType: ServiceType;
  phone: string;
  description?: string;
}

export default function InquiryCallbackPage() {
  const router = useRouter();
  const login = useCustomerStore((state) => state.login);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 1. sessionStorage에서 임시 문의 데이터 복원
        const tempDataStr = sessionStorage.getItem('temp-inquiry-data');
        if (!tempDataStr) {
          setErrorMessage('문의 데이터를 찾을 수 없습니다.');
          setStatus('error');
          return;
        }

        const tempData: TempInquiryData = JSON.parse(tempDataStr);

        // 2. 고객 프로필 조회
        const profileRes = await customerAuthApi.getProfile();
        const customer = profileRes.data.data;
        login(customer);

        // 3. 서비스 문의 생성
        await serviceInquiryApi.create({
          regionSido: tempData.regionSido,
          regionSigungu: tempData.regionSigungu,
          serviceType: tempData.serviceType,
          phone: tempData.phone,
          description: tempData.description,
        });

        // 4. sessionStorage 정리
        sessionStorage.removeItem('temp-inquiry-data');

        setStatus('success');

        // 5. 메인 페이지로 이동 (완료 상태 전달)
        setTimeout(() => {
          router.push('/?inquiry=success');
        }, 1500);
      } catch (error) {
        console.error('문의 접수 실패:', error);
        setErrorMessage('문의 접수 중 오류가 발생했습니다.');
        setStatus('error');
      }
    };

    processCallback();
  }, [login, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">문의 접수 중...</h2>
            <p className="text-gray-500">잠시만 기다려주세요.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">접수 완료!</h2>
            <p className="text-gray-500">곧 꿈꾸는정비사가 연락드리겠습니다.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#EF4444] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-500 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#7C4DFF] text-white px-6 py-2 rounded-lg hover:bg-[#6D3FE0] transition-colors"
            >
              처음부터 다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
