'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // 네이버 지도 API 인증 실패 처리
  useEffect(() => {
    (window as any).navermap_authFailure = function() {
      console.error('네이버 지도 API 인증 실패');
      setAuthError(true);
      setIsLoading(false);
    };

    return () => {
      delete (window as any).navermap_authFailure;
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || map) return;

    const checkAndInitMap = () => {
      const naver = (window as any).naver;
      if (!naver || !naver.maps) {
        // 아직 로드되지 않았으면 100ms 후 재시도
        setTimeout(checkAndInitMap, 100);
        return;
      }

      try {
        const mapInstance = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(center.lat, center.lng),
          zoom: 16,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT,
          },
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (e) {
        console.error('Map initialization error:', e);
        setIsLoading(false);
      }
    };

    checkAndInitMap();
  }, [center.lat, center.lng, map]);

  // 마커 생성 및 업데이트
  useEffect(() => {
    if (!map || !marker) return;

    const naver = (window as any).naver;
    if (!naver || !naver.maps) return;

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

  if (authError) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-red-50 flex items-center justify-center border-2 border-dashed border-red-300">
        <p className="text-red-600">지도 API 인증에 실패했습니다. 관리자에게 문의하세요.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-xl border-2 border-gray-200 overflow-hidden"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
