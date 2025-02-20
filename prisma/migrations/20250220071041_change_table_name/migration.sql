/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Engineer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobLevel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Leave` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PublicHoliday` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sprint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SprintEngineer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskAssignee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Engineer" DROP CONSTRAINT "Engineer_job_level_id_fkey";

-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_engineer_id_fkey";

-- DropForeignKey
ALTER TABLE "SprintEngineer" DROP CONSTRAINT "SprintEngineer_engineer_id_fkey";

-- DropForeignKey
ALTER TABLE "SprintEngineer" DROP CONSTRAINT "SprintEngineer_sprint_id_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_sprint_id_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_status_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_engineer_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskAssignee" DROP CONSTRAINT "TaskAssignee_task_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskTag" DROP CONSTRAINT "TaskTag_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "TaskTag" DROP CONSTRAINT "TaskTag_task_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_engineer_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_role_id_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Engineer";

-- DropTable
DROP TABLE "JobLevel";

-- DropTable
DROP TABLE "Leave";

-- DropTable
DROP TABLE "PublicHoliday";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "Sprint";

-- DropTable
DROP TABLE "SprintEngineer";

-- DropTable
DROP TABLE "Status";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "TaskAssignee";

-- DropTable
DROP TABLE "TaskTag";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "role" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" VARCHAR(36) NOT NULL,
    "username" VARCHAR(36) NOT NULL,
    "role_id" VARCHAR(25) NOT NULL,
    "engineer_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(36) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sprint_id" VARCHAR(25) NOT NULL,
    "status_id" VARCHAR(25),
    "category_id" VARCHAR(36),
    "parent_task_id" VARCHAR(25),
    "story_point" DECIMAL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_tag" (
    "task_id" VARCHAR(25) NOT NULL,
    "tag_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "task_tag_pkey" PRIMARY KEY ("task_id","tag_id")
);

-- CreateTable
CREATE TABLE "task_assignee" (
    "task_id" VARCHAR(25) NOT NULL,
    "engineer_id" INTEGER NOT NULL,

    CONSTRAINT "task_assignee_pkey" PRIMARY KEY ("task_id","engineer_id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "job_level_id" VARCHAR(25) NOT NULL,
    "gitlab_user_id" INTEGER,

    CONSTRAINT "engineer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_level" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "baseline" DECIMAL NOT NULL,
    "target" DECIMAL NOT NULL,
    "baseline_ch" DECIMAL,
    "target_ch" DECIMAL,

    CONSTRAINT "job_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_engineer" (
    "sprint_id" VARCHAR(25) NOT NULL,
    "engineer_id" INTEGER NOT NULL,
    "job_level_id" VARCHAR(25),
    "story_points" DECIMAL DEFAULT 0,
    "baseline" DECIMAL,
    "target" DECIMAL,
    "coding_hours" DECIMAL DEFAULT 0,
    "baseline_ch" DECIMAL,
    "target_ch" DECIMAL,
    "coding_hours_url" VARCHAR(255),
    "merged_count" INTEGER,

    CONSTRAINT "sprint_engineer_pkey" PRIMARY KEY ("sprint_id","engineer_id")
);

-- CreateTable
CREATE TABLE "leave" (
    "id" INTEGER NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engineer_id" INTEGER NOT NULL,

    CONSTRAINT "leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holiday" (
    "id" INTEGER NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_engineer_id_key" ON "user"("engineer_id");

-- CreateIndex
CREATE UNIQUE INDEX "status_name_key" ON "status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer" ADD CONSTRAINT "engineer_job_level_id_fkey" FOREIGN KEY ("job_level_id") REFERENCES "job_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_engineer" ADD CONSTRAINT "sprint_engineer_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_engineer" ADD CONSTRAINT "sprint_engineer_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave" ADD CONSTRAINT "leave_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
