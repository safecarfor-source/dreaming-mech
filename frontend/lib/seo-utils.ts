import type { OperatingHours, Review } from '@/types';
import { SIDO_SHORT_NAMES, ALL_REGIONS } from '@/lib/regions';

// schema.org 요일 매핑
const DAY_MAP: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * operatingHours → schema.org OpeningHoursSpecification 배열
 */
export function buildOpeningHoursSpec(
  hours: OperatingHours | null | undefined,
): Record<string, unknown>[] | null {
  if (!hours) return null;

  const specs: Record<string, unknown>[] = [];
  for (const [day, time] of Object.entries(hours)) {
    if (!time || !DAY_MAP[day]) continue;
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_MAP[day],
      opens: time.open,
      closes: time.close,
    });
  }
  return specs.length > 0 ? specs : null;
}

/**
 * 리뷰 → schema.org AggregateRating (3개 이상일 때만)
 */
export function buildAggregateRating(
  reviews: Review[] | undefined,
): Record<string, unknown> | null {
  if (!reviews || reviews.length < 3) return null;

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avg = Math.round((total / reviews.length) * 10) / 10;

  return {
    '@type': 'AggregateRating',
    ratingValue: avg,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * 전문분야 → schema.org OfferCatalog
 */
export function buildOfferCatalog(
  specialties: string[] | undefined,
): Record<string, unknown> | null {
  if (!specialties || specialties.length === 0) return null;

  return {
    '@type': 'OfferCatalog',
    name: '정비 서비스',
    itemListElement: specialties.map((s) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: s,
      },
    })),
  };
}

/**
 * location 문자열 → PostalAddress 파싱
 * "인천광역시 부평구" → { addressRegion: "인천", addressLocality: "부평구" }
 * "인천 부평구" → { addressRegion: "인천", addressLocality: "부평구" }
 */
export function parseLocationToAddress(location: string): {
  addressRegion: string;
  addressLocality: string;
} {
  const parts = location.split(/\s+/);
  if (parts.length >= 2) {
    const sido = parts[0];
    const sigungu = parts.slice(1).join(' ');
    const shortSido = SIDO_SHORT_NAMES[sido] || sido;
    return { addressRegion: shortSido, addressLocality: sigungu };
  }
  return { addressRegion: location, addressLocality: '' };
}

/**
 * location → 지역 랜딩페이지 링크 생성
 * "인천광역시 부평구" → { sidoLink, sigunguLink }
 */
export function getRegionLinks(location: string): {
  sidoLink: { href: string; label: string } | null;
  sigunguLink: { href: string; label: string } | null;
} {
  const parts = location.split(/\s+/);
  if (parts.length < 2) return { sidoLink: null, sigunguLink: null };

  const sidoRaw = parts[0];
  const sigungu = parts.slice(1).join(' ');

  // 약칭 변환
  const sidoShort = SIDO_SHORT_NAMES[sidoRaw] || sidoRaw;

  // ALL_REGIONS에서 매칭 확인
  const regionMatch = ALL_REGIONS.find(
    (r) => (r.sido === sidoRaw || SIDO_SHORT_NAMES[r.sido] === sidoShort) && r.sigungu === sigungu,
  );

  const sidoLink = {
    href: `/region/${encodeURIComponent(sidoShort)}`,
    label: `${sidoShort} 전체 정비소`,
  };

  const sigunguLink = regionMatch
    ? {
        href: `/region/${encodeURIComponent(sidoShort)}/${encodeURIComponent(sigungu)}`,
        label: `${sidoShort} ${sigungu} 정비소`,
      }
    : null;

  return { sidoLink, sigunguLink };
}

/**
 * 주력 서비스 추출 (첫 번째 전문분야 또는 기본값)
 */
export function getPrimaryService(specialties?: string[]): string {
  return specialties?.[0] || '자동차 정비';
}

/**
 * location에서 짧은 지역명 추출
 * "인천광역시 부평구" → "부평"
 */
export function getShortLocation(location: string): string {
  const parts = location.split(/\s+/);
  const last = parts[parts.length - 1];
  return last.replace(/시$|군$|구$/, '');
}
