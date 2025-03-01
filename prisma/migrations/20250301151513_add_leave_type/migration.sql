/*
  Warnings:

  - Added the required column `type` to the `leave` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('half_day_before_break', 'half_day_after_break', 'full_day');

-- AlterTable
ALTER TABLE "leave" ADD COLUMN     "type" "LeaveType" NOT NULL;
