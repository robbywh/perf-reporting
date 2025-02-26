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
  });

  return {
    roleId: user?.role?.id ?? null,
    engineerId: user?.engineerId ?? null,
  };
}
