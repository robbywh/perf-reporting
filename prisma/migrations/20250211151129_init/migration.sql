-- CreateTable
CREATE TABLE "sprint" (
    "id" VARCHAR(25) NOT NULL,
    "name" VARCHAR(25) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprint_pkey" PRIMARY KEY ("id")
);
