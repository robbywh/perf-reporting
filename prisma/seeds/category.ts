import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function seedCategories() {
  const categories = [
    { id: "9352bb43-ace7-4f35-85c9-fb101c5f0965", name: "NEW FEATURE" },
    { id: "ab55a284-78f0-4d25-a1dc-8cab4fea57cb", name: "ENHANCE" },
    { id: "bb2d2a1d-8e4d-4138-9ea6-a9606776bba5", name: "TECH DEBT" },
    { id: "096eb5c6-2364-4076-9a53-119e2d820d93", name: "ISSUE" },
    { id: "b3974cae-b350-4f37-a2b4-5a607de5fa46", name: "DOC" },
    { id: "8abc3a7f-3a04-4160-9634-17b79825734f", name: "DIGITAL MARKETING" },
    { id: "24d4b008-7400-4589-a83b-e7d8728ca302", name: "SUPPORT" },
    { id: "be8f3850-eae3-4bf2-b59b-126cf94fd0d2", name: "CUSTOM EVENT" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
      },
      create: category,
    });
  }

  console.log("✅ Categories seeded!");
}
