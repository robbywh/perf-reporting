import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedEngineers() {
  const engineers = [
    { id: 60769508, name: "Aaron Christopher Tanhar", jobLevelId: "junior" },
    { id: 48866530, name: "Gharis Primada Hariyono", jobLevelId: "junior" },
    { id: 37572723, name: "Faturachman Yusup", jobLevelId: "associate" },
    { id: 37686742, name: "Adiwinto Saptorenggo", jobLevelId: "sa" },
    { id: 5753351, name: "Brian Wahyu Anggriawan", jobLevelId: "sa" },
    { id: 88989996, name: "Reinaldi Mukti", jobLevelId: "sa" },
  ];

  for (const engineer of engineers) {
    await prisma.engineer.upsert({
      where: { id: engineer.id },
      update: {},
      create: engineer,
    });
  }

  console.log("✅ Engineers seeded!");
}
