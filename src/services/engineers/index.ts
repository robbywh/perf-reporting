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
      cacheStrategy: {
        swr: 5 * 60,
        ttl: 8 * 60 * 60,
        tags: ["findAllEngineers"],
      },
    });

    return engineers;
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return [];
  }
}
