'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function TestMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('초기화 중...');

  // 네이버 지도 API 인증 실패 처리
  useEffect(() => {
    (window as any).navermap_authFailure = function() {
      console.error('네이버 지도 API 인증 실패');
      setError('API 인증 실패: CLIENT_ID가 유효하지 않거나 권한이 없습니다.');
      setStatus('인증 실패');
    };

    return () => {
      delete (window as any).navermap_authFailure;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      setStatus('스크립트 로딩 대기 중...');
      return;
    }

    setStatus('지도 생성 시도 중...');

    try {
      const naver = (window as any).naver;

      if (!naver) {
        setError('window.naver가 없습니다');
        setStatus('에러 발생');
        return;
      }

      if (!naver.maps) {
        setError('naver.maps가 없습니다');
        setStatus('에러 발생');
        return;
      }

      setStatus('지도 객체 생성 중...');

      // 서울시청 좌표
      const center = new naver.maps.LatLng(37.5666103, 126.9783882);

      const mapOptions = {
        center: center,
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      };

      const map = new naver.maps.Map(mapRef.current, mapOptions);
      setStatus('지도 생성 완료!');

      // 마커 추가
      const marker = new naver.maps.Marker({
        position: center,
        map: map,
        title: '서울시청',
      });

      setStatus('지도와 마커 생성 완료! ✅');
    } catch (e: any) {
      console.error('지도 생성 에러:', e);
      setError(`에러 발생: ${e.message}`);
      setStatus('에러 발생');
    }
  }, [isLoaded]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ API 키 없음</h1>
          <p className="text-gray-700">
            NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">🗺️ 네이버 지도 테스트</h1>
            <p className="text-purple-100">지도 API 작동 확인용 페이지</p>
          </div>

          {/* Status */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-700">상태: {status}</span>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">❌ 에러 발생</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 bg-white border-b">
            <h2 className="font-bold text-lg mb-3">📋 설정 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">Client ID:</span>
                <span className="text-gray-600">{clientId}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">스크립트 로드:</span>
                <span className={isLoaded ? 'text-green-600' : 'text-yellow-600'}>
                  {isLoaded ? '✅ 완료' : '⏳ 로딩 중...'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">중심 좌표:</span>
                <span className="text-gray-600">서울시청 (37.5666103, 126.9783882)</span>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative">
            <Script
              src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
              onLoad={() => {
                console.log('✅ 네이버 지도 스크립트 로드 완료');
                setIsLoaded(true);
              }}
              onError={(e) => {
                console.error('❌ 스크립트 로드 실패:', e);
                setError('스크립트 로드 실패');
                setStatus('스크립트 로드 실패');
              }}
            />

            <div
              ref={mapRef}
              className="w-full h-[600px] bg-gray-200"
            />

            {!isLoaded && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700 font-medium">지도 로딩 중...</p>
                <p className="text-sm text-gray-500 mt-2">네이버 지도 API를 불러오고 있습니다</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50">
            <p className="text-sm text-gray-600">
              💡 이 페이지는 네이버 지도 API가 정상 작동하는지 테스트하기 위한 페이지입니다.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              지도가 보이고 서울시청 마커가 표시되면 정상입니다.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-xs">
          <div className="mb-2 text-gray-400">🔍 디버그 정보</div>
          <div>window.naver: {typeof window !== 'undefined' ? typeof (window as any).naver : 'undefined (SSR)'}</div>
          <div>window.naver.maps: {typeof window !== 'undefined' ? typeof (window as any).naver?.maps : 'undefined (SSR)'}</div>
          <div>isLoaded: {isLoaded.toString()}</div>
          <div>error: {error || 'null'}</div>
        </div>
      </div>
    </div>
  );
}
