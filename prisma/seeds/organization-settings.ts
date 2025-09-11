import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedOrganizationSettings() {
  try {
    // Ensure organization exists
    await prisma.organization.upsert({
      where: { id: "ksi" },
      update: {},
      create: {
        id: "ksi",
        name: "PT Komunal Sejahtera Indonesia",
      },
    });

    // Seed settings for KSI organization
    const settings = [
      {
        param: "CLICKUP_FOLDER_ID",
        value: "90160658898",
        organizationId: "ksi",
      },
      {
        param: "GITLAB_GROUP_ID",
        value: "59790118",
        organizationId: "ksi",
      },
    ];

    for (const setting of settings) {
      await prisma.setting.upsert({
        where: {
          param_organizationId: {
            param: setting.param,
            organizationId: setting.organizationId,
          },
        },
        update: {
          value: setting.value,
        },
        create: setting,
      });
    }

    console.log("✅ Organization settings seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding organization settings:", error);
    throw error;
  }
}
