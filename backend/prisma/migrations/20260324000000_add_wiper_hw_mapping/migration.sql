-- 와이퍼 매핑 추가 (2026-03-24)
-- 1) HW* 코드(HWVW*, HWYW*) 와이퍼 제품들이 인센티브 집계에 누락되던 문제 수정
--    HW로 시작하는 상품 10종 전수 조사 → 전부 와이퍼 제품
-- 2) NN00000000030 "A와이퍼(데이터용)" — 와이퍼 매출 데이터 입력용 특수코드
--    NN prefix(parts)에 먹혀서 wiper로 분류 안 됨 → 정확 매칭 추가
--    classifyProduct()는 exact match를 prefix보다 우선 처리하므로 안전

-- HW prefix → wiper
INSERT INTO "ProductCodeMapping" ("id", "code", "isPrefix", "category", "label", "isIncentive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'HW', true, 'wiper', '와이퍼', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "category" = 'wiper',
  "label" = '와이퍼',
  "isIncentive" = true,
  "isPrefix" = true,
  "updatedAt" = now();

-- NN00000000030 exact → wiper (NN prefix보다 우선 매칭)
INSERT INTO "ProductCodeMapping" ("id", "code", "isPrefix", "category", "label", "isIncentive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'NN00000000030', false, 'wiper', '와이퍼(데이터용)', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "category" = 'wiper',
  "label" = '와이퍼(데이터용)',
  "isIncentive" = true,
  "isPrefix" = false,
  "updatedAt" = now();
