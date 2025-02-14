-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_status_id_fkey";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "status_id" DROP NOT NULL,
ALTER COLUMN "category_id" DROP NOT NULL,
ALTER COLUMN "story_point" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
