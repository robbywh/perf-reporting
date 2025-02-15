import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { NODE_ENV } from "@/constants/server.constant";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  }).$extends(withAccelerate());

if (NODE_ENV !== "production") globalForPrisma.prisma = prisma;
