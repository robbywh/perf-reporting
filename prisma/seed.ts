import { PrismaClient } from "@prisma/client";

import { seedCategories } from "./seeds/category";
import { seedEngineers } from "./seeds/engineer";
import { seedJobLevels } from "./seeds/jobLevel";
import { seedRoles } from "./seeds/role";
import { seedStatuses } from "./seeds/status";
import { sedTags } from "./seeds/tag";
import { seedUsers } from "./seeds/user";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedRoles();
  await seedUsers();
  await seedCategories();
  await seedStatuses();
  await seedJobLevels();
  await seedEngineers();
  await sedTags();

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
