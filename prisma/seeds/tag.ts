import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTags() {
  const tags = [
    { id: "nodev", name: "nodev" },
    { id: "support", name: "support" },
    { id: "rejected_staging", name: "rejected staging" },
    { id: "rejected_mainfeat", name: "rejected mainfeat" },
    { id: "rejected_production", name: "rejected production" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: {
        name: tag.name,
      },
      create: {
        ...tag,
        organizationId: 'ksi',
      },
    });
  }

  console.log("✅ Tags seeded!");
}
