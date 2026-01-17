'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface Props {
  lat: number;
  lng: number;
  name: string;
}

export default function NaverMapView({ lat, lng, name }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      const naver = (window as any).naver;
      if (!naver || !naver.maps) {
        setError('네이버 지도를 불러올 수 없습니다.');
        return;
      }

      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(lat, lng),
        zoom: 17,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      });

      new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map,
        title: name,
      });
    } catch (e) {
      setError('지도를 표시하는 중 오류가 발생했습니다.');
    }
  }, [isLoaded, lat, lng, name]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="w-full h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">네이버 지도 API 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError('네이버 지도를 불러올 수 없습니다.')}
      />
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-2xl overflow-hidden bg-gray-100"
      />
    </>
  );
}
