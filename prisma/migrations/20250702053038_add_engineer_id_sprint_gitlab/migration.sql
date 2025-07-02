/*
  Warnings:

  - The primary key for the `sprint_gitlab` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `engineer_id` to the `sprint_gitlab` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sprint_gitlab" DROP CONSTRAINT "sprint_gitlab_pkey",
ADD COLUMN     "engineer_id" INTEGER NOT NULL,
ADD CONSTRAINT "sprint_gitlab_pkey" PRIMARY KEY ("gitlab_id", "sprint_id", "engineer_id");

-- AddForeignKey
ALTER TABLE "sprint_gitlab" ADD CONSTRAINT "sprint_gitlab_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
