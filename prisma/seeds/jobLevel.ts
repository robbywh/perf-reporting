import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedJobLevels() {
  const jobLevels = [
    { id: "intern", name: "Internship", baseline: 31.5, target: 42 },
    { id: "junior", name: "Junior", baseline: 45, target: 60 },
    { id: "associate", name: "Associate", baseline: 51.75, target: 69 },
    { id: "sa", name: "Senior Associate", baseline: 58.5, target: 78 },
    { id: "tl", name: "Tech Lead", baseline: 49.5, target: 66 },
    { id: "sp", name: "Specialist", baseline: 63, target: 84 },
    { id: "ss", name: "Senior Specialist", baseline: 72, target: 96 },
  ];

  for (const level of jobLevels) {
    await prisma.jobLevel.upsert({
      where: { id: level.id },
      update: {
        name: level.name,
        baseline: level.baseline,
        target: level.target,
      },
      create: level,
    });
  }

  console.log("✅ Job Levels seeded!");
}
