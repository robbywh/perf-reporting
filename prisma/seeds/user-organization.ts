import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedUserOrganizations() {
  try {
    // Ensure we have organizations for demonstration
    await prisma.organization.upsert({
      where: { id: "ksi" },
      update: {},
      create: {
        id: "ksi",
        name: "PT Komunal Sejahtera Indonesia",
      },
    });

    await prisma.organization.upsert({
      where: { id: "test-org" },
      update: {},
      create: {
        id: "test-org",
        name: "Test Organization",
      },
    });

    // Seed user-organization relationships
    const userOrganizations = [
      // robbywh (superadmin) has access to both organizations
      {
        userId: "user_2pQwywdUzRGDRiL4nz9NtuCiJfc", // robbywh
        organizationId: "ksi",
      },
      {
        userId: "user_2pQwywdUzRGDRiL4nz9NtuCiJfc", // robbywh
        organizationId: "test-org",
      },
      // Other users get assigned to ksi by default
      {
        userId: "user_2pOMuf777zPYloRhu6uyfKA9XSL", // briananggriawan
        organizationId: "ksi",
      },
      {
        userId: "user_2pQx3Xx7So7537Ju3mbWbs4hFa7", // kikiperwita
        organizationId: "ksi",
      },
      {
        userId: "user_2pQx1z5bBTzhAwNZcsfik6mrAe6", // ekopurnomo
        organizationId: "ksi",
      },
      {
        userId: "user_2pQx0GpqNMWBWZ9CQfacgF4LyQU", // devinmarco
        organizationId: "ksi",
      },
    ];

    for (const userOrg of userOrganizations) {
      await prisma.userOrganization.upsert({
        where: {
          userId_organizationId: {
            userId: userOrg.userId,
            organizationId: userOrg.organizationId,
          },
        },
        update: {},
        create: userOrg,
      });
    }

    console.log("✅ User organizations seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding user organizations:", error);
    throw error;
  }
}
