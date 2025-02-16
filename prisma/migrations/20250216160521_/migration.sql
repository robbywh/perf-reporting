-- CreateTable
CREATE TABLE "Role" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(36) NOT NULL,
    "username" VARCHAR(36) NOT NULL,
    "role_id" VARCHAR(25) NOT NULL,
    "engineer_id" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(36) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sprint_id" VARCHAR(25) NOT NULL,
    "status_id" VARCHAR(25),
    "category_id" VARCHAR(36),
    "parent_task_id" VARCHAR(25),
    "story_point" DECIMAL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTag" (
    "task_id" VARCHAR(25) NOT NULL,
    "tag_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("task_id","tag_id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "task_id" VARCHAR(25) NOT NULL,
    "engineer_id" INTEGER NOT NULL,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("task_id","engineer_id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engineer" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "job_level_id" VARCHAR(25) NOT NULL,
    "gitlab_user_id" INTEGER,

    CONSTRAINT "Engineer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLevel" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "baseline" DECIMAL NOT NULL,
    "target" DECIMAL NOT NULL,
    "baseline_ch" DECIMAL,
    "target_ch" DECIMAL,

    CONSTRAINT "JobLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintEngineer" (
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

    CONSTRAINT "SprintEngineer_pkey" PRIMARY KEY ("sprint_id","engineer_id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" INTEGER NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engineer_id" INTEGER NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" INTEGER NOT NULL,
    "description" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_engineer_id_key" ON "User"("engineer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "Sprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "Engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engineer" ADD CONSTRAINT "Engineer_job_level_id_fkey" FOREIGN KEY ("job_level_id") REFERENCES "JobLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintEngineer" ADD CONSTRAINT "SprintEngineer_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "Sprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintEngineer" ADD CONSTRAINT "SprintEngineer_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "Engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_engineer_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "Engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
