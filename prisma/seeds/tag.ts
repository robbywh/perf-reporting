import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function sedTags() {
  const statuses = [
    { id: "nodev", name: "nodev" },
    { id: "support", name: "support" },
    { id: "rejected_staging", name: "rejected staging" },
    { id: "rejected_mainfeat", name: "rejected mainfeat" },
    { id: "rejected_production", name: "rejected production" },
  ];

  for (const status of statuses) {
    await prisma.tag.upsert({
      where: { id: status.id },
      update: {},
      create: status,
    });
  }

  console.log("✅ Tags seeded!");
}
