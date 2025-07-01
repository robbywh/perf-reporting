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

export async function findCurrentAndFutureSprints() {
  const today = new Date();

  const sprints = await prisma.sprint.findMany({
    where: {
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
    take: 14,
    cacheStrategy: {
      swr: 5 * 60,
      ttl: 8 * 60 * 60,
      tags: ["findAllSprints"],
    },
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
                  id: true,
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
      id: true,
      date: true,
      description: true,
    },
  });

  return sprints.map((sprint) => ({
    sprintName: sprint.name,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    leaves: sprint.sprintEngineers.flatMap((se) =>
      se.engineer.leaves
        .filter((leave) => {
          const leaveDate = new Date(leave.date);
          const sprintStart = new Date(sprint.startDate);
          const sprintEnd = new Date(sprint.endDate);
          return leaveDate >= sprintStart && leaveDate <= sprintEnd;
        })
        .map((leave) => ({
          id: leave.id,
          engineerId: se.engineer.id,
          name: se.engineer.name,
          description: leave.description,
          date: leave.date.toISOString(),
          type: leave.type,
        }))
    ),
    holidays: publicHolidays
      .filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        const sprintStart = new Date(sprint.startDate);
        const sprintEnd = new Date(sprint.endDate);
        return holidayDate >= sprintStart && holidayDate <= sprintEnd;
      })
      .map((holiday) => ({
        id: holiday.id,
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
          storyPoints: true,
          baseline: true,
          target: true,
          baselineCh: true,
          targetCh: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  // Helper function to safely convert Decimal to number
  const toNumber = (
    value: Decimal | number | null | undefined
  ): number | null => {
    if (value === null || value === undefined) return null;
    return value instanceof Decimal ? value.toNumber() : Number(value);
  };

  type SprintWithEngineers = {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    sprintEngineers: {
      codingHours: Decimal | number | null;
      codingHoursUrl: string | null;
      storyPoints: Decimal | number | null;
      baseline: Decimal | number | null;
      target: Decimal | number | null;
      baselineCh: Decimal | number | null;
      targetCh: Decimal | number | null;
    }[];
  };

  return sprints.map((sprint: SprintWithEngineers) => ({
    ...sprint,
    sprintEngineers: sprint.sprintEngineers.map(
      (se: SprintWithEngineers["sprintEngineers"][0]) => ({
        codingHours: toNumber(se.codingHours),
        codingHoursUrl: se.codingHoursUrl ? se.codingHoursUrl.toString() : null,
        storyPoints: toNumber(se.storyPoints),
        baseline: toNumber(se.baseline),
        target: toNumber(se.target),
        baselineCh: toNumber(se.baselineCh),
        targetCh: toNumber(se.targetCh),
      })
    ),
  }));
}
