'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  lat: number;
  lng: number;
  name: string;
}

// Naver Maps 타입 (외부 스크립트로 로드되므로 any 사용)

export default function NaverMapView({ lat, lng, name }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 네이버 지도 API 인증 실패 처리
  useEffect(() => {
    (window as any).navermap_authFailure = function() {
      console.error('네이버 지도 API 인증 실패');
      setError('지도 API 인증에 실패했습니다. 관리자에게 문의하세요.');
      setIsLoading(false);
    };

    return () => {
      delete (window as any).navermap_authFailure;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // 스크립트가 로드될 때까지 대기 (최대 50회 = 5초)
    let retryCount = 0;
    const maxRetries = 50;

    const checkAndInitMap = () => {
      if (!window.naver || !window.naver.maps) {
        if (retryCount++ < maxRetries) {
          setTimeout(checkAndInitMap, 100);
        } else {
          setError('지도를 불러올 수 없습니다. 새로고침해주세요.');
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(false);

        const map = new window.naver.maps.Map(mapRef.current!, {
          center: new window.naver.maps.LatLng(lat, lng),
          zoom: 17,
          zoomControl: true,
          zoomControlOptions: {
            position: (window.naver.maps as any).Position.TOP_RIGHT,
          },
        });

        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map,
          title: name,
        });
      } catch (e) {
        console.error('Map initialization error:', e);
        setError('지도를 표시하는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    checkAndInitMap();
  }, [lat, lng, name]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="w-full md:w-1/2 mx-auto h-[300px] md:h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">네이버 지도 API 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full md:w-1/2 mx-auto h-[300px] md:h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full md:w-1/2 mx-auto h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-gray-100">
      <div ref={mapRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
