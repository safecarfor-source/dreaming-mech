export interface Region {
  sido: string;     // 시/도 (예: "경기도")
  sigungu: string;  // 시/군/구 (예: "수원시")
  display: string;  // 표시명 (예: "경기도 수원시")
  popular?: boolean; // 인기 지역
}

export const POPULAR_REGIONS: Region[] = [
  { sido: '인천광역시', sigungu: '서구', display: '인천 서구', popular: true },
  { sido: '충청남도', sigungu: '천안시', display: '충남 천안시', popular: true },
  { sido: '경기도', sigungu: '수원시', display: '경기 수원시', popular: true },
  { sido: '서울특별시', sigungu: '강남구', display: '서울 강남구', popular: true },
  { sido: '서울특별시', sigungu: '송파구', display: '서울 송파구', popular: true },
  { sido: '서울특별시', sigungu: '강서구', display: '서울 강서구', popular: true },
  { sido: '경기도', sigungu: '성남시', display: '경기 성남시', popular: true },
  { sido: '경기도', sigungu: '용인시', display: '경기 용인시', popular: true },
  { sido: '부산광역시', sigungu: '해운대구', display: '부산 해운대구', popular: true },
  { sido: '대구광역시', sigungu: '수성구', display: '대구 수성구', popular: true },
  { sido: '광주광역시', sigungu: '서구', display: '광주 서구', popular: true },
  { sido: '대전광역시', sigungu: '유성구', display: '대전 유성구', popular: true },
  { sido: '경기도', sigungu: '고양시', display: '경기 고양시', popular: true },
  { sido: '경기도', sigungu: '화성시', display: '경기 화성시', popular: true },
  { sido: '경기도', sigungu: '안양시', display: '경기 안양시', popular: true },
  { sido: '울산광역시', sigungu: '남구', display: '울산 남구', popular: true },
  { sido: '세종특별자치시', sigungu: '세종시', display: '세종시', popular: true },
  { sido: '경기도', sigungu: '부천시', display: '경기 부천시', popular: true },
  { sido: '경기도', sigungu: '남양주시', display: '경기 남양주시', popular: true },
  { sido: '인천광역시', sigungu: '남동구', display: '인천 남동구', popular: true },
];

export const ALL_REGIONS: Region[] = [
  // 서울특별시 (25개 구)
  { sido: '서울특별시', sigungu: '강남구', display: '서울 강남구' },
  { sido: '서울특별시', sigungu: '강동구', display: '서울 강동구' },
  { sido: '서울특별시', sigungu: '강북구', display: '서울 강북구' },
  { sido: '서울특별시', sigungu: '강서구', display: '서울 강서구' },
  { sido: '서울특별시', sigungu: '관악구', display: '서울 관악구' },
  { sido: '서울특별시', sigungu: '광진구', display: '서울 광진구' },
  { sido: '서울특별시', sigungu: '구로구', display: '서울 구로구' },
  { sido: '서울특별시', sigungu: '금천구', display: '서울 금천구' },
  { sido: '서울특별시', sigungu: '노원구', display: '서울 노원구' },
  { sido: '서울특별시', sigungu: '도봉구', display: '서울 도봉구' },
  { sido: '서울특별시', sigungu: '동대문구', display: '서울 동대문구' },
  { sido: '서울특별시', sigungu: '동작구', display: '서울 동작구' },
  { sido: '서울특별시', sigungu: '마포구', display: '서울 마포구' },
  { sido: '서울특별시', sigungu: '서대문구', display: '서울 서대문구' },
  { sido: '서울특별시', sigungu: '서초구', display: '서울 서초구' },
  { sido: '서울특별시', sigungu: '성동구', display: '서울 성동구' },
  { sido: '서울특별시', sigungu: '성북구', display: '서울 성북구' },
  { sido: '서울특별시', sigungu: '송파구', display: '서울 송파구' },
  { sido: '서울특별시', sigungu: '양천구', display: '서울 양천구' },
  { sido: '서울특별시', sigungu: '영등포구', display: '서울 영등포구' },
  { sido: '서울특별시', sigungu: '용산구', display: '서울 용산구' },
  { sido: '서울특별시', sigungu: '은평구', display: '서울 은평구' },
  { sido: '서울특별시', sigungu: '종로구', display: '서울 종로구' },
  { sido: '서울특별시', sigungu: '중구', display: '서울 중구' },
  { sido: '서울특별시', sigungu: '중랑구', display: '서울 중랑구' },

  // 부산광역시 (16개 구/군)
  { sido: '부산광역시', sigungu: '강서구', display: '부산 강서구' },
  { sido: '부산광역시', sigungu: '금정구', display: '부산 금정구' },
  { sido: '부산광역시', sigungu: '기장군', display: '부산 기장군' },
  { sido: '부산광역시', sigungu: '남구', display: '부산 남구' },
  { sido: '부산광역시', sigungu: '동구', display: '부산 동구' },
  { sido: '부산광역시', sigungu: '동래구', display: '부산 동래구' },
  { sido: '부산광역시', sigungu: '부산진구', display: '부산 부산진구' },
  { sido: '부산광역시', sigungu: '북구', display: '부산 북구' },
  { sido: '부산광역시', sigungu: '사상구', display: '부산 사상구' },
  { sido: '부산광역시', sigungu: '사하구', display: '부산 사하구' },
  { sido: '부산광역시', sigungu: '서구', display: '부산 서구' },
  { sido: '부산광역시', sigungu: '수영구', display: '부산 수영구' },
  { sido: '부산광역시', sigungu: '연제구', display: '부산 연제구' },
  { sido: '부산광역시', sigungu: '영도구', display: '부산 영도구' },
  { sido: '부산광역시', sigungu: '중구', display: '부산 중구' },
  { sido: '부산광역시', sigungu: '해운대구', display: '부산 해운대구' },

  // 대구광역시 (8개 구/군)
  { sido: '대구광역시', sigungu: '남구', display: '대구 남구' },
  { sido: '대구광역시', sigungu: '달서구', display: '대구 달서구' },
  { sido: '대구광역시', sigungu: '달성군', display: '대구 달성군' },
  { sido: '대구광역시', sigungu: '동구', display: '대구 동구' },
  { sido: '대구광역시', sigungu: '북구', display: '대구 북구' },
  { sido: '대구광역시', sigungu: '서구', display: '대구 서구' },
  { sido: '대구광역시', sigungu: '수성구', display: '대구 수성구' },
  { sido: '대구광역시', sigungu: '중구', display: '대구 중구' },

  // 인천광역시 (10개 구/군)
  { sido: '인천광역시', sigungu: '강화군', display: '인천 강화군' },
  { sido: '인천광역시', sigungu: '계양구', display: '인천 계양구' },
  { sido: '인천광역시', sigungu: '남동구', display: '인천 남동구' },
  { sido: '인천광역시', sigungu: '동구', display: '인천 동구' },
  { sido: '인천광역시', sigungu: '미추홀구', display: '인천 미추홀구' },
  { sido: '인천광역시', sigungu: '부평구', display: '인천 부평구' },
  { sido: '인천광역시', sigungu: '서구', display: '인천 서구' },
  { sido: '인천광역시', sigungu: '연수구', display: '인천 연수구' },
  { sido: '인천광역시', sigungu: '옹진군', display: '인천 옹진군' },
  { sido: '인천광역시', sigungu: '중구', display: '인천 중구' },

  // 광주광역시 (5개 구)
  { sido: '광주광역시', sigungu: '광산구', display: '광주 광산구' },
  { sido: '광주광역시', sigungu: '남구', display: '광주 남구' },
  { sido: '광주광역시', sigungu: '동구', display: '광주 동구' },
  { sido: '광주광역시', sigungu: '북구', display: '광주 북구' },
  { sido: '광주광역시', sigungu: '서구', display: '광주 서구' },

  // 대전광역시 (5개 구)
  { sido: '대전광역시', sigungu: '대덕구', display: '대전 대덕구' },
  { sido: '대전광역시', sigungu: '동구', display: '대전 동구' },
  { sido: '대전광역시', sigungu: '서구', display: '대전 서구' },
  { sido: '대전광역시', sigungu: '유성구', display: '대전 유성구' },
  { sido: '대전광역시', sigungu: '중구', display: '대전 중구' },

  // 울산광역시 (5개 구/군)
  { sido: '울산광역시', sigungu: '남구', display: '울산 남구' },
  { sido: '울산광역시', sigungu: '동구', display: '울산 동구' },
  { sido: '울산광역시', sigungu: '북구', display: '울산 북구' },
  { sido: '울산광역시', sigungu: '울주군', display: '울산 울주군' },
  { sido: '울산광역시', sigungu: '중구', display: '울산 중구' },

  // 세종특별자치시
  { sido: '세종특별자치시', sigungu: '세종시', display: '세종시' },

  // 경기도 (주요 시)
  { sido: '경기도', sigungu: '수원시', display: '경기 수원시' },
  { sido: '경기도', sigungu: '성남시', display: '경기 성남시' },
  { sido: '경기도', sigungu: '용인시', display: '경기 용인시' },
  { sido: '경기도', sigungu: '고양시', display: '경기 고양시' },
  { sido: '경기도', sigungu: '화성시', display: '경기 화성시' },
  { sido: '경기도', sigungu: '안양시', display: '경기 안양시' },
  { sido: '경기도', sigungu: '부천시', display: '경기 부천시' },
  { sido: '경기도', sigungu: '남양주시', display: '경기 남양주시' },
  { sido: '경기도', sigungu: '안산시', display: '경기 안산시' },
  { sido: '경기도', sigungu: '평택시', display: '경기 평택시' },
  { sido: '경기도', sigungu: '시흥시', display: '경기 시흥시' },
  { sido: '경기도', sigungu: '파주시', display: '경기 파주시' },
  { sido: '경기도', sigungu: '의정부시', display: '경기 의정부시' },
  { sido: '경기도', sigungu: '김포시', display: '경기 김포시' },
  { sido: '경기도', sigungu: '광주시', display: '경기 광주시' },
  { sido: '경기도', sigungu: '광명시', display: '경기 광명시' },
  { sido: '경기도', sigungu: '군포시', display: '경기 군포시' },
  { sido: '경기도', sigungu: '하남시', display: '경기 하남시' },
  { sido: '경기도', sigungu: '오산시', display: '경기 오산시' },
  { sido: '경기도', sigungu: '양주시', display: '경기 양주시' },
  { sido: '경기도', sigungu: '이천시', display: '경기 이천시' },
  { sido: '경기도', sigungu: '구리시', display: '경기 구리시' },
  { sido: '경기도', sigungu: '안성시', display: '경기 안성시' },
  { sido: '경기도', sigungu: '포천시', display: '경기 포천시' },
  { sido: '경기도', sigungu: '의왕시', display: '경기 의왕시' },
  { sido: '경기도', sigungu: '양평군', display: '경기 양평군' },
  { sido: '경기도', sigungu: '여주시', display: '경기 여주시' },
  { sido: '경기도', sigungu: '동두천시', display: '경기 동두천시' },
  { sido: '경기도', sigungu: '과천시', display: '경기 과천시' },
  { sido: '경기도', sigungu: '가평군', display: '경기 가평군' },
  { sido: '경기도', sigungu: '연천군', display: '경기 연천군' },

  // 강원특별자치도 (주요 시/군)
  { sido: '강원특별자치도', sigungu: '춘천시', display: '강원 춘천시' },
  { sido: '강원특별자치도', sigungu: '원주시', display: '강원 원주시' },
  { sido: '강원특별자치도', sigungu: '강릉시', display: '강원 강릉시' },
  { sido: '강원특별자치도', sigungu: '동해시', display: '강원 동해시' },
  { sido: '강원특별자치도', sigungu: '태백시', display: '강원 태백시' },
  { sido: '강원특별자치도', sigungu: '속초시', display: '강원 속초시' },
  { sido: '강원특별자치도', sigungu: '삼척시', display: '강원 삼척시' },
  { sido: '강원특별자치도', sigungu: '홍천군', display: '강원 홍천군' },
  { sido: '강원특별자치도', sigungu: '횡성군', display: '강원 횡성군' },
  { sido: '강원특별자치도', sigungu: '영월군', display: '강원 영월군' },
  { sido: '강원특별자치도', sigungu: '평창군', display: '강원 평창군' },
  { sido: '강원특별자치도', sigungu: '정선군', display: '강원 정선군' },
  { sido: '강원특별자치도', sigungu: '철원군', display: '강원 철원군' },
  { sido: '강원특별자치도', sigungu: '화천군', display: '강원 화천군' },
  { sido: '강원특별자치도', sigungu: '양구군', display: '강원 양구군' },
  { sido: '강원특별자치도', sigungu: '인제군', display: '강원 인제군' },
  { sido: '강원특별자치도', sigungu: '고성군', display: '강원 고성군' },
  { sido: '강원특별자치도', sigungu: '양양군', display: '강원 양양군' },

  // 충청북도 (주요 시/군)
  { sido: '충청북도', sigungu: '청주시', display: '충북 청주시' },
  { sido: '충청북도', sigungu: '충주시', display: '충북 충주시' },
  { sido: '충청북도', sigungu: '제천시', display: '충북 제천시' },
  { sido: '충청북도', sigungu: '보은군', display: '충북 보은군' },
  { sido: '충청북도', sigungu: '옥천군', display: '충북 옥천군' },
  { sido: '충청북도', sigungu: '영동군', display: '충북 영동군' },
  { sido: '충청북도', sigungu: '증평군', display: '충북 증평군' },
  { sido: '충청북도', sigungu: '진천군', display: '충북 진천군' },
  { sido: '충청북도', sigungu: '괴산군', display: '충북 괴산군' },
  { sido: '충청북도', sigungu: '음성군', display: '충북 음성군' },
  { sido: '충청북도', sigungu: '단양군', display: '충북 단양군' },

  // 충청남도 (주요 시/군)
  { sido: '충청남도', sigungu: '천안시', display: '충남 천안시' },
  { sido: '충청남도', sigungu: '공주시', display: '충남 공주시' },
  { sido: '충청남도', sigungu: '보령시', display: '충남 보령시' },
  { sido: '충청남도', sigungu: '아산시', display: '충남 아산시' },
  { sido: '충청남도', sigungu: '서산시', display: '충남 서산시' },
  { sido: '충청남도', sigungu: '논산시', display: '충남 논산시' },
  { sido: '충청남도', sigungu: '계룡시', display: '충남 계룡시' },
  { sido: '충청남도', sigungu: '당진시', display: '충남 당진시' },
  { sido: '충청남도', sigungu: '금산군', display: '충남 금산군' },
  { sido: '충청남도', sigungu: '부여군', display: '충남 부여군' },
  { sido: '충청남도', sigungu: '서천군', display: '충남 서천군' },
  { sido: '충청남도', sigungu: '청양군', display: '충남 청양군' },
  { sido: '충청남도', sigungu: '홍성군', display: '충남 홍성군' },
  { sido: '충청남도', sigungu: '예산군', display: '충남 예산군' },
  { sido: '충청남도', sigungu: '태안군', display: '충남 태안군' },

  // 전북특별자치도 (주요 시/군)
  { sido: '전북특별자치도', sigungu: '전주시', display: '전북 전주시' },
  { sido: '전북특별자치도', sigungu: '익산시', display: '전북 익산시' },
  { sido: '전북특별자치도', sigungu: '군산시', display: '전북 군산시' },
  { sido: '전북특별자치도', sigungu: '정읍시', display: '전북 정읍시' },
  { sido: '전북특별자치도', sigungu: '김제시', display: '전북 김제시' },
  { sido: '전북특별자치도', sigungu: '남원시', display: '전북 남원시' },
  { sido: '전북특별자치도', sigungu: '완주군', display: '전북 완주군' },
  { sido: '전북특별자치도', sigungu: '고창군', display: '전북 고창군' },
  { sido: '전북특별자치도', sigungu: '부안군', display: '전북 부안군' },

  // 전라남도 (주요 시/군)
  { sido: '전라남도', sigungu: '목포시', display: '전남 목포시' },
  { sido: '전라남도', sigungu: '여수시', display: '전남 여수시' },
  { sido: '전라남도', sigungu: '순천시', display: '전남 순천시' },
  { sido: '전라남도', sigungu: '나주시', display: '전남 나주시' },
  { sido: '전라남도', sigungu: '광양시', display: '전남 광양시' },
  { sido: '전라남도', sigungu: '담양군', display: '전남 담양군' },
  { sido: '전라남도', sigungu: '곡성군', display: '전남 곡성군' },
  { sido: '전라남도', sigungu: '구례군', display: '전남 구례군' },
  { sido: '전라남도', sigungu: '고흥군', display: '전남 고흥군' },
  { sido: '전라남도', sigungu: '보성군', display: '전남 보성군' },
  { sido: '전라남도', sigungu: '화순군', display: '전남 화순군' },
  { sido: '전라남도', sigungu: '장흥군', display: '전남 장흥군' },
  { sido: '전라남도', sigungu: '강진군', display: '전남 강진군' },
  { sido: '전라남도', sigungu: '해남군', display: '전남 해남군' },
  { sido: '전라남도', sigungu: '영암군', display: '전남 영암군' },
  { sido: '전라남도', sigungu: '무안군', display: '전남 무안군' },
  { sido: '전라남도', sigungu: '함평군', display: '전남 함평군' },
  { sido: '전라남도', sigungu: '영광군', display: '전남 영광군' },
  { sido: '전라남도', sigungu: '장성군', display: '전남 장성군' },
  { sido: '전라남도', sigungu: '완도군', display: '전남 완도군' },
  { sido: '전라남도', sigungu: '진도군', display: '전남 진도군' },
  { sido: '전라남도', sigungu: '신안군', display: '전남 신안군' },

  // 경상북도 (주요 시/군)
  { sido: '경상북도', sigungu: '포항시', display: '경북 포항시' },
  { sido: '경상북도', sigungu: '경주시', display: '경북 경주시' },
  { sido: '경상북도', sigungu: '김천시', display: '경북 김천시' },
  { sido: '경상북도', sigungu: '안동시', display: '경북 안동시' },
  { sido: '경상북도', sigungu: '구미시', display: '경북 구미시' },
  { sido: '경상북도', sigungu: '영주시', display: '경북 영주시' },
  { sido: '경상북도', sigungu: '영천시', display: '경북 영천시' },
  { sido: '경상북도', sigungu: '상주시', display: '경북 상주시' },
  { sido: '경상북도', sigungu: '문경시', display: '경북 문경시' },
  { sido: '경상북도', sigungu: '경산시', display: '경북 경산시' },

  // 경상남도 (주요 시/군)
  { sido: '경상남도', sigungu: '창원시', display: '경남 창원시' },
  { sido: '경상남도', sigungu: '진주시', display: '경남 진주시' },
  { sido: '경상남도', sigungu: '통영시', display: '경남 통영시' },
  { sido: '경상남도', sigungu: '사천시', display: '경남 사천시' },
  { sido: '경상남도', sigungu: '김해시', display: '경남 김해시' },
  { sido: '경상남도', sigungu: '밀양시', display: '경남 밀양시' },
  { sido: '경상남도', sigungu: '거제시', display: '경남 거제시' },
  { sido: '경상남도', sigungu: '양산시', display: '경남 양산시' },
  { sido: '경상남도', sigungu: '의령군', display: '경남 의령군' },
  { sido: '경상남도', sigungu: '함안군', display: '경남 함안군' },
  { sido: '경상남도', sigungu: '창녕군', display: '경남 창녕군' },
  { sido: '경상남도', sigungu: '고성군', display: '경남 고성군' },
  { sido: '경상남도', sigungu: '남해군', display: '경남 남해군' },
  { sido: '경상남도', sigungu: '하동군', display: '경남 하동군' },
  { sido: '경상남도', sigungu: '산청군', display: '경남 산청군' },
  { sido: '경상남도', sigungu: '함양군', display: '경남 함양군' },
  { sido: '경상남도', sigungu: '거창군', display: '경남 거창군' },
  { sido: '경상남도', sigungu: '합천군', display: '경남 합천군' },

  // 제주특별자치도
  { sido: '제주특별자치도', sigungu: '제주시', display: '제주 제주시' },
  { sido: '제주특별자치도', sigungu: '서귀포시', display: '제주 서귀포시' },
];

// 검색 함수
export function searchRegions(query: string): Region[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const normalized = query.toLowerCase().trim();

  const filtered = ALL_REGIONS.filter((region) => {
    const sidoMatch = region.sido.toLowerCase().includes(normalized);
    const sigunguMatch = region.sigungu.toLowerCase().includes(normalized);
    const displayMatch = region.display.toLowerCase().includes(normalized);

    return sidoMatch || sigunguMatch || displayMatch;
  });

  // 최대 8개 반환
  return filtered.slice(0, 8);
}
