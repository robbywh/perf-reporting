-- CreateTable
CREATE TABLE "gitlab" (
    "id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,

    CONSTRAINT "gitlab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_gitlab" (
    "gitlab_id" INTEGER NOT NULL,
    "sprint_id" VARCHAR(25) NOT NULL,

    CONSTRAINT "sprint_gitlab_pkey" PRIMARY KEY ("gitlab_id","sprint_id")
);

-- AddForeignKey
ALTER TABLE "sprint_gitlab" ADD CONSTRAINT "sprint_gitlab_gitlab_id_fkey" FOREIGN KEY ("gitlab_id") REFERENCES "gitlab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_gitlab" ADD CONSTRAINT "sprint_gitlab_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
