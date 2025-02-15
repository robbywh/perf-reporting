import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedEngineers() {
  const engineers = [
    {
      id: 60769508,
      name: "Aaron Christopher Tanhar",
      jobLevelId: "junior",
      gitlabUserId: 4137283,
    },
    {
      id: 48866530,
      name: "Gharis Primada Hariyono",
      jobLevelId: "junior",
      gitlabUserId: 11777097,
    },
    {
      id: 37572723,
      name: "Faturachman Yusup",
      jobLevelId: "associate",
      gitlabUserId: 10113672,
    },
    {
      id: 37686742,
      name: "Adiwinoto Saptorenggo",
      jobLevelId: "sa",
      gitlabUserId: 14688406,
    },
    {
      id: 5753351,
      name: "Brian Wahyu Anggriawan",
      jobLevelId: "sa",
      gitlabUserId: 7740557,
    },
    {
      id: 88989996,
      name: "Reinaldi Mukti",
      jobLevelId: "sa",
      gitlabUserId: 22144192,
    },
  ];

  for (const engineer of engineers) {
    await prisma.engineer.upsert({
      where: { id: engineer.id },
      update: {
        name: engineer.name,
        jobLevelId: engineer.jobLevelId,
        gitlabUserId: engineer.gitlabUserId,
      },
      create: engineer,
    });
  }

  console.log("✅ Engineers seeded!");
}
