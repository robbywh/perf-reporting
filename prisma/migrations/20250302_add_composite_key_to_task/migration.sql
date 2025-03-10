-- Step 1: Add sprintId to task_tag and task_assignee tables
ALTER TABLE "task_tag" ADD COLUMN "sprint_id" VARCHAR(25);
ALTER TABLE "task_assignee" ADD COLUMN "sprint_id" VARCHAR(25);

-- Step 2: Populate the new sprint_id columns from the related tasks
UPDATE "task_tag" tt
SET "sprint_id" = t."sprint_id"
FROM "task" t
WHERE tt."task_id" = t."id";

UPDATE "task_assignee" ta
SET "sprint_id" = t."sprint_id"
FROM "task" t
WHERE ta."task_id" = t."id";

-- Step 3: Make sprint_id NOT NULL after populating data
ALTER TABLE "task_tag" ALTER COLUMN "sprint_id" SET NOT NULL;
ALTER TABLE "task_assignee" ALTER COLUMN "sprint_id" SET NOT NULL;

-- Step 4: Drop existing foreign key constraints
ALTER TABLE "task_tag" DROP CONSTRAINT IF EXISTS "task_tag_task_id_fkey";
ALTER TABLE "task_assignee" DROP CONSTRAINT IF EXISTS "task_assignee_task_id_fkey";

-- Step 5: Drop the old primary key constraint from task
ALTER TABLE "task" DROP CONSTRAINT IF EXISTS "task_pkey";

-- Step 6: Add new composite primary key to task
ALTER TABLE "task" ADD CONSTRAINT "task_pkey" PRIMARY KEY ("id", "sprint_id");

-- Step 7: Update task_tag primary key to include sprint_id
ALTER TABLE "task_tag" DROP CONSTRAINT IF EXISTS "task_tag_pkey";
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_pkey" PRIMARY KEY ("task_id", "tag_id", "sprint_id");

-- Step 8: Update task_assignee primary key to include sprint_id
ALTER TABLE "task_assignee" DROP CONSTRAINT IF EXISTS "task_assignee_pkey";
ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_pkey" PRIMARY KEY ("task_id", "engineer_id", "sprint_id");

-- Step 9: Add new foreign key constraints with composite keys
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_task_id_sprint_id_fkey"
    FOREIGN KEY ("task_id", "sprint_id") REFERENCES "task"("id", "sprint_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_assignee" ADD CONSTRAINT "task_assignee_task_id_sprint_id_fkey"
    FOREIGN KEY ("task_id", "sprint_id") REFERENCES "task"("id", "sprint_id") ON DELETE RESTRICT ON UPDATE CASCADE; 