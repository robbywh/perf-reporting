-- CreateTable
CREATE TABLE "engineer_organization" (
    "engineer_id" INTEGER NOT NULL,
    "organization_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "engineer_organization_pkey" PRIMARY KEY ("engineer_id","organization_id")
);

-- CreateTable
CREATE TABLE "reviewer_organization" (
    "reviewer_id" INTEGER NOT NULL,
    "organization_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "reviewer_organization_pkey" PRIMARY KEY ("reviewer_id","organization_id")
);

-- Migrate existing engineer-organization relationships
INSERT INTO "engineer_organization" ("engineer_id", "organization_id")
SELECT "id", "organization_id" FROM "engineer" WHERE "organization_id" IS NOT NULL;

-- Migrate existing reviewer-organization relationships  
INSERT INTO "reviewer_organization" ("reviewer_id", "organization_id")
SELECT "id", "organization_id" FROM "reviewer" WHERE "organization_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "engineer" DROP CONSTRAINT "engineer_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "reviewer" DROP CONSTRAINT "reviewer_organization_id_fkey";

-- AlterTable
ALTER TABLE "engineer" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "reviewer" DROP COLUMN "organization_id";

-- AddForeignKey
ALTER TABLE "engineer_organization" ADD CONSTRAINT "engineer_organization_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_organization" ADD CONSTRAINT "engineer_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_organization" ADD CONSTRAINT "reviewer_organization_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_organization" ADD CONSTRAINT "reviewer_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;