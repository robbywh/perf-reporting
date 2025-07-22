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
        swr: 2 * 60, // 2 minutes
        ttl: 10 * 60, // 10 minutes
        tags: ["findAllEngineers"],
      },
    });

    return engineers;
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return [];
  }
}
