-- CreateTable
CREATE TABLE "reviewer" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50),

    CONSTRAINT "reviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_reviewer" (
    "task_id" VARCHAR(25) NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "sprint_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "task_reviewer_pkey" PRIMARY KEY ("task_id","reviewer_id","sprint_id")
);

-- CreateTable
CREATE TABLE "sprint_reviewer" (
    "sprint_id" VARCHAR(25) NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "task_count" INTEGER,
    "scenario_count" INTEGER,
    "rejected_count" INTEGER,

    CONSTRAINT "sprint_reviewer_pkey" PRIMARY KEY ("sprint_id","reviewer_id")
);

-- AddForeignKey
ALTER TABLE "task_reviewer" ADD CONSTRAINT "task_reviewer_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reviewer" ADD CONSTRAINT "task_reviewer_task_id_sprint_id_fkey" FOREIGN KEY ("task_id", "sprint_id") REFERENCES "task"("id", "sprint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_reviewer" ADD CONSTRAINT "sprint_reviewer_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_reviewer" ADD CONSTRAINT "sprint_reviewer_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
