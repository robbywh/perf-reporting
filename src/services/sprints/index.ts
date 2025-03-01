import { Decimal } from "@prisma/client/runtime/library";

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
                  engineerId: true,
                  date: true,
                  description: true,
                  type: true,
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
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    leaves: sprint.sprintEngineers.flatMap((se) =>
      se.engineer.leaves.map((leave) => ({
        engineerId: se.engineer.id,
        name: se.engineer.name,
        description: leave.description,
        date: leave.date.toISOString(),
        type: leave.type,
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

export async function findSprintsBySprintIds(
  sprintIds: string[],
  engineerId?: number
) {
  const sprints = await prisma.sprint.findMany({
    where: {
      id: { in: sprintIds },
      ...(engineerId && {
        sprintEngineers: {
          some: {
            engineerId,
          },
        },
      }),
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      sprintEngineers: {
        ...(engineerId && {
          where: {
            engineerId,
          },
        }),
        select: {
          codingHours: true,
          codingHoursUrl: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return sprints.map((sprint) => ({
    ...sprint,
    sprintEngineers: sprint.sprintEngineers.map((se) => ({
      ...se,
      codingHours:
        se.codingHours instanceof Decimal
          ? se.codingHours.toNumber()
          : se.codingHours,
      codingHoursUrl: se.codingHoursUrl ? se.codingHoursUrl.toString() : null,
    })),
  }));
}
