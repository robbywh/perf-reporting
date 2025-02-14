import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function seedStatuses() {
  const statuses = [
    { id: "sc9016065588869_xhji2iEMC", name: "product approval" },
    { id: "sc9016061131456_z9zbGfMu", name: "in progress" },
    { id: "sc9016061131456_L4uXhMyj", name: "product review" },
    { id: "sc9016061131456_98bF6Teg", name: "to do" },
    { id: "sc9016061131456_3y8eeJKg", name: "tech review" },
    { id: "sc9016061131456_JIJhOTF5", name: "ready for qa" },
    { id: "sc9016061131456_dTVTGQHR", name: "qa review" },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { id: status.id },
      update: {},
      create: status,
    });
  }

  console.log("✅ Statuses seeded!");
}
