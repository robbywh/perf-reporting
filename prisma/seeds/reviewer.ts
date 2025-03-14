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
    await prisma.reviewer.upsert({
      where: { id: reviewer.id },
      update: {
        name: reviewer.name,
      },
      create: reviewer,
    });
  }

  console.log("✅ Reviewers seeded!");
}
