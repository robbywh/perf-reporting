import { prisma } from "../db";

export async function getTodaySprints() {
  const today = new Date();

  const sprints = await prisma.sprint.findMany({
    where: {
      startDate: { lte: today }, // startDate should be less than or equal to today
      endDate: { gte: today }, // endDate should be greater than or equal to today
    },
  });

  // const sprints = await prisma.sprint.findMany();
  return sprints;
}
