-- NN00000000030 "A와이퍼(데이터용)" → wiper 정확 매칭 추가 (2026-03-24)
-- 이 코드로 와이퍼 매출이 기록되지만 NN prefix → parts(비인센티브)에 먹힘
-- classifyProduct()는 exact match > prefix 우선이므로 안전하게 override

INSERT INTO "ProductCodeMapping" ("id", "code", "isPrefix", "category", "label", "isIncentive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'NN00000000030', false, 'wiper', '와이퍼(데이터용)', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "category" = 'wiper',
  "label" = '와이퍼(데이터용)',
  "isIncentive" = true,
  "isPrefix" = false,
  "updatedAt" = now();
