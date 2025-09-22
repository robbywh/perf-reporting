/*
  Warnings:

  - You are about to drop the column `organization_id` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "tag" DROP CONSTRAINT "tag_organization_id_fkey";

-- DropIndex
DROP INDEX "tag_name_organization_id_key";

-- AlterTable
ALTER TABLE "category" DROP COLUMN "organization_id";

-- AlterTable
ALTER TABLE "tag" DROP COLUMN "organization_id";

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");
