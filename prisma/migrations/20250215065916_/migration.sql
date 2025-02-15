/*
  Warnings:

  - The primary key for the `SprintEngineer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `SprintEngineer` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SprintEngineer_engineer_id_key";

-- DropIndex
DROP INDEX "SprintEngineer_sprint_id_key";

-- AlterTable
ALTER TABLE "SprintEngineer" DROP CONSTRAINT "SprintEngineer_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "SprintEngineer_pkey" PRIMARY KEY ("sprint_id", "engineer_id");
