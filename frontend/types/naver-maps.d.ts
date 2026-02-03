/**
 * Naver Maps API 타입 정의
 * @see https://navermaps.github.io/maps.js.ncp/docs/
 */

declare namespace naver {
  namespace maps {
    // 좌표 타입
    interface LatLng {
      x: number;
      y: number;
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    // 지도 옵션
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      zoomControl?: boolean;
      zoomControlOptions?: {
        position?: any;
      };
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      logoControl?: boolean;
      mapDataControl?: boolean;
      draggable?: boolean;
      scrollWheel?: boolean;
      disableDoubleClickZoom?: boolean;
      disableDoubleTapZoom?: boolean;
      disableTwoFingerTapZoom?: boolean;
      tileTransition?: boolean;
    }

    // 지도 클래스
    class Map {
      constructor(element: HTMLElement | string, options?: MapOptions);
      setCenter(center: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
      setZoom(zoom: number): void;
      getZoom(): number;
      panTo(coord: LatLng | LatLngLiteral, transition?: number): void;
      destroy(): void;
      refresh(): void;
    }

    // 마커 옵션
    interface MarkerOptions {
      map?: Map;
      position: LatLng | LatLngLiteral;
      icon?: string | ImageIcon;
      title?: string;
      draggable?: boolean;
      clickable?: boolean;
      animation?: number;
      zIndex?: number;
    }

    // 아이콘
    interface ImageIcon {
      url: string;
      size?: Size;
      scaledSize?: Size;
      origin?: Point;
      anchor?: Point;
    }

    // 마커 클래스
    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng;
      setIcon(icon: string | ImageIcon): void;
      setDraggable(draggable: boolean): void;
      addListener(eventName: string, listener: (event: any) => void): MapEventListener;
    }

    // 사이즈
    class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }

    // 포인트
    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    // 이벤트 리스너
    interface MapEventListener {
      remove(): void;
    }

    // Event 네임스페이스
    namespace Event {
      function addListener(
        target: any,
        eventName: string,
        listener: (event: any) => void
      ): MapEventListener;
      function removeListener(listener: MapEventListener): void;
    }
  }
}

declare global {
  interface Window {
    naver: typeof naver;
  }
}

export {};
