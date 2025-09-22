import { CACHE_STRATEGY } from "@/constants/server";
import { prisma } from "@/services/db";

export async function findEngineerOrganization(
  engineerId: number,
): Promise<string | null> {
  try {
    const engineerOrg = await prisma.engineerOrganization.findFirst({
      where: { engineerId },
      select: { organizationId: true },
      cacheStrategy: {
        ...CACHE_STRATEGY.DEFAULT,
        tags: ["findEngineerOrganization"],
      },
    });

    return engineerOrg?.organizationId || null;
  } catch (error) {
    console.error("Error fetching engineer organization:", error);
    return null;
  }
}

export async function findAllEngineers(organizationId?: string) {
  try {
    const engineers = await prisma.engineer.findMany({
      where: organizationId
        ? {
            engineerOrganizations: {
              some: {
                organizationId,
              },
            },
          }
        : undefined,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      cacheStrategy: {
        ...CACHE_STRATEGY.DEFAULT,
        tags: ["findAllEngineers"],
      },
    });

    return engineers;
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return [];
  }
}
