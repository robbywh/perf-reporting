/*
  Warnings:

  - A unique constraint covering the columns `[sprint_id]` on the table `SprintEngineer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[engineer_id]` on the table `SprintEngineer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SprintEngineer_sprint_id_key" ON "SprintEngineer"("sprint_id");

-- CreateIndex
CREATE UNIQUE INDEX "SprintEngineer_engineer_id_key" ON "SprintEngineer"("engineer_id");
