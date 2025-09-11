import { PrismaClient } from "@prisma/client";

import { seedCategories } from "./seeds/category";
import { seedEngineers } from "./seeds/engineer";
import { seedJobLevels } from "./seeds/jobLevel";
import { seedOrganizationSettings } from "./seeds/organization-settings";
import { seedReviewers } from "./seeds/reviewer";
import { seedRoles } from "./seeds/role";
import { seedStatuses } from "./seeds/status";
import { seedTags } from "./seeds/tag";
import { seedUsers } from "./seeds/user";
import { seedUserOrganizations } from "./seeds/user-organization";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await seedOrganizationSettings();
  await seedRoles();
  await seedJobLevels();
  await seedEngineers();
  await seedReviewers();
  await seedUsers();
  await seedUserOrganizations();
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
