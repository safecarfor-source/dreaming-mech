import type { Mechanic } from '@/types';

export interface Region {
  id: string;
  name: string;
  fullName: string;
  locationPrefixes: string[];
}

export const REGIONS: Region[] = [
  { id: 'seoul', name: '서울', fullName: '서울특별시', locationPrefixes: ['서울'] },
  { id: 'busan', name: '부산', fullName: '부산광역시', locationPrefixes: ['부산'] },
  { id: 'daegu', name: '대구', fullName: '대구광역시', locationPrefixes: ['대구'] },
  { id: 'incheon', name: '인천', fullName: '인천광역시', locationPrefixes: ['인천'] },
  { id: 'ulsan', name: '울산', fullName: '울산광역시', locationPrefixes: ['울산'] },
  { id: 'gyeonggi', name: '경기', fullName: '경기도', locationPrefixes: ['경기'] },
  { id: 'gangwon', name: '강원', fullName: '강원특별자치도', locationPrefixes: ['강원'] },
  { id: 'chungbuk', name: '충북', fullName: '충청북도', locationPrefixes: ['충북'] },
  { id: 'chungnam', name: '충남', fullName: '충청남도', locationPrefixes: ['충남', '대전', '세종'] },
  { id: 'jeonbuk', name: '전북', fullName: '전북특별자치도', locationPrefixes: ['전북'] },
  { id: 'jeonnam', name: '전남', fullName: '전라남도', locationPrefixes: ['전남', '광주'] },
  { id: 'gyeongbuk', name: '경북', fullName: '경상북도', locationPrefixes: ['경북'] },
  { id: 'gyeongnam', name: '경남', fullName: '경상남도', locationPrefixes: ['경남'] },
  { id: 'jeju', name: '제주', fullName: '제주특별자치도', locationPrefixes: ['제주'] },
];

/**
 * 정비소의 location 필드에서 지역 ID를 찾습니다.
 * 예: "전북 전주시" → "jeonbuk", "인천 남동구" → "incheon"
 */
export function getRegionForMechanic(location: string): string | null {
  const prefix = location.split(' ')[0];
  for (const region of REGIONS) {
    if (region.locationPrefixes.includes(prefix)) {
      return region.id;
    }
  }
  return null;
}

/**
 * 특정 지역의 정비소만 필터링합니다.
 */
export function getMechanicsByRegion(
  mechanics: Mechanic[],
  regionId: string,
): Mechanic[] {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return [];
  return mechanics.filter((m) => {
    const prefix = m.location.split(' ')[0];
    return region.locationPrefixes.includes(prefix);
  });
}

/**
 * 각 지역별 정비소 수를 계산합니다.
 */
export function countMechanicsByRegion(
  mechanics: Mechanic[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const region of REGIONS) {
    counts[region.id] = 0;
  }
  for (const m of mechanics) {
    const regionId = getRegionForMechanic(m.location);
    if (regionId) {
      counts[regionId]++;
    }
  }
  return counts;
}

/**
 * 지역 ID로 Region 객체를 찾습니다.
 */
export function getRegionById(regionId: string): Region | undefined {
  return REGIONS.find((r) => r.id === regionId);
}
