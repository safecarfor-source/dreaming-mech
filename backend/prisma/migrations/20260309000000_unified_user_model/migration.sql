-- 통합 회원 시스템: Customer + Owner → User

-- 1. BusinessStatus enum 생성
CREATE TYPE "BusinessStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- 2. User 테이블 생성
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "kakaoId" TEXT NOT NULL,
    "email" TEXT,
    "nickname" TEXT,
    "profileImage" TEXT,
    "phone" TEXT,
    "businessStatus" "BusinessStatus" NOT NULL DEFAULT 'NONE',
    "businessLicenseUrl" TEXT,
    "businessName" TEXT,
    "address" TEXT,
    "rejectionReason" TEXT,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "deactivatedAt" TIMESTAMP(3),
    "signupInquiryId" INTEGER,
    "trackingCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");
CREATE INDEX "User_kakaoId_idx" ON "User"("kakaoId");
CREATE INDEX "User_businessStatus_idx" ON "User"("businessStatus");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_trackingCode_idx" ON "User"("trackingCode");

-- 3. 데이터 마이그레이션: Customer → User
INSERT INTO "User" ("kakaoId", "email", "nickname", "phone", "trackingCode", "businessStatus", "createdAt", "updatedAt")
SELECT "kakaoId", "email", "nickname", "phone", "trackingCode", 'NONE'::"BusinessStatus", "createdAt", "updatedAt"
FROM "Customer";

-- 4. 데이터 마이그레이션: Owner → User (같은 kakaoId면 병합, 없으면 신규)
-- 4a. 같은 kakaoId가 이미 User에 있는 경우 (Customer였던 Owner) → 병합
UPDATE "User" u SET
    "profileImage" = o."profileImage",
    "businessStatus" = CASE o."status"
        WHEN 'PENDING' THEN 'PENDING'::"BusinessStatus"
        WHEN 'APPROVED' THEN 'APPROVED'::"BusinessStatus"
        WHEN 'REJECTED' THEN 'REJECTED'::"BusinessStatus"
        WHEN 'DEACTIVATED' THEN 'NONE'::"BusinessStatus"
    END,
    "businessLicenseUrl" = o."businessLicenseUrl",
    "businessName" = o."businessName",
    "address" = o."address",
    "rejectionReason" = o."rejectionReason",
    "isProtected" = o."isProtected",
    "deactivatedAt" = o."deactivatedAt",
    "signupInquiryId" = o."signupInquiryId",
    "nickname" = COALESCE(u."nickname", o."name")
FROM "Owner" o
WHERE u."kakaoId" = o."kakaoId";

-- 4b. kakaoId가 User에 없는 Owner → 신규 삽입
INSERT INTO "User" ("kakaoId", "email", "nickname", "profileImage", "phone", "businessStatus",
    "businessLicenseUrl", "businessName", "address", "rejectionReason",
    "isProtected", "deactivatedAt", "signupInquiryId", "createdAt", "updatedAt")
SELECT o."kakaoId", o."email", o."name", o."profileImage", o."phone",
    CASE o."status"
        WHEN 'PENDING' THEN 'PENDING'::"BusinessStatus"
        WHEN 'APPROVED' THEN 'APPROVED'::"BusinessStatus"
        WHEN 'REJECTED' THEN 'REJECTED'::"BusinessStatus"
        WHEN 'DEACTIVATED' THEN 'NONE'::"BusinessStatus"
    END,
    o."businessLicenseUrl", o."businessName", o."address", o."rejectionReason",
    o."isProtected", o."deactivatedAt", o."signupInquiryId", o."createdAt", o."updatedAt"
FROM "Owner" o
WHERE o."kakaoId" IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."kakaoId" = o."kakaoId");

-- 5. Mechanic: ownerId → userId
ALTER TABLE "Mechanic" ADD COLUMN "userId" INTEGER;

UPDATE "Mechanic" m SET "userId" = u."id"
FROM "Owner" o
JOIN "User" u ON u."kakaoId" = o."kakaoId"
WHERE m."ownerId" = o."id";

ALTER TABLE "Mechanic" ADD CONSTRAINT "Mechanic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Mechanic_userId_idx" ON "Mechanic"("userId");

-- 이전 FK 제거
ALTER TABLE "Mechanic" DROP CONSTRAINT IF EXISTS "Mechanic_ownerId_fkey";
DROP INDEX IF EXISTS "Mechanic_ownerId_idx";
ALTER TABLE "Mechanic" DROP COLUMN "ownerId";

-- 6. ServiceInquiry: customerId → userId
ALTER TABLE "ServiceInquiry" ADD COLUMN "userId" INTEGER;

UPDATE "ServiceInquiry" si SET "userId" = u."id"
FROM "Customer" c
JOIN "User" u ON u."kakaoId" = c."kakaoId"
WHERE si."customerId" = c."id";

ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ServiceInquiry_userId_idx" ON "ServiceInquiry"("userId");

-- 이전 FK 제거
ALTER TABLE "ServiceInquiry" DROP CONSTRAINT IF EXISTS "ServiceInquiry_customerId_fkey";
DROP INDEX IF EXISTS "ServiceInquiry_customerId_idx";
ALTER TABLE "ServiceInquiry" DROP COLUMN "customerId";

-- 7. Post: customerId/ownerId/authorRole → userId
ALTER TABLE "Post" ADD COLUMN "userId" INTEGER;

-- Customer 작성 글
UPDATE "Post" p SET "userId" = u."id"
FROM "Customer" c
JOIN "User" u ON u."kakaoId" = c."kakaoId"
WHERE p."customerId" = c."id" AND p."authorRole" = 'CUSTOMER';

-- Owner 작성 글
UPDATE "Post" p SET "userId" = u."id"
FROM "Owner" o
JOIN "User" u ON u."kakaoId" = o."kakaoId"
WHERE p."ownerId" = o."id" AND p."authorRole" = 'OWNER';

ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- 이전 FK/컬럼 제거
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_customerId_fkey";
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_ownerId_fkey";
DROP INDEX IF EXISTS "Post_authorRole_idx";
DROP INDEX IF EXISTS "Post_customerId_idx";
DROP INDEX IF EXISTS "Post_ownerId_idx";
ALTER TABLE "Post" DROP COLUMN "authorRole";
ALTER TABLE "Post" DROP COLUMN "customerId";
ALTER TABLE "Post" DROP COLUMN "ownerId";

-- 8. Comment: customerId/ownerId/authorRole → userId
ALTER TABLE "Comment" ADD COLUMN "userId" INTEGER;

UPDATE "Comment" c2 SET "userId" = u."id"
FROM "Customer" c
JOIN "User" u ON u."kakaoId" = c."kakaoId"
WHERE c2."customerId" = c."id" AND c2."authorRole" = 'CUSTOMER';

UPDATE "Comment" c2 SET "userId" = u."id"
FROM "Owner" o
JOIN "User" u ON u."kakaoId" = o."kakaoId"
WHERE c2."ownerId" = o."id" AND c2."authorRole" = 'OWNER';

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_customerId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_ownerId_fkey";
DROP INDEX IF EXISTS "Comment_customerId_idx";
DROP INDEX IF EXISTS "Comment_ownerId_idx";
ALTER TABLE "Comment" DROP COLUMN "authorRole";
ALTER TABLE "Comment" DROP COLUMN "customerId";
ALTER TABLE "Comment" DROP COLUMN "ownerId";

-- 9. PostLike: customerId/ownerId/authorRole → userId
-- 먼저 unique 제약 제거
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "unique_customer_like";
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "unique_owner_like";

ALTER TABLE "PostLike" ADD COLUMN "userId" INTEGER;

UPDATE "PostLike" pl SET "userId" = u."id"
FROM "Customer" c
JOIN "User" u ON u."kakaoId" = c."kakaoId"
WHERE pl."customerId" = c."id" AND pl."authorRole" = 'CUSTOMER';

UPDATE "PostLike" pl SET "userId" = u."id"
FROM "Owner" o
JOIN "User" u ON u."kakaoId" = o."kakaoId"
WHERE pl."ownerId" = o."id" AND pl."authorRole" = 'OWNER';

ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 새 unique 제약
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");

ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "PostLike_customerId_fkey";
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "PostLike_ownerId_fkey";
ALTER TABLE "PostLike" DROP COLUMN "authorRole";
ALTER TABLE "PostLike" DROP COLUMN "customerId";
ALTER TABLE "PostLike" DROP COLUMN "ownerId";

-- 10. TrackingLink: customers → users 관계 (Prisma implicit relation)
-- TrackingLink의 관계는 User.trackingCode → TrackingLink.code로 처리됨
-- FK는 User 테이블에 이미 있음
ALTER TABLE "User" ADD CONSTRAINT "User_trackingCode_fkey" FOREIGN KEY ("trackingCode") REFERENCES "TrackingLink"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- 11. 이전 테이블 삭제
DROP TABLE "Customer" CASCADE;
DROP TABLE "Owner" CASCADE;

-- 12. 사용하지 않는 enum 삭제
DROP TYPE IF EXISTS "OwnerStatus";
DROP TYPE IF EXISTS "AuthorRole";
