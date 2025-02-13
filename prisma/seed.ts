import { PrismaClient } from "@prisma/client";

import { seedRoles } from "./seeds/role";
import { seedUsers } from "./seeds/user";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedRoles();
  await seedUsers();

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
