/**
 * 정비소 slug 생성 유틸리티
 * location: "경기 의정부시" → "의정부"
 * name: "타이어프로 민락점" → "타이어프로민락점"
 * 결합: "의정부-타이어프로민락점"
 */
export function generateSlug(location: string, name: string): string {
  // location에서 시/군/구 단위 추출
  // "경기 의정부시" → "의정부시" → "의정부"
  // "서울 강남구" → "강남구" → "강남"
  const locationPart = location
    .split(' ')
    .pop() // 마지막 단어 (시/군/구)
    ?.replace(/시$|군$|구$/, '') // 시/군/구 접미사 제거
    ?? location;

  // name에서 공백 제거
  // "타이어프로 민락점" → "타이어프로민락점"
  const namePart = name.replace(/\s+/g, '');

  return `${locationPart}-${namePart}`;
}

/**
 * slug → 검색 가능한 키워드 추출 (URL 역방향 매핑용)
 * "의정부-타이어프로민락점" → { locationKeyword: "의정부", nameKeyword: "타이어프로민락점" }
 */
export function parseSlug(slug: string): { locationKeyword: string; nameKeyword: string } {
  const dashIndex = slug.indexOf('-');
  if (dashIndex === -1) {
    return { locationKeyword: '', nameKeyword: slug };
  }
  return {
    locationKeyword: slug.slice(0, dashIndex),
    nameKeyword: slug.slice(dashIndex + 1),
  };
}
