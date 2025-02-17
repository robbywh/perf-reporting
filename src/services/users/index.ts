import { prisma } from "../db";

export async function findRoleIdByUserId(
  userId: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { id: true } } }, // Fetch only the role name
  });

  return user?.role?.id ?? null; // Return role name or null if not found
}
