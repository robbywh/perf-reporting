import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function seedStatuses() {
  const statuses = [
    { id: "product_approval", name: "product approval" },
    { id: "in_progress", name: "in progress" },
    { id: "product_review", name: "product review" },
    { id: "to_do", name: "to do" },
    { id: "tech_review", name: "tech review" },
    { id: "ready_for_qa", name: "ready for qa" },
    { id: "qa_review", name: "qa review" },
    { id: "rejected", name: "rejected" },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { id: status.id },
      update: {
        name: status.name,
      },
      create: status,
    });
  }

  console.log("✅ Statuses seeded!");
}
