import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedJobLevels() {
  const jobLevels = [
    {
      id: "intern",
      name: "Internship",
      baseline: 31.5,
      target: 42,
      baselineCh: 25,
      targetCh: 50,
    },
    {
      id: "junior",
      name: "Junior",
      baseline: 45,
      target: 60,
      baselineCh: 25,
      targetCh: 50,
    },
    {
      id: "associate",
      name: "Associate",
      baseline: 51.75,
      target: 69,
      baselineCh: 25,
      targetCh: 50,
    },
    {
      id: "sa",
      name: "Senior Associate",
      baseline: 58.5,
      target: 78,
      baselineCh: 25,
      targetCh: 50,
    },
    {
      id: "tl",
      name: "Tech Lead",
      baseline: 49.5,
      target: 66,
      baselineCh: 25,
      targetCh: 50,
    },
    {
      id: "sp",
      name: "Specialist",
      baseline: 63,
      target: 84,
      baselineCh: 25,
      targetCh: 50,
    },
    {
      id: "ss",
      name: "Senior Specialist",
      baseline: 72,
      target: 96,
      baselineCh: 25,
      targetCh: 50,
    },
  ];

  for (const level of jobLevels) {
    await prisma.jobLevel.upsert({
      where: { id: level.id },
      update: {
        name: level.name,
        baseline: level.baseline,
        target: level.target,
        baselineCh: level.baselineCh,
        targetCh: level.targetCh,
      },
      create: level,
    });
  }

  console.log("✅ Job Levels seeded!");
}
