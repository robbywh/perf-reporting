import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function seedRoles() {
  const roles = [
    { id: "se", name: "Software Engineer" },
    { id: "em", name: "Engineering Manager" },
    { id: "pm", name: "Product Manager" },
    { id: "vp", name: "VP of Technology" },
    { id: "cto", name: "Chief Technology Officer" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
      },
      create: role,
    });
  }

  console.log("✅ Roles seeded!");
}
