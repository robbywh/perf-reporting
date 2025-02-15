-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_category_id_fkey";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "category_id" SET DATA TYPE VARCHAR(36);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
