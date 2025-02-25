import { prisma } from "@/services/db";

export async function findAllEngineers() {
  try {
    const engineers = await prisma.engineer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return engineers;
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return [];
  }
}
