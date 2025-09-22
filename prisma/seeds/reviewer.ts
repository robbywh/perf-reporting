import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedReviewers() {
  const reviewers = [
    {
      id: 37577436,
      name: "Furnawan",
      email: "furnawan@komunal.co.id",
    },
    {
      id: 54695071,
      name: "Yusril Ihza Mahendra",
      email: "yusril.mahendra@komunal.co.id",
    },
  ];

  for (const reviewer of reviewers) {
    // First, upsert the reviewer without organization relationship
    await prisma.reviewer.upsert({
      where: { id: reviewer.id },
      update: {
        name: reviewer.name,
      },
      create: {
        ...reviewer,
      },
    });

    // Then, create the reviewer-organization relationship
    await prisma.reviewerOrganization.upsert({
      where: {
        reviewerId_organizationId: {
          reviewerId: reviewer.id,
          organizationId: "ksi",
        },
      },
      update: {},
      create: {
        reviewerId: reviewer.id,
        organizationId: "ksi",
      },
    });
  }

  console.log("✅ Reviewers seeded!");
}
