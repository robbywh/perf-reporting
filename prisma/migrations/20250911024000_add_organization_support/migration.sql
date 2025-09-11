-- CreateTable
CREATE TABLE "organization" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organization" (
    "user_id" VARCHAR(36) NOT NULL,
    "organization_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "user_organization_pkey" PRIMARY KEY ("user_id","organization_id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" SERIAL NOT NULL,
    "param" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "organization_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- Insert default organization
INSERT INTO "organization" ("id", "name") VALUES ('ksi', 'PT Komunal Sejahterah Indonesia');

-- Add organization_id columns with default value
ALTER TABLE "category" ADD COLUMN "organization_id" VARCHAR(25) NOT NULL DEFAULT 'ksi';
ALTER TABLE "engineer" ADD COLUMN "organization_id" VARCHAR(25) NOT NULL DEFAULT 'ksi';
ALTER TABLE "reviewer" ADD COLUMN "organization_id" VARCHAR(25) NOT NULL DEFAULT 'ksi';
ALTER TABLE "sprint" ADD COLUMN "organization_id" VARCHAR(25) NOT NULL DEFAULT 'ksi';
ALTER TABLE "status" ADD COLUMN "organization_id" VARCHAR(25) NOT NULL DEFAULT 'ksi';
ALTER TABLE "tag" ADD COLUMN "organization_id" VARCHAR(25) NOT NULL DEFAULT 'ksi';

-- Remove default values after populating
ALTER TABLE "category" ALTER COLUMN "organization_id" DROP DEFAULT;
ALTER TABLE "engineer" ALTER COLUMN "organization_id" DROP DEFAULT;
ALTER TABLE "reviewer" ALTER COLUMN "organization_id" DROP DEFAULT;
ALTER TABLE "sprint" ALTER COLUMN "organization_id" DROP DEFAULT;
ALTER TABLE "status" ALTER COLUMN "organization_id" DROP DEFAULT;
ALTER TABLE "tag" ALTER COLUMN "organization_id" DROP DEFAULT;

-- DropIndex
DROP INDEX "status_name_key";

-- DropIndex
DROP INDEX "tag_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "setting_param_organization_id_key" ON "setting"("param", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "status_name_organization_id_key" ON "status"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_organization_id_key" ON "tag"("name", "organization_id");

-- AddForeignKey
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting" ADD CONSTRAINT "setting_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status" ADD CONSTRAINT "status_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer" ADD CONSTRAINT "engineer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer" ADD CONSTRAINT "reviewer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;