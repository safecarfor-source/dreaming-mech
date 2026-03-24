import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 인센티브 시드 데이터 입력 시작...');

  // 1. 계정 생성
  const adminPw = await bcrypt.hash('dream2026!', 10);
  const managerPw = await bcrypt.hash('kwj2026!', 10);
  const directorPw = await bcrypt.hash('ljs2026!', 10);

  const admin = await prisma.incentiveUser.upsert({
    where: { loginId: 'admin' },
    create: { loginId: 'admin', password: adminPw, name: '관리자', role: 'admin' },
    update: { password: adminPw },
  });
  await prisma.incentiveUser.upsert({
    where: { loginId: 'kwonjoong' },
    create: { loginId: 'kwonjoong', password: managerPw, name: '김권중', role: 'manager' },
    update: { password: managerPw },
  });
  await prisma.incentiveUser.upsert({
    where: { loginId: 'jeongsuk' },
    create: { loginId: 'jeongsuk', password: directorPw, name: '이정석', role: 'director' },
    update: { password: directorPw },
  });
  console.log('✅ 계정 3개 생성');

  // 2. IncentiveConfig 초기값
  const configs = [
    { key: 'manager_tire_rate', value: 0.003, label: '매니저 타이어+얼라이 배율 (0.3%)' },
    { key: 'manager_team_multiplier', value: 1.5, label: '매니저 팀인센 배수 (1.5배)' },
    { key: 'director_revenue_rate', value: 0.006, label: '부장 전체매출 배율 (0.6%)' },
    { key: 'director_wiper_rate', value: 0.003, label: '부장 와이퍼 배율 (0.3%)' },
    { key: 'director_battery_rate', value: 0.005, label: '부장 밧데리 배율 (0.5%)' },
    { key: 'director_acfilter_rate', value: 0.01, label: '부장 에어컨필터 배율 (1.0%)' },
    { key: 'team_penalty_rate', value: 0.5, label: '최소수량 미달 감액 비율 (50%)' },
    { key: 'director_breakeven', value: 145000000, label: '부장 손익분기점 매출' },
  ];
  for (const c of configs) {
    await prisma.incentiveConfig.upsert({
      where: { key: c.key },
      create: c,
      update: { value: c.value, label: c.label },
    });
  }
  console.log('✅ 설정값 8개 입력');

  // 3. ProductCodeMapping 초기값
  const mappings = [
    { code: 'TA', isPrefix: true, category: 'tire', label: '타이어', isIncentive: false },
    { code: 'TH', isPrefix: true, category: 'tire', label: '타이어', isIncentive: false },
    { code: 'TK', isPrefix: true, category: 'tire', label: '타이어', isIncentive: false },
    { code: 'TM', isPrefix: true, category: 'tire', label: '타이어', isIncentive: false },
    { code: 'TC', isPrefix: true, category: 'tire', label: '타이어(콘티넨탈)', isIncentive: false },
    { code: 'TP', isPrefix: true, category: 'tire', label: '타이어(피렐리)', isIncentive: false },
    { code: 'TB', isPrefix: true, category: 'tire', label: '타이어(브리지스톤)', isIncentive: false },
    { code: 'TL', isPrefix: true, category: 'tire', label: '타이어(넥센)', isIncentive: false },
    { code: 'TG', isPrefix: true, category: 'tire', label: '타이어(굿이어)', isIncentive: false },
    { code: 'TZ', isPrefix: true, category: 'tire', label: '타이어(기타)', isIncentive: false },
    { code: 'AL', isPrefix: true, category: 'alignment', label: '얼라이먼트', isIncentive: false },
    { code: 'PH', isPrefix: true, category: 'lining', label: '라이닝', isIncentive: true },
    { code: 'FP', isPrefix: true, category: 'lining', label: '라이닝', isIncentive: true },
    { code: 'RK', isPrefix: true, category: 'battery', label: '밧데리', isIncentive: true },
    { code: 'BX', isPrefix: true, category: 'battery', label: '밧데리', isIncentive: true },
    { code: 'AGM', isPrefix: true, category: 'battery', label: '밧데리', isIncentive: true },
    { code: 'ZB', isPrefix: true, category: 'battery', label: '밧데리(아트라스)', isIncentive: true },
    { code: 'N0', isPrefix: true, category: 'engine_oil', label: '엔진오일', isIncentive: false },
    { code: 'K0', isPrefix: true, category: 'discount', label: '할인/쿠폰', isIncentive: false },
    { code: 'NN00000000020', isPrefix: false, category: 'brake_oil', label: '브레이크오일', isIncentive: true },
    { code: 'NN00000000029', isPrefix: false, category: 'brake_oil', label: '브레이크오일(공임)', isIncentive: true },
    { code: 'NN00000000001', isPrefix: false, category: 'mission_oil', label: '미션오일', isIncentive: true },
    { code: 'NN00000000011', isPrefix: false, category: 'mission_oil', label: '미션오일(수동)', isIncentive: true },
    { code: 'NN00000000023', isPrefix: false, category: 'diff_oil', label: '데후오일', isIncentive: true },
    { code: 'NN00000000026', isPrefix: false, category: 'guardian_h3', label: '가디안H3', isIncentive: true },
    { code: 'NN00000000027', isPrefix: false, category: 'guardian_h5', label: '가디안H5', isIncentive: true },
    { code: 'NN00000000028', isPrefix: false, category: 'guardian_h7', label: '가디안H7', isIncentive: true },
    { code: 'G000000000011', isPrefix: false, category: 'ac_filter', label: '에어컨필터', isIncentive: true },
    { code: 'ZZ00496658889', isPrefix: false, category: 'ac_filter', label: '에어컨필터(공임)', isIncentive: true },
    { code: 'ZZ00000001112', isPrefix: false, category: 'wiper', label: '와이퍼', isIncentive: true },
    { code: '0000000005688', isPrefix: false, category: 'wiper', label: '와이퍼(티몰)', isIncentive: true },
    { code: 'ZT00000000001', isPrefix: false, category: 'battery', label: '밧데리(키배터리)', isIncentive: true },
    { code: '0000000005305', isPrefix: false, category: 'battery', label: '밧데리(리모컨)', isIncentive: true },
    { code: 'G000000000021', isPrefix: false, category: 'inspection', label: '자동차검사', isIncentive: false },
    // 와이퍼 매핑 추가 (2026-03-24) — HW* 코드 + NN00000000030 와이퍼 제품 누락 수정
    { code: 'HW', isPrefix: true, category: 'wiper', label: '와이퍼', isIncentive: true },
    { code: 'NN00000000030', isPrefix: false, category: 'wiper', label: '와이퍼(데이터용)', isIncentive: true },
    // 추가 분류 (2026-03-17)
    { code: 'WH', isPrefix: true, category: 'wheel', label: '휠', isIncentive: false },
    { code: 'XZZ', isPrefix: true, category: 'labor', label: '공임(탈부착 등)', isIncentive: false },
    { code: 'XS', isPrefix: true, category: 'suspension', label: '서스펜션/조향', isIncentive: false },
    { code: 'XE', isPrefix: true, category: 'aircon', label: '에어컨 부품', isIncentive: false },
    { code: 'M0', isPrefix: true, category: 'cabin_filter', label: '실내필터(보덴)', isIncentive: false },
    { code: 'DS', isPrefix: true, category: 'engine_oil', label: '합성오일(DS)', isIncentive: false },
    { code: 'ZY', isPrefix: true, category: 'misc_parts', label: '기타부품/용품', isIncentive: false },
    { code: 'G0', isPrefix: true, category: 'inspection', label: '검사', isIncentive: false },
    { code: 'NN', isPrefix: true, category: 'parts', label: '부품(기타)', isIncentive: false },
    { code: 'ZZ', isPrefix: true, category: 'accessories', label: '용품/TPMS', isIncentive: false },
    { code: '00', isPrefix: true, category: 'general', label: '일반부품/서비스', isIncentive: false },
  ];
  for (const m of mappings) {
    await prisma.productCodeMapping.upsert({
      where: { code: m.code },
      create: m,
      update: m,
    });
  }
  console.log('✅ 상품코드 매핑 27개 입력');

  // 4. 팀 인센티브 기존 데이터 이관
  const teamData: Record<string, Record<string, { sales: number; qty: number }>> = {
    '25년 9월': { brake_oil:{sales:4860000,qty:68}, lining:{sales:5540000,qty:63}, mission_oil:{sales:1820000,qty:13}, diff_oil:{sales:55000,qty:1}, wiper:{sales:327500,qty:0}, battery:{sales:2148000,qty:18}, ac_filter:{sales:824000,qty:34}, guardian_h3:{sales:0,qty:0}, guardian_h5:{sales:0,qty:0}, guardian_h7:{sales:0,qty:0} },
    '25년 10월': { brake_oil:{sales:3140000,qty:44}, lining:{sales:8385000,qty:82}, mission_oil:{sales:1455000,qty:11}, diff_oil:{sales:110000,qty:2}, wiper:{sales:815000,qty:0}, battery:{sales:3476000,qty:26}, ac_filter:{sales:420000,qty:12}, guardian_h3:{sales:0,qty:0}, guardian_h5:{sales:179000,qty:4}, guardian_h7:{sales:55000,qty:1} },
    '25년 11월': { brake_oil:{sales:1770000,qty:26}, lining:{sales:4490000,qty:53}, mission_oil:{sales:1950000,qty:17}, diff_oil:{sales:50000,qty:1}, wiper:{sales:395000,qty:0}, battery:{sales:2925000,qty:20}, ac_filter:{sales:700000,qty:22}, guardian_h3:{sales:0,qty:0}, guardian_h5:{sales:0,qty:0}, guardian_h7:{sales:0,qty:0} },
    '25년 12월': { brake_oil:{sales:2630000,qty:37}, lining:{sales:3880000,qty:49}, mission_oil:{sales:1985000,qty:15}, diff_oil:{sales:110000,qty:2}, wiper:{sales:640000,qty:0}, battery:{sales:5770000,qty:36}, ac_filter:{sales:430000,qty:16}, guardian_h3:{sales:33000,qty:1}, guardian_h5:{sales:0,qty:0}, guardian_h7:{sales:0,qty:0} },
    '26년 1월': { brake_oil:{sales:3070000,qty:44}, lining:{sales:5654000,qty:60}, mission_oil:{sales:3190000,qty:24}, diff_oil:{sales:275000,qty:5}, wiper:{sales:590000,qty:0}, battery:{sales:5611531,qty:37}, ac_filter:{sales:280000,qty:10}, guardian_h3:{sales:66000,qty:2}, guardian_h5:{sales:0,qty:0}, guardian_h7:{sales:55000,qty:1} },
    '26년 2월': { brake_oil:{sales:2870000,qty:42}, lining:{sales:2147000,qty:24}, mission_oil:{sales:3170000,qty:23}, diff_oil:{sales:625000,qty:8}, wiper:{sales:240000,qty:0}, battery:{sales:3596000,qty:23}, ac_filter:{sales:240000,qty:10}, guardian_h3:{sales:0,qty:0}, guardian_h5:{sales:35000,qty:1}, guardian_h7:{sales:0,qty:0} },
    '26년 3월': { brake_oil:{sales:70000,qty:1}, lining:{sales:160000,qty:2}, mission_oil:{sales:0,qty:0}, diff_oil:{sales:0,qty:0}, wiper:{sales:0,qty:0}, battery:{sales:0,qty:0}, ac_filter:{sales:0,qty:0}, guardian_h3:{sales:0,qty:0}, guardian_h5:{sales:0,qty:0}, guardian_h7:{sales:0,qty:0} },
  };

  for (const [month, items] of Object.entries(teamData)) {
    const uploadDate = new Date(`20${month.slice(0,2)}-${month.includes('9월') ? '09' : month.includes('10') ? '10' : month.includes('11') ? '11' : month.includes('12') ? '12' : month.includes('1월') ? '01' : month.includes('2월') ? '02' : '03'}-28`);
    for (const [itemKey, val] of Object.entries(items)) {
      await prisma.incentiveData.upsert({
        where: { month_uploadDate_itemKey: { month, uploadDate, itemKey } },
        create: { month, uploadDate, itemKey, sales: val.sales, qty: val.qty },
        update: { sales: val.sales, qty: val.qty },
      });
    }
  }
  console.log('✅ 팀 인센티브 7개월 데이터 이관');

  // 5. 김권중 데이터
  const managerData = [
    { month: '26년 1월', tireSales: 94805329, alignmentSales: 6586000 },
    { month: '26년 2월', tireSales: 60442700, alignmentSales: 3962000 },
  ];
  for (const d of managerData) {
    const uploadDate = new Date(`2026-${d.month.includes('1월') ? '01' : '02'}-28`);
    await prisma.managerIncentiveData.upsert({
      where: { month_uploadDate: { month: d.month, uploadDate } },
      create: { month: d.month, uploadDate, tireSales: d.tireSales, alignmentSales: d.alignmentSales },
      update: { tireSales: d.tireSales, alignmentSales: d.alignmentSales },
    });
  }
  console.log('✅ 김권중 데이터 2개월 입력');

  // 6. 이정석 데이터
  const directorData = [
    { month: '25년 1월', totalRevenue: 141652790 },
    { month: '25년 2월', totalRevenue: 119870650 },
    { month: '25년 3월', totalRevenue: 141360490 },
    { month: '25년 4월', totalRevenue: 152106207 },
    { month: '25년 5월', totalRevenue: 145727900 },
    { month: '25년 6월', totalRevenue: 125293560 },
    { month: '25년 7월', totalRevenue: 161988450 },
    { month: '25년 8월', totalRevenue: 158435400 },
    { month: '25년 9월', totalRevenue: 167255850 },
    { month: '25년 10월', totalRevenue: 185396590 },
    { month: '25년 11월', totalRevenue: 175339060 },
    { month: '25년 12월', totalRevenue: 212235800 },
    { month: '26년 1월', totalRevenue: 151283851 },
    { month: '26년 2월', totalRevenue: 105127200 },
  ];
  for (const d of directorData) {
    const yearNum = parseInt(d.month.slice(0,2));
    const monthStr = d.month.match(/(\d+)월/)?.[1] || '01';
    const uploadDate = new Date(`20${yearNum}-${monthStr.padStart(2, '0')}-28`);
    await prisma.directorIncentiveData.upsert({
      where: { month_uploadDate: { month: d.month, uploadDate } },
      create: { month: d.month, uploadDate, totalRevenue: d.totalRevenue },
      update: { totalRevenue: d.totalRevenue },
    });
  }
  console.log('✅ 이정석 데이터 14개월 입력');

  console.log('🎉 시드 완료!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
