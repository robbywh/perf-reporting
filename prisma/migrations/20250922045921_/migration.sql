/*
  Warnings:

  - You are about to drop the column `organization_id` on the `status` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `status` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."status" DROP CONSTRAINT "status_organization_id_fkey";

-- DropIndex
DROP INDEX "public"."status_name_organization_id_key";

-- AlterTable
ALTER TABLE "public"."status" DROP COLUMN "organization_id";

-- CreateIndex
CREATE UNIQUE INDEX "status_name_key" ON "public"."status"("name");
