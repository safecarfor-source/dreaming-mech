-- 와이퍼 HW 접두어 매핑 추가 (2026-03-24)
-- HW* 코드(HWVW*, HWYW*) 와이퍼 제품들이 인센티브 집계에 누락되던 문제 수정
-- HW로 시작하는 상품은 전부 와이퍼 제품임을 확인 완료 (10개 상품 전수 조사)

INSERT INTO "ProductCodeMapping" ("id", "code", "isPrefix", "category", "label", "isIncentive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'HW', true, 'wiper', '와이퍼', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "category" = 'wiper',
  "label" = '와이퍼',
  "isIncentive" = true,
  "isPrefix" = true,
  "updatedAt" = now();
