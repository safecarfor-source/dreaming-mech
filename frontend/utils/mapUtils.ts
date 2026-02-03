/**
 * @deprecated Use validateAndGetYouTubeEmbedUrl from @/lib/youtube instead
 * Keeping for backward compatibility
 */
export function convertShortsUrl(url: string): string {
  // Import the secure version
  // This is a legacy wrapper maintained for compatibility
  const { validateAndGetYouTubeEmbedUrl } = require('@/lib/youtube');
  return validateAndGetYouTubeEmbedUrl(url) || url;
}

// 좌표 유효성 검증
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// 주소 포맷팅
export function formatAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}
