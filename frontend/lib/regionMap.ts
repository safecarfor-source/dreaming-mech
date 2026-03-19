import type { Mechanic } from '@/types';
import { ALL_REGIONS } from './regions';

export interface Region {
  id: string;
  name: string;
  fullName: string;
  locationPrefixes: string[];
}

export const REGIONS: Region[] = [
  { id: 'seoul', name: '서울', fullName: '서울특별시', locationPrefixes: ['서울'] },
  { id: 'incheon', name: '인천', fullName: '인천광역시', locationPrefixes: ['인천'] },
  { id: 'gyeonggi', name: '경기', fullName: '경기도', locationPrefixes: ['경기'] },
  { id: 'gangwon', name: '강원', fullName: '강원특별자치도', locationPrefixes: ['강원'] },
  { id: 'sejong', name: '세종', fullName: '세종특별자치시', locationPrefixes: ['세종'] },
  { id: 'daejeon', name: '대전', fullName: '대전광역시', locationPrefixes: ['대전'] },
  { id: 'chungbuk', name: '충북', fullName: '충청북도', locationPrefixes: ['충북'] },
  { id: 'chungnam', name: '충남', fullName: '충청남도', locationPrefixes: ['충남'] },
  { id: 'jeonbuk', name: '전북', fullName: '전북특별자치도', locationPrefixes: ['전북'] },
  { id: 'jeonnam', name: '전남', fullName: '전라남도', locationPrefixes: ['전남'] },
  { id: 'gwangju', name: '광주', fullName: '광주광역시', locationPrefixes: ['광주'] },
  { id: 'gyeongbuk', name: '경북', fullName: '경상북도', locationPrefixes: ['경북'] },
  { id: 'gyeongnam', name: '경남', fullName: '경상남도', locationPrefixes: ['경남'] },
  { id: 'daegu', name: '대구', fullName: '대구광역시', locationPrefixes: ['대구'] },
  { id: 'busan', name: '부산', fullName: '부산광역시', locationPrefixes: ['부산'] },
  { id: 'ulsan', name: '울산', fullName: '울산광역시', locationPrefixes: ['울산'] },
  { id: 'jeju', name: '제주', fullName: '제주특별자치도', locationPrefixes: ['제주'] },
];

// sido → regionId 매핑 (ALL_REGIONS 활용)
const SIDO_TO_REGION: Record<string, string> = {
  '서울특별시': 'seoul', '인천광역시': 'incheon', '경기도': 'gyeonggi',
  '강원특별자치도': 'gangwon', '세종특별자치시': 'sejong', '대전광역시': 'daejeon',
  '충청북도': 'chungbuk', '충청남도': 'chungnam', '전북특별자치도': 'jeonbuk',
  '전라남도': 'jeonnam', '광주광역시': 'gwangju', '경상북도': 'gyeongbuk',
  '경상남도': 'gyeongnam', '대구광역시': 'daegu', '부산광역시': 'busan',
  '울산광역시': 'ulsan', '제주특별자치도': 'jeju',
};

// 구/군/시 이름 → regionId 역매핑 테이블 (ALL_REGIONS에서 자동 생성)
const SIGUNGU_TO_REGION: Record<string, string> = {};
for (const r of ALL_REGIONS) {
  const regionId = SIDO_TO_REGION[r.sido];
  if (regionId) {
    SIGUNGU_TO_REGION[r.sigungu] = regionId;
  }
}

/**
 * 정비소의 location 필드에서 지역 ID를 찾습니다.
 * 다양한 형식 지원:
 *   "서울 강남구" → "seoul" (접두사 매칭)
 *   "남동구"      → "incheon" (구/군/시 역매핑)
 *   "제주 제주시"  → "jeju" (접두사 매칭)
 *   "과천시"      → "gyeonggi" (시 역매핑)
 */
export function getRegionForMechanic(location: string): string | null {
  // 1차: 첫 단어로 시/도 매칭 ("서울 강남구", "인천 남동구", "경기 수원시")
  const prefix = location.split(' ')[0];
  for (const region of REGIONS) {
    if (region.locationPrefixes.includes(prefix)) {
      return region.id;
    }
  }

  // 2차: 구/군/시 이름으로 역매핑 ("남동구" → incheon, "과천시" → gyeonggi)
  const words = location.split(/[\s]+/);
  for (const word of words) {
    if (SIGUNGU_TO_REGION[word]) {
      return SIGUNGU_TO_REGION[word];
    }
  }

  // 3차: 부분 문자열 매칭 (최후 수단)
  for (const region of REGIONS) {
    if (region.locationPrefixes.some(p => location.includes(p))) {
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
