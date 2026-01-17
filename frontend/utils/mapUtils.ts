// 유튜브 쇼츠 URL을 임베디드 URL로 변환
export function convertShortsUrl(url: string): string {
  const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  return url;
}

// 좌표 유효성 검증
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// 주소 포맷팅
export function formatAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}
