/**
 * ERP 시드 데이터 스크립트
 * 한국타이어 티스테이션 인천대공원점 기준 현실적 데이터 생성
 *
 * 실행: npx ts-node prisma/seed-erp.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// 거래처 데이터 (20건)
// ========================================
const customers = [
  // 매입처 (타이어/부품 공급업체)
  { code: 'C001', name: '한국타이어(주)', ceo: '이수일', phone: '032-111-2000', bizNumber: '101-81-12345', bizType: '제조업', bizCategory: '타이어제조', memo: '주매입처 - 한국타이어 본사' },
  { code: 'C002', name: '(주)케이티', ceo: '박철수', phone: '032-222-3000', bizNumber: '201-81-23456', bizType: '도매업', bizCategory: '타이어도매', memo: '한국타이어 인천지점 대리점' },
  { code: 'C003', name: '(주)경동모터스', ceo: '김경동', phone: '032-333-4000', bizNumber: '301-81-34567', bizType: '도매업', bizCategory: '자동차부품', memo: '브레이크패드, 오일필터 공급' },
  { code: 'C004', name: '(주)삼화오일', ceo: '이삼화', phone: '032-444-5000', bizNumber: '401-81-45678', bizType: '도매업', bizCategory: '오일류', memo: '엔진오일 주매입처' },
  { code: 'C005', name: '대한밧데리(주)', ceo: '최대한', phone: '032-555-6000', bizNumber: '501-81-56789', bizType: '도매업', bizCategory: '배터리', memo: 'AGM 배터리 공급업체' },
  { code: 'C006', name: '(주)인천부품상사', ceo: '정인천', phone: '032-666-7000', bizNumber: '601-81-67890', bizType: '도매업', bizCategory: '자동차부품', memo: '소모품 잡화 공급' },
  { code: 'C007', name: '넥센타이어(주)', ceo: '강넥센', phone: '02-777-8000', bizNumber: '701-81-78901', bizType: '제조업', bizCategory: '타이어제조', memo: '넥센타이어 공식 공급' },
  { code: 'C008', name: '금호타이어판매(주)', ceo: '윤금호', phone: '02-888-9000', bizNumber: '801-81-89012', bizType: '도매업', bizCategory: '타이어도매', memo: '금호타이어 공급' },

  // 매출처 (개인 고객 / 법인 고객)
  { code: 'V001', name: '김우황', ceo: null, phone: '010-3456-7890', bizNumber: null, bizType: null, bizCategory: null, memo: '단골 - 모닝 2대 보유' },
  { code: 'V002', name: '이민준', ceo: null, phone: '010-2345-6789', bizNumber: null, bizType: null, bizCategory: null, memo: '포르쉐 박스터 오너' },
  { code: 'V003', name: '박지현', ceo: null, phone: '010-1234-5678', bizNumber: null, bizType: null, bizCategory: null, memo: '산타페 장기고객' },
  { code: 'V004', name: '최성훈', ceo: null, phone: '010-9876-5432', bizNumber: null, bizType: null, bizCategory: null, memo: '쏘나타 법인차' },
  { code: 'V005', name: '정미영', ceo: null, phone: '010-8765-4321', bizNumber: null, bizType: null, bizCategory: null, memo: 'K5 단골' },
  { code: 'V006', name: '강태양', ceo: null, phone: '010-7654-3210', bizNumber: null, bizType: null, bizCategory: null, memo: '아반떼 신규' },
  { code: 'V007', name: '(주)인천물류', ceo: '한물류', phone: '032-123-4567', bizNumber: '901-81-90123', bizType: '운수업', bizCategory: '화물운송', memo: '트럭 5대 관리' },
  { code: 'V008', name: '홍길동', ceo: null, phone: '010-5555-6666', bizNumber: null, bizType: null, bizCategory: null, memo: 'BMW 5시리즈' },
  { code: 'V009', name: '심재원', ceo: null, phone: '010-4444-5555', bizNumber: null, bizType: null, bizCategory: null, memo: '그랜저 장기고객 10년' },
  { code: 'V010', name: '나현숙', ceo: null, phone: '010-3333-4444', bizNumber: null, bizType: null, bizCategory: null, memo: '카니발 3열' },
  { code: 'V011', name: '유재석', ceo: null, phone: '010-2222-3333', bizNumber: null, bizType: null, bizCategory: null, memo: '투싼 2020년식' },
  { code: 'V012', name: '오세훈', ceo: null, phone: '010-1111-2222', bizNumber: null, bizType: null, bizCategory: null, memo: '코나 전기차' },
];

// ========================================
// 차량 데이터 (30건)
// ========================================
const vehicles = [
  { code: 'VH001', plateNumber: '91주3336', ownerName: '김우황', phone: '010-3456-7890', carModel: '기아 모닝', carModel2: 'JA', color: '화이트', displacement: '1000', modelYear: '2019', memo: '단골 - 엔진오일 매 6개월 교환' },
  { code: 'VH002', plateNumber: '27주0101', ownerName: '이민준', phone: '010-2345-6789', carModel: '포르쉐 박스터', carModel2: '718', color: '실버', displacement: '2000', modelYear: '2021', memo: '포르쉐 전용 엔진오일 사용' },
  { code: 'VH003', plateNumber: '31서4521', ownerName: '박지현', phone: '010-1234-5678', carModel: '현대 산타페', carModel2: 'TM', color: '블랙', displacement: '2000', modelYear: '2020', memo: '4WD - 타이어 교체 주기 빠름' },
  { code: 'VH004', plateNumber: '45나7892', ownerName: '최성훈', phone: '010-9876-5432', carModel: '현대 쏘나타', carModel2: 'DN8', color: '그레이', displacement: '2000', modelYear: '2022', memo: '법인차 - 연 2회 타이어 점검' },
  { code: 'VH005', plateNumber: '62다1234', ownerName: '정미영', phone: '010-8765-4321', carModel: '기아 K5', carModel2: 'DL3', color: '레드', displacement: '1600', modelYear: '2021', memo: 'K5 터보 - 고성능 타이어 선호' },
  { code: 'VH006', plateNumber: '11가8877', ownerName: '강태양', phone: '010-7654-3210', carModel: '현대 아반떼', carModel2: 'CN7', color: '블루', displacement: '1600', modelYear: '2023', memo: '신규고객 - 2023년 6월 첫 방문' },
  { code: 'VH007', plateNumber: '78라2341', ownerName: '홍길동', phone: '010-5555-6666', carModel: 'BMW 5시리즈', carModel2: 'G30', color: '블랙', displacement: '2000', modelYear: '2020', memo: 'BMW 전용 런플랫 타이어 사용' },
  { code: 'VH008', plateNumber: '55마6699', ownerName: '심재원', phone: '010-4444-5555', carModel: '현대 그랜저', carModel2: 'GN7', color: '화이트', displacement: '2500', modelYear: '2022', memo: '10년 단골 - 가족 차량 전부 방문' },
  { code: 'VH009', plateNumber: '33바5512', ownerName: '나현숙', phone: '010-3333-4444', carModel: '기아 카니발', carModel2: 'KA4', color: '실버', displacement: '2200', modelYear: '2021', memo: '3열 - 타이어 4개 동시 교체' },
  { code: 'VH010', plateNumber: '22사4489', ownerName: '유재석', phone: '010-2222-3333', carModel: '현대 투싼', carModel2: 'NX4', color: '그린', displacement: '1600', modelYear: '2020', memo: '겨울 스노우 타이어 보관 중' },
  { code: 'VH011', plateNumber: '99아7723', ownerName: '오세훈', phone: '010-1111-2222', carModel: '현대 코나 EV', carModel2: 'OS', color: '오렌지', displacement: '전기', modelYear: '2022', memo: '전기차 - 타이어 마모 빠름' },
  { code: 'VH012', plateNumber: '66자3301', ownerName: '김우황', phone: '010-3456-7890', carModel: '기아 모닝', carModel2: 'SA', color: '레드', displacement: '1000', modelYear: '2016', memo: '두번째 차량 - 구형 모닝' },
  { code: 'VH013', plateNumber: '12차5599', ownerName: '(주)인천물류', phone: '032-123-4567', carModel: '현대 포터2', carModel2: 'HR', color: '화이트', displacement: '2500', modelYear: '2019', memo: '화물트럭 1호' },
  { code: 'VH014', plateNumber: '23차8812', ownerName: '(주)인천물류', phone: '032-123-4567', carModel: '현대 포터2', carModel2: 'HR', color: '화이트', displacement: '2500', modelYear: '2019', memo: '화물트럭 2호' },
  { code: 'VH015', plateNumber: '34차1127', ownerName: '(주)인천물류', phone: '032-123-4567', carModel: '기아 봉고3', carModel2: 'PU', color: '화이트', displacement: '2500', modelYear: '2020', memo: '화물트럭 3호' },
  { code: 'VH016', plateNumber: '88카2211', ownerName: '조민호', phone: '010-9999-0000', carModel: '제네시스 G80', carModel2: 'RG3', color: '블랙', displacement: '2500', modelYear: '2023', memo: 'VIP 고객 - 럭셔리 타이어' },
  { code: 'VH017', plateNumber: '77타8844', ownerName: '신지아', phone: '010-8888-9999', carModel: '볼보 XC60', carModel2: 'UD', color: '실버', displacement: '2000', modelYear: '2022', memo: '수입차 - 볼보 전용 타이어' },
  { code: 'VH018', plateNumber: '55파3366', ownerName: '박준호', phone: '010-7777-8888', carModel: '기아 스포티지', carModel2: 'NQ5', color: '블루', displacement: '1600', modelYear: '2023', memo: '신규 - 타이어 교체로 첫 방문' },
  { code: 'VH019', plateNumber: '44하6677', ownerName: '이소영', phone: '010-6666-7777', carModel: '현대 아이오닉5', carModel2: 'NE', color: '화이트', displacement: '전기', modelYear: '2022', memo: '전기차 - 20인치 특수 타이어' },
  { code: 'VH020', plateNumber: '33거9901', ownerName: '최민수', phone: '010-5555-6666', carModel: '기아 EV6', carModel2: 'CV', color: '매트그레이', displacement: '전기', modelYear: '2023', memo: '전기차 단골 - 동절기 타이어 교환' },
  { code: 'VH021', plateNumber: '22너4432', ownerName: '황인호', phone: '010-4444-5555', carModel: '현대 팰리세이드', carModel2: 'LX2', color: '블랙', displacement: '2200', modelYear: '2021', memo: '대형 SUV - 265/45R21' },
  { code: 'VH022', plateNumber: '11더7765', ownerName: '임재현', phone: '010-3333-4444', carModel: '쌍용 렉스턴', carModel2: 'Y450', color: '그레이', displacement: '2200', modelYear: '2020', memo: '오프로드 타이어 선호' },
  { code: 'VH023', plateNumber: '99러1198', ownerName: '권지용', phone: '010-2222-3333', carModel: '기아 K8', carModel2: 'GL3', color: '실버', displacement: '3500', modelYear: '2022', memo: '3.5 GDi - 프리미엄 타이어' },
  { code: 'VH024', plateNumber: '88머5521', ownerName: '한지수', phone: '010-1111-2222', carModel: '현대 베뉴', carModel2: 'QX', color: '옐로우', displacement: '1000', modelYear: '2022', memo: '소형 SUV - 205/60R16' },
  { code: 'VH025', plateNumber: '77버8854', ownerName: '윤석민', phone: '010-9000-8000', carModel: '토요타 캠리', carModel2: 'XV70', color: '화이트', displacement: '2500', modelYear: '2021', memo: '하이브리드 - 연비 중시 타이어' },
  { code: 'VH026', plateNumber: '66서2287', ownerName: '신현준', phone: '010-8000-7000', carModel: '메르세데스-벤츠 E클래스', carModel2: 'W213', color: '블랙', displacement: '2000', modelYear: '2020', memo: '벤츠 - 전용 OEM 타이어' },
  { code: 'VH027', plateNumber: '55어5510', ownerName: '오지호', phone: '010-7000-6000', carModel: '현대 투싼 HEV', carModel2: 'NX4', color: '블루', displacement: '1600', modelYear: '2023', memo: '하이브리드 투싼' },
  { code: 'VH028', plateNumber: '44저8843', ownerName: '정우성', phone: '010-6000-5000', carModel: '기아 카렌스', carModel2: 'RP', color: '실버', displacement: '1700', modelYear: '2015', memo: '구형 - 저가 타이어 선호' },
  { code: 'VH029', plateNumber: '33조1176', ownerName: '배수지', phone: '010-5000-4000', carModel: '폭스바겐 티구안', carModel2: 'AD1', color: '그레이', displacement: '2000', modelYear: '2019', memo: '수입차 - 고품질 타이어' },
  { code: 'VH030', plateNumber: '22초4409', ownerName: '송혜교', phone: '010-4000-3000', carModel: '렉서스 RX', carModel2: 'AL20', color: '화이트', displacement: '3500', modelYear: '2020', memo: 'VIP - 럭셔리 브랜드 선호' },
];

// ========================================
// 상품 데이터 (50건)
// ========================================
const products = [
  // 타이어 (TA*)
  { code: 'TA19555190002', name: '195/55R15 H RA43 다이나프로HPX', altName: 'RA43 195/55R15', unit: 'EA', costPrice: 65000, sellPrice1: 95000, fixedPrice: 105000, stock: 20 },
  { code: 'TA20555160001', name: '205/55R16 V RA43 다이나프로HPX', altName: 'RA43 205/55R16', unit: 'EA', costPrice: 72000, sellPrice1: 108000, fixedPrice: 120000, stock: 24 },
  { code: 'TA21555170001', name: '215/55R17 V RA43 다이나프로HPX', altName: 'RA43 215/55R17', unit: 'EA', costPrice: 82000, sellPrice1: 122000, fixedPrice: 135000, stock: 16 },
  { code: 'TA22545170002', name: '225/45R17 Y K117 벤투스S1에보3', altName: 'K117 225/45R17', unit: 'EA', costPrice: 105000, sellPrice1: 155000, fixedPrice: 175000, stock: 12 },
  { code: 'TA23555190002', name: '235/55R19 V RA43 다이나프로HPX', altName: 'RA43 235/55R19', unit: 'EA', costPrice: 118000, sellPrice1: 178000, fixedPrice: 198000, stock: 8 },
  { code: 'TA24545200001', name: '245/45R20 Y K127 벤투스S1에보4', altName: 'K127 245/45R20', unit: 'EA', costPrice: 138000, sellPrice1: 208000, fixedPrice: 228000, stock: 6 },
  { code: 'TA17565150001', name: '175/65R14 T RA18 키너지에코', altName: 'RA18 175/65R14', unit: 'EA', costPrice: 48000, sellPrice1: 72000, fixedPrice: 80000, stock: 32 },
  { code: 'TA18565150001', name: '185/65R15 H RA18 키너지에코', altName: 'RA18 185/65R15', unit: 'EA', costPrice: 55000, sellPrice1: 82000, fixedPrice: 92000, stock: 28 },
  { code: 'TA25545190001', name: '255/45R19 Y K117 벤투스S1에보3', altName: 'K117 255/45R19', unit: 'EA', costPrice: 148000, sellPrice1: 218000, fixedPrice: 245000, stock: 4 },
  { code: 'TA26550200001', name: '265/50R20 Y RA33 다이나프로HTM2', altName: 'RA33 265/50R20', unit: 'EA', costPrice: 168000, sellPrice1: 248000, fixedPrice: 278000, stock: 6 },
  { code: 'TA20560160001', name: '205/60R16 H RA18 키너지에코', altName: 'RA18 205/60R16', unit: 'EA', costPrice: 68000, sellPrice1: 102000, fixedPrice: 115000, stock: 20 },
  { code: 'TA22565170001', name: '225/65R17 H RA33 다이나프로HTM2', altName: 'RA33 225/65R17', unit: 'EA', costPrice: 88000, sellPrice1: 132000, fixedPrice: 148000, stock: 16 },

  // 얼라인먼트 (AL*)
  { code: 'AL001', name: '4륜 얼라인먼트', altName: '얼라인먼트 4WD', unit: '식', costPrice: 30000, sellPrice1: 55000, fixedPrice: 60000, stock: 999 },
  { code: 'AL002', name: '2륜 얼라인먼트', altName: '얼라인먼트 2WD', unit: '식', costPrice: 20000, sellPrice1: 40000, fixedPrice: 45000, stock: 999 },
  { code: 'AL003', name: '얼라인먼트 SUV', altName: '얼라인먼트 대형SUV', unit: '식', costPrice: 35000, sellPrice1: 65000, fixedPrice: 70000, stock: 999 },

  // 배터리 (AGM*)
  { code: 'AGM060', name: 'AGM 배터리 60AH', altName: 'AGM60', unit: 'EA', costPrice: 145000, sellPrice1: 195000, fixedPrice: 210000, stock: 8 },
  { code: 'AGM070', name: 'AGM 배터리 70AH', altName: 'AGM70', unit: 'EA', costPrice: 165000, sellPrice1: 225000, fixedPrice: 240000, stock: 6 },
  { code: 'AGM080', name: 'AGM 배터리 80AH', altName: 'AGM80', unit: 'EA', costPrice: 185000, sellPrice1: 255000, fixedPrice: 270000, stock: 4 },
  { code: 'AGM095', name: 'AGM 배터리 95AH (스타트스톱)', altName: 'AGM95', unit: 'EA', costPrice: 215000, sellPrice1: 295000, fixedPrice: 320000, stock: 4 },

  // 엔진오일 (N0*)
  { code: 'N0MOBIL0W30', name: '모빌1 0W-30 4L', altName: '모빌1 0W30', unit: 'EA', costPrice: 45000, sellPrice1: 68000, fixedPrice: 75000, stock: 30 },
  { code: 'N0MOBIL5W30', name: '모빌1 5W-30 4L', altName: '모빌1 5W30', unit: 'EA', costPrice: 42000, sellPrice1: 65000, fixedPrice: 72000, stock: 30 },
  { code: 'N0MOBIL5W40', name: '모빌1 5W-40 4L', altName: '모빌1 5W40', unit: 'EA', costPrice: 48000, sellPrice1: 72000, fixedPrice: 80000, stock: 24 },
  { code: 'N0SHELL5W30', name: '쉘 힐릭스 HX8 5W-30 4L', altName: '힐릭스HX8', unit: 'EA', costPrice: 38000, sellPrice1: 58000, fixedPrice: 65000, stock: 24 },
  { code: 'N0CASTROL5W40', name: '카스트롤 엣지 5W-40 4L', altName: '카스트롤엣지', unit: 'EA', costPrice: 52000, sellPrice1: 78000, fixedPrice: 88000, stock: 20 },
  { code: 'N0FILTER001', name: '오일필터 (국산)', altName: '오일필터', unit: 'EA', costPrice: 3500, sellPrice1: 8000, fixedPrice: 10000, stock: 100 },
  { code: 'N0FILTER002', name: '오일필터 (수입차)', altName: '오일필터수입', unit: 'EA', costPrice: 8000, sellPrice1: 18000, fixedPrice: 22000, stock: 50 },

  // 브레이크 (PH*)
  { code: 'PH001', name: '브레이크패드 앞 (국산)', altName: 'BP앞국산', unit: '세트', costPrice: 25000, sellPrice1: 55000, fixedPrice: 65000, stock: 20 },
  { code: 'PH002', name: '브레이크패드 뒤 (국산)', altName: 'BP뒤국산', unit: '세트', costPrice: 20000, sellPrice1: 45000, fixedPrice: 55000, stock: 20 },
  { code: 'PH003', name: '브레이크패드 앞 (수입차)', altName: 'BP앞수입', unit: '세트', costPrice: 55000, sellPrice1: 105000, fixedPrice: 125000, stock: 10 },
  { code: 'PH004', name: '브레이크디스크 앞 (국산)', altName: 'BD앞국산', unit: '개', costPrice: 35000, sellPrice1: 75000, fixedPrice: 90000, stock: 12 },
  { code: 'PH005', name: '브레이크디스크 뒤 (국산)', altName: 'BD뒤국산', unit: '개', costPrice: 30000, sellPrice1: 65000, fixedPrice: 78000, stock: 12 },

  // 잡화/소모품 (NN*)
  { code: 'NN001', name: '와이퍼 운전석 (600mm)', altName: '와이퍼600', unit: 'EA', costPrice: 8000, sellPrice1: 18000, fixedPrice: 22000, stock: 40 },
  { code: 'NN002', name: '와이퍼 조수석 (450mm)', altName: '와이퍼450', unit: 'EA', costPrice: 6000, sellPrice1: 14000, fixedPrice: 18000, stock: 40 },
  { code: 'NN003', name: '에어컨 필터 (국산)', altName: '에어컨필터', unit: 'EA', costPrice: 6000, sellPrice1: 15000, fixedPrice: 18000, stock: 50 },
  { code: 'NN004', name: '에어필터 (국산)', altName: '에어필터', unit: 'EA', costPrice: 8000, sellPrice1: 20000, fixedPrice: 25000, stock: 40 },
  { code: 'NN005', name: '타이어 밸브스템 세트', altName: '밸브스템', unit: '세트', costPrice: 2000, sellPrice1: 5000, fixedPrice: 8000, stock: 200 },
  { code: 'NN006', name: '타이어 질소충전 (1개)', altName: '질소충전', unit: 'EA', costPrice: 0, sellPrice1: 3000, fixedPrice: 4000, stock: 999 },

  // 휠 (WH*)
  { code: 'WH001', name: '17인치 알로이휠 세트', altName: '알로이휠17', unit: '세트', costPrice: 280000, sellPrice1: 450000, fixedPrice: 520000, stock: 4 },
  { code: 'WH002', name: '18인치 알로이휠 세트', altName: '알로이휠18', unit: '세트', costPrice: 340000, sellPrice1: 560000, fixedPrice: 640000, stock: 4 },

  // 기타 서비스
  { code: 'SV001', name: '타이어 교체 공임 (1개)', altName: '교체공임', unit: 'EA', costPrice: 0, sellPrice1: 5000, fixedPrice: 8000, stock: 999 },
  { code: 'SV002', name: '타이어 위치교환', altName: '위치교환', unit: '식', costPrice: 0, sellPrice1: 20000, fixedPrice: 25000, stock: 999 },
  { code: 'SV003', name: '타이어 펑크수리', altName: '펑크수리', unit: '개', costPrice: 2000, sellPrice1: 10000, fixedPrice: 15000, stock: 999 },
  { code: 'SV004', name: '엔진오일 교환 공임', altName: '오일공임', unit: '식', costPrice: 0, sellPrice1: 10000, fixedPrice: 15000, stock: 999 },
  { code: 'SV005', name: '배터리 교체 공임', altName: '배터리공임', unit: '식', costPrice: 0, sellPrice1: 10000, fixedPrice: 15000, stock: 999 },
  { code: 'SV006', name: '배터리 점검', altName: '배터리점검', unit: '식', costPrice: 0, sellPrice1: 5000, fixedPrice: 0, stock: 999 },
  { code: 'SV007', name: '타이어 공기압 점검 및 조정', altName: '공기압점검', unit: '식', costPrice: 0, sellPrice1: 0, fixedPrice: 0, stock: 999 },

  // 기타 타이어 (TH, TK = 넥센, 금호)
  { code: 'TH20555160001', name: '넥센 205/55R16 N8000', altName: 'N8000 205/55R16', unit: 'EA', costPrice: 58000, sellPrice1: 88000, fixedPrice: 98000, stock: 12 },
  { code: 'TK21545170001', name: '금호 215/45R17 PS71', altName: 'PS71 215/45R17', unit: 'EA', costPrice: 75000, sellPrice1: 112000, fixedPrice: 125000, stock: 8 },
];

// ========================================
// 정비 이력 데이터 생성 헬퍼
// ========================================

// 날짜 범위에서 랜덤 날짜 생성
function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 날짜 포맷
function formatDate(d: Date): string {
  return d.toISOString().substring(0, 10);
}

// 랜덤 정수
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 전표번호 생성
let fnoCounter = 1;
function nextFno(date: string): string {
  return `${date.replace(/-/g, '')}${String(fnoCounter++).padStart(4, '0')}`;
}

// ========================================
// GdSaleDetail 생성 (200건, 3월 2026)
// ========================================

// 주요 매출 날짜별 목표
const saleDayTargets: { date: string; target: number; approxCount: number }[] = [
  { date: '2026-03-01', target: 3485000, approxCount: 20 },
  { date: '2026-03-02', target: 4727000, approxCount: 24 },
  { date: '2026-03-03', target: 7229000, approxCount: 30 },
  { date: '2026-03-04', target: 3100000, approxCount: 16 },
  { date: '2026-03-05', target: 2800000, approxCount: 14 },
  { date: '2026-03-06', target: 4200000, approxCount: 20 },
  { date: '2026-03-07', target: 11178000, approxCount: 40 },
  { date: '2026-03-08', target: 5600000, approxCount: 26 },
  { date: '2026-03-10', target: 4900000, approxCount: 22 },
  { date: '2026-03-11', target: 6300000, approxCount: 28 },
  { date: '2026-03-12', target: 5100000, approxCount: 24 },
  { date: '2026-03-13', target: 4800000, approxCount: 22 },
  { date: '2026-03-14', target: 6142200, approxCount: 30 },
  { date: '2026-03-15', target: 5500000, approxCount: 26 },
  { date: '2026-03-16', target: 3760750, approxCount: 20 },
];

// 매출 상품 목록 (실제 판매에 사용할 상품들)
const salableProductCodes = [
  'TA20555160001', 'TA21555170001', 'TA22545170002', 'TA23555190002',
  'TA17565150001', 'TA18565150001', 'TA20560160001', 'TA22565170001',
  'AL001', 'AL002', 'AL003',
  'AGM060', 'AGM070', 'AGM080',
  'N0MOBIL5W30', 'N0MOBIL5W40', 'N0SHELL5W30', 'N0CASTROL5W40', 'N0FILTER001',
  'PH001', 'PH002', 'PH004',
  'NN001', 'NN002', 'NN003', 'NN004',
  'SV001', 'SV002', 'SV003', 'SV004',
  'TH20555160001', 'TK21545170001',
];

// V001~V012 고객 코드 (매출처)
const salesCustomerCodes = ['V001','V002','V003','V004','V005','V006','V007','V008','V009','V010','V011','V012'];

function buildSaleDetails() {
  const rows: {
    fno: string;
    saleDate: string;
    saleType: string;
    customerCode: string;
    productCode: string;
    productName: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }[] = [];

  // products 맵
  const productMap = new Map(products.map(p => [p.code, p]));

  for (const day of saleDayTargets) {
    let accumulated = 0;
    const maxRows = day.approxCount;

    for (let i = 0; i < maxRows; i++) {
      // 마지막 항목에서 남은 금액 맞추기
      const isLast = i === maxRows - 1;

      const custCode = salesCustomerCodes[rand(0, salesCustomerCodes.length - 1)];
      const prodCode = salableProductCodes[rand(0, salableProductCodes.length - 1)];
      const prod = productMap.get(prodCode)!;

      let qty = 1;
      let unitPrice = prod.sellPrice1;

      // 타이어는 4개 묶음 자주
      if (prodCode.startsWith('TA') || prodCode.startsWith('TH') || prodCode.startsWith('TK')) {
        qty = [1, 2, 4][rand(0, 2)];
      }

      // 공임 / 소모품은 금액이 작음
      if (prodCode.startsWith('SV') || prodCode.startsWith('NN')) {
        qty = rand(1, 3);
      }

      // 얼라인먼트는 1건
      if (prodCode.startsWith('AL')) {
        qty = 1;
      }

      let amount = unitPrice * qty;

      // 마지막 항목에서 목표에 맞게 조정
      if (isLast) {
        const remaining = day.target - accumulated;
        if (remaining > 0) {
          // 타이어 1개짜리로 맞추기
          const adjCode = 'TA20555160001';
          const adjProd = productMap.get(adjCode)!;
          const adjQty = Math.max(1, Math.round(remaining / adjProd.sellPrice1));
          rows.push({
            fno: nextFno(day.date),
            saleDate: day.date,
            saleType: '2',
            customerCode: custCode,
            productCode: adjCode,
            productName: adjProd.name,
            qty: adjQty,
            unitPrice: adjProd.sellPrice1,
            amount: adjProd.sellPrice1 * adjQty,
          });
          accumulated += adjProd.sellPrice1 * adjQty;
          continue;
        }
      }

      rows.push({
        fno: nextFno(day.date),
        saleDate: day.date,
        saleType: '2',
        customerCode: custCode,
        productCode: prodCode,
        productName: prod.name,
        qty,
        unitPrice,
        amount,
      });
      accumulated += amount;
    }
  }

  return rows;
}

// ========================================
// 정비 이력 (100건)
// ========================================

function buildRepairRecords() {
  const repairs: {
    fno: string;
    vehicleCode: string;
    repairDate: string;
    productCode: string | null;
    productName: string;
    unit: string;
    qty: number;
    unitPrice: number;
    amount: number;
    mileage: number;
    memo: string;
  }[] = [];

  const productMap = new Map(products.map(p => [p.code, p]));
  const now = new Date('2026-03-17');
  const oneYearAgo = new Date('2025-03-17');

  // 차량별 시작 주행거리 (현실적 범위)
  const vehicleBaseMileage: Record<string, number> = {
    'VH001': 85000, 'VH002': 42000, 'VH003': 68000, 'VH004': 35000,
    'VH005': 52000, 'VH006': 15000, 'VH007': 38000, 'VH008': 95000,
    'VH009': 73000, 'VH010': 62000, 'VH011': 28000, 'VH012': 112000,
    'VH013': 145000, 'VH014': 138000, 'VH015': 122000, 'VH016': 18000,
    'VH017': 32000, 'VH018': 8000, 'VH019': 22000, 'VH020': 19000,
    'VH021': 55000, 'VH022': 78000, 'VH023': 41000, 'VH024': 31000,
    'VH025': 48000, 'VH026': 62000, 'VH027': 12000, 'VH028': 135000,
    'VH029': 58000, 'VH030': 45000,
  };

  const repairItems = [
    { productCode: 'TA20555160001', productName: '205/55R16 V RA43 타이어 교체', unit: 'EA', qty: 4, unitPrice: 108000, memoTemplate: '타이어 4개 교체, 마모 한계 초과' },
    { productCode: 'TA21555170001', productName: '215/55R17 V RA43 타이어 교체', unit: 'EA', qty: 4, unitPrice: 122000, memoTemplate: '4개 동시 교체' },
    { productCode: 'TA22545170002', productName: '225/45R17 Y K117 타이어 교체', unit: 'EA', qty: 2, unitPrice: 155000, memoTemplate: '앞 타이어 2개 교체' },
    { productCode: 'AL001', productName: '4륜 얼라인먼트', unit: '식', qty: 1, unitPrice: 55000, memoTemplate: '타이어 교체 후 얼라인먼트 실시' },
    { productCode: 'N0MOBIL5W30', productName: '엔진오일 모빌1 5W-30 교환', unit: 'EA', qty: 1, unitPrice: 65000, memoTemplate: '엔진오일 + 필터 교환' },
    { productCode: 'N0MOBIL5W40', productName: '엔진오일 모빌1 5W-40 교환', unit: 'EA', qty: 1, unitPrice: 72000, memoTemplate: '엔진오일 교환, 5,000km 경과' },
    { productCode: 'AGM070', productName: 'AGM 배터리 70AH 교체', unit: 'EA', qty: 1, unitPrice: 225000, memoTemplate: '배터리 전압 저하, 교체 권고' },
    { productCode: 'PH001', productName: '브레이크패드 앞 교체', unit: '세트', qty: 1, unitPrice: 55000, memoTemplate: '앞 브레이크패드 마모 4mm 이하, 교체' },
    { productCode: 'SV002', productName: '타이어 위치교환', unit: '식', qty: 1, unitPrice: 20000, memoTemplate: '계절 위치교환 (앞-뒤 교환)' },
    { productCode: 'NN003', productName: '에어컨 필터 교체', unit: 'EA', qty: 1, unitPrice: 15000, memoTemplate: '에어컨 필터 오염 심함, 교체' },
  ];

  let repairCount = 0;
  const vehicleCodes = vehicles.map(v => v.code);

  for (const vehicleCode of vehicleCodes) {
    if (repairCount >= 100) break;

    const baseKm = vehicleBaseMileage[vehicleCode] || 50000;
    let currentKm = baseKm - rand(15000, 30000); // 1년 전 주행거리
    const visitsCount = rand(2, 5); // 차량당 방문 횟수

    // 방문 날짜를 오래된 순으로 정렬
    const visitDates: Date[] = [];
    for (let v = 0; v < visitsCount; v++) {
      visitDates.push(randomDateBetween(oneYearAgo, now));
    }
    visitDates.sort((a, b) => a.getTime() - b.getTime());

    for (const visitDate of visitDates) {
      if (repairCount >= 100) break;

      const kmIncrement = rand(3000, 8000);
      currentKm += kmIncrement;

      // 방문당 1~3개 정비 항목
      const itemCount = rand(1, 3);
      const usedItems = new Set<number>();

      for (let item = 0; item < itemCount; item++) {
        if (repairCount >= 100) break;

        let itemIdx: number;
        do {
          itemIdx = rand(0, repairItems.length - 1);
        } while (usedItems.has(itemIdx) && usedItems.size < repairItems.length);
        usedItems.add(itemIdx);

        const ri = repairItems[itemIdx];

        repairs.push({
          fno: nextFno(formatDate(visitDate)),
          vehicleCode,
          repairDate: formatDate(visitDate),
          productCode: ri.productCode,
          productName: ri.productName,
          unit: ri.unit,
          qty: ri.qty,
          unitPrice: ri.unitPrice,
          amount: ri.qty * ri.unitPrice,
          mileage: currentKm,
          memo: ri.memoTemplate + ` (${currentKm.toLocaleString()}km)`,
        });

        repairCount++;
      }
    }
  }

  return repairs;
}

// ========================================
// 메인 시드 함수
// ========================================

async function main() {
  console.log('ERP 시드 데이터 입력 시작...');
  console.log('======================================');

  // 1. 거래처 (GdCustomer) upsert
  console.log(`[1/5] 거래처 ${customers.length}건 입력 중...`);
  for (const c of customers) {
    await prisma.gdCustomer.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        ceo: c.ceo,
        phone: c.phone,
        bizNumber: c.bizNumber,
        bizType: c.bizType,
        bizCategory: c.bizCategory,
        memo: c.memo,
      },
      create: {
        code: c.code,
        name: c.name,
        ceo: c.ceo,
        phone: c.phone,
        bizNumber: c.bizNumber,
        bizType: c.bizType,
        bizCategory: c.bizCategory,
        memo: c.memo,
      },
    });
  }
  console.log(`  -> 거래처 ${customers.length}건 완료`);

  // 2. 차량 (GdVehicle) upsert
  console.log(`[2/5] 차량 ${vehicles.length}건 입력 중...`);
  for (const v of vehicles) {
    await prisma.gdVehicle.upsert({
      where: { code: v.code },
      update: {
        plateNumber: v.plateNumber,
        ownerName: v.ownerName,
        phone: v.phone,
        carModel: v.carModel,
        carModel2: v.carModel2,
        color: v.color,
        displacement: v.displacement,
        modelYear: v.modelYear,
        memo: v.memo,
      },
      create: {
        code: v.code,
        plateNumber: v.plateNumber,
        ownerName: v.ownerName,
        phone: v.phone,
        carModel: v.carModel,
        carModel2: v.carModel2,
        color: v.color,
        displacement: v.displacement,
        modelYear: v.modelYear,
        memo: v.memo,
      },
    });
  }
  console.log(`  -> 차량 ${vehicles.length}건 완료`);

  // 3. 상품 (GdProduct) upsert
  console.log(`[3/5] 상품 ${products.length}건 입력 중...`);
  for (const p of products) {
    await prisma.gdProduct.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        altName: p.altName,
        unit: p.unit,
        costPrice: p.costPrice,
        sellPrice1: p.sellPrice1,
        fixedPrice: p.fixedPrice,
        stock: p.stock,
      },
      create: {
        code: p.code,
        name: p.name,
        altName: p.altName,
        unit: p.unit,
        costPrice: p.costPrice,
        sellPrice1: p.sellPrice1,
        fixedPrice: p.fixedPrice,
        stock: p.stock,
      },
    });
  }
  console.log(`  -> 상품 ${products.length}건 완료`);

  // 4. 매출 전표 (GdSaleDetail) 생성
  const saleRows = buildSaleDetails();
  console.log(`[4/5] 매출 전표 ${saleRows.length}건 입력 중...`);
  // 멱등성을 위해 기존 3월 데이터 삭제 후 재삽입
  await prisma.gdSaleDetail.deleteMany({
    where: { saleDate: { startsWith: '2026-03' } },
  });
  // createMany 배치 처리 (100건씩)
  for (let i = 0; i < saleRows.length; i += 100) {
    const batch = saleRows.slice(i, i + 100);
    await prisma.gdSaleDetail.createMany({ data: batch });
  }
  console.log(`  -> 매출 전표 ${saleRows.length}건 완료`);

  // 5. 정비 이력 (GdRepair) 생성
  const repairRows = buildRepairRecords();
  console.log(`[5/5] 정비 이력 ${repairRows.length}건 입력 중...`);
  // 멱등성: 기존 시드 데이터 삭제 (fno 패턴 기반)
  await prisma.gdRepair.deleteMany({
    where: { repairDate: { gte: '2025-03-01' } },
  });
  for (let i = 0; i < repairRows.length; i += 50) {
    const batch = repairRows.slice(i, i + 50);
    await prisma.gdRepair.createMany({ data: batch });
  }
  console.log(`  -> 정비 이력 ${repairRows.length}건 완료`);

  // 완료 요약
  console.log('======================================');
  console.log('ERP 시드 데이터 입력 완료!');
  console.log(`거래처: ${customers.length}건`);
  console.log(`차량:   ${vehicles.length}건`);
  console.log(`상품:   ${products.length}건`);
  console.log(`매출:   ${saleRows.length}건`);
  console.log(`정비:   ${repairRows.length}건`);

  // 매출 합계 확인
  const totalSales = saleRows.reduce((sum, r) => sum + r.amount, 0);
  console.log(`3월 매출합계: ${totalSales.toLocaleString()}원`);
}

main()
  .catch(e => {
    console.error('시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
