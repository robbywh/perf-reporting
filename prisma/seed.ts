import { PrismaClient } from "@prisma/client";

import { seedCategories } from "./seeds/category";
import { seedEngineers } from "./seeds/engineer";
import { seedJobLevels } from "./seeds/jobLevel";
import { seedRoles } from "./seeds/role";
import { seedStatuses } from "./seeds/status";
import { seedTags } from "./seeds/tag";
import { seedUsers } from "./seeds/user";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedRoles();
  await seedJobLevels();
  await seedEngineers();
  await seedUsers();
  await seedCategories();
  await seedStatuses();
  await seedTags();

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
