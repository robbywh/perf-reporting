import { prisma } from "../db";

export async function findRoleIdAndEngineerIdByUserId(
  userId: string
): Promise<{ roleId: string | null; engineerId: number | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: { select: { id: true } }, // Fetch only the role id
      engineerId: true, // Fetch the engineerId if it exists
    },
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["findRoleIdAndEngineerIdByUserId"],
    },
  });

  return {
    roleId: user?.role?.id ?? null,
    engineerId: user?.engineerId ?? null,
  };
}

export async function findEngineerById(engineerId: number) {
  const engineer = await prisma.engineer.findUnique({
    where: { id: engineerId },
    select: {
      id: true,
      name: true,
    },
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["findEngineerById"],
    },
  });

  if (!engineer) return null;

  // Extract first name from the full name
  const firstName = engineer.name.split(" ")[0];

  return {
    ...engineer,
    firstName,
  };
}
