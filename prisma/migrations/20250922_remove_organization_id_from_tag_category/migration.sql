-- Remove organization_id from category and tag tables

-- First, drop foreign key constraints
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_organization_id_fkey";
ALTER TABLE "tag" DROP CONSTRAINT IF EXISTS "tag_organization_id_fkey";

-- Drop the unique constraint on tag that includes organization_id
DROP INDEX IF EXISTS "tag_name_organization_id_key";

-- Remove organization_id columns
ALTER TABLE "category" DROP COLUMN IF EXISTS "organization_id";
ALTER TABLE "tag" DROP COLUMN IF EXISTS "organization_id";

-- Add unique constraint on tag name (without organization_id)
ALTER TABLE "tag" ADD CONSTRAINT "tag_name_key" UNIQUE ("name");