'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface EditableMapProps {
  center: { lat: number; lng: number };
  marker: { lat: number; lng: number };
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function EditableMap({
  center,
  marker,
  onMarkerDragEnd,
}: EditableMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // 지도 초기화
  useEffect(() => {
    // 스크립트가 이미 로드되어 있는지 확인
    const naver = (window as any).naver;
    if (naver && naver.maps && !isLoaded) {
      setIsLoaded(true);
      return;
    }

    if (!isLoaded || !mapRef.current || map) return;
    if (!naver || !naver.maps) return;

    const mapInstance = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: 16,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
    });

    setMap(mapInstance);
  }, [isLoaded, map]);

  // 마커 생성 및 업데이트
  useEffect(() => {
    if (!map || !marker) return;

    const naver = (window as any).naver;
    const position = new naver.maps.LatLng(marker.lat, marker.lng);

    if (markerRef.current) {
      markerRef.current.setPosition(position);
      map.setCenter(position);
    } else {
      const newMarker = new naver.maps.Marker({
        position,
        map,
        draggable: true,
      });

      naver.maps.Event.addListener(newMarker, 'dragend', (e: any) => {
        const newLat = e.coord.lat();
        const newLng = e.coord.lng();
        onMarkerDragEnd(newLat, newLng);
      });

      markerRef.current = newMarker;
    }
  }, [map, marker, onMarkerDragEnd]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500">네이버 지도 API 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
        onLoad={handleLoad}
      />

      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-xl border-2 border-gray-200 overflow-hidden"
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
