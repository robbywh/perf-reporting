import { PrismaClient } from "@prisma/client";

import { seedCategories } from "./seeds/category";
import { seedRoles } from "./seeds/role";
import { seedStatuses } from "./seeds/status";
import { seedUsers } from "./seeds/user";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedRoles();
  await seedUsers();
  await seedCategories();
  await seedStatuses();

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
