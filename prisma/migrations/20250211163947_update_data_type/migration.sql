/*
  Warnings:

  - The primary key for the `sprint` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "sprint" DROP CONSTRAINT "sprint_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "sprint_pkey" PRIMARY KEY ("id");
