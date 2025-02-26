import { prisma } from "../db";

export async function findTodaySprints() {
  const today = new Date();

  const sprints = await prisma.sprint.findMany({
    where: {
      startDate: { lte: today }, // startDate should be less than or equal to today
      endDate: { gte: today }, // endDate should be greater than or equal to today
    },
  });

  return sprints;
}

export async function findAllSprints() {
  const sprints = await prisma.sprint.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "desc" },
    take: 12,
  });

  return sprints;
}

export async function findSprintsWithLeavesAndHolidays(sprintIds: string[]) {
  const sprints = await prisma.sprint.findMany({
    where: {
      id: { in: sprintIds },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      sprintEngineers: {
        select: {
          engineer: {
            select: {
              id: true,
              name: true,
              leaves: {
                select: {
                  date: true,
                  description: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const publicHolidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: sprints[sprints.length - 1]?.startDate,
        lte: sprints[0]?.endDate,
      },
    },
    select: {
      date: true,
      description: true,
    },
  });

  return sprints.map((sprint) => ({
    sprintName: sprint.name,
    leaves: sprint.sprintEngineers.flatMap((se) =>
      se.engineer.leaves.map((leave) => ({
        name: se.engineer.name,
        description: leave.description,
        date: leave.date.toISOString(),
      }))
    ),
    holidays: publicHolidays
      .filter(
        (holiday) =>
          holiday.date >= sprint.startDate && holiday.date <= sprint.endDate
      )
      .map((holiday) => ({
        description: holiday.description,
        date: holiday.date.toISOString(),
      })),
  }));
}
