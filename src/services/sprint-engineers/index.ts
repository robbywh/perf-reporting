import { Decimal } from "@prisma/client/runtime/library";

import { adjustBaselineTarget } from "@/actions/leave-holiday";
import { getMergedMRsBySprintPeriod } from "@/lib/gitlab/mr"; // Ensure this function is defined
import { prisma } from "@/services/db";

export async function linkSprintsToEngineers(sprintId: string) {
  try {
    // ✅ Fetch Sprint start_date and end_date
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { startDate: true, endDate: true },
    });

    if (!sprint) {
      console.log(`❌ Sprint ID ${sprintId} not found.`);
      return;
    }

    const { startDate: sprintStartDate, endDate: sprintEndDate } = sprint;

    // ✅ Fetch merged MRs within the sprint period
    const allMergedMRs = await getMergedMRsBySprintPeriod(
      sprintStartDate.toISOString(),
      sprintEndDate.toISOString()
    );

    // ✅ Count MRs per assignee
    const mrCountByAssignee = new Map<number, number>();
    for (const merged of allMergedMRs) {
      const assigneeId = merged.assignee?.id;
      if (!assigneeId) continue;

      mrCountByAssignee.set(
        assigneeId,
        (mrCountByAssignee.get(assigneeId) || 0) + 1
      );
    }

    // ✅ Fetch engineers & job levels
    const engineers = await prisma.engineer.findMany({
      select: {
        id: true,
        gitlabUserId: true, // Ensure engineer has a GitLab user ID
        jobLevelId: true,
        jobLevel: {
          select: {
            baseline: true,
            target: true,
            baselineCh: true,
            targetCh: true,
          },
        },
      },
    });

    // ✅ Process each engineer in parallel using `Promise.all()`
    await Promise.all(
      engineers.map(
        async (engineer: {
          id: string;
          gitlabUserId: number | null;
          jobLevelId: string | null;
          jobLevel: {
            baseline: number;
            target: number;
            baselineCh: number;
            targetCh: number;
          };
        }) => {
          const {
            id: engineerId,
            gitlabUserId,
            jobLevelId,
            jobLevel,
          } = engineer;

          if (!gitlabUserId) {
            console.log(
              `⏩ Skipping Engineer ID ${engineerId} - No GitLab user ID.`
            );
            return;
          }

          if (!jobLevelId) {
            console.log(
              `⏩ Skipping Engineer ID ${engineerId} - No job level found.`
            );
            return;
          }

          const { baseline, target, baselineCh, targetCh } = jobLevel;

          // ✅ Get merged count for this engineer
          const mergedCount = mrCountByAssignee.get(gitlabUserId) || 0;

          // ✅ First create/update the sprint engineer record with original values
          await prisma.sprintEngineer.upsert({
            where: { sprintId_engineerId: { sprintId, engineerId } },
            update: {
              jobLevelId,
              baseline,
              target,
              storyPoints: 0,
              mergedCount,
            },
            create: {
              sprintId,
              engineerId,
              jobLevelId,
              baseline,
              target,
              baselineCh,
              targetCh,
              mergedCount,
              storyPoints: 0,
            },
          });

          // ✅ Then adjust baseline and target based on leaves and holidays
          await adjustBaselineTarget(
            sprintStartDate,
            Number(engineerId), // Convert string to number
            null,
            false,
            prisma
          );

          console.log(
            `✅ Sprint Engineer Updated: Sprint ${sprintId}, Engineer ${engineerId}, Job Level: ${jobLevelId}, Merged Count: ${mergedCount}`
          );
        }
      )
    );
  } catch (error) {
    console.error(
      `❌ Error updating sprint engineers for Sprint ${sprintId}:`,
      error
    );
  }
}

// Define the expected return type
interface SprintCapacityReality {
  sprintId: string;
  sprintName: string;
  totalStoryPoints: number;
  totalBaseline: number;
  totalTarget: number;
}

export async function findCapacityVsRealityBySprintIds(
  sprintIds: string[]
): Promise<SprintCapacityReality[]> {
  const sprints = await prisma.sprint.findMany({
    where: { id: { in: sprintIds } },
    select: {
      id: true,
      name: true,
      sprintEngineers: {
        select: {
          storyPoints: true,
          baseline: true,
          target: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
  // Map and aggregate the results
  return sprints.map((sprint: any) => {
    const totalStoryPoints = sprint.sprintEngineers.reduce(
      (sum: number, se: any) =>
        sum +
        (se.storyPoints instanceof Decimal
          ? se.storyPoints.toNumber()
          : Number(se.storyPoints || 0)),
      0
    );

    const totalBaseline = sprint.sprintEngineers.reduce(
      (sum: number, se: { baseline: Decimal | number | null }) =>
        sum +
        (se.baseline instanceof Decimal
          ? se.baseline.toNumber()
          : Number(se.baseline || 0)),
      0
    );

    const totalTarget = sprint.sprintEngineers.reduce(
      (sum: number, se: { target: Decimal | number | null }) =>
        sum +
        (se.target instanceof Decimal
          ? se.target.toNumber()
          : Number(se.target || 0)),
      0
    );

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      totalStoryPoints,
      totalBaseline,
      totalTarget,
    };
  });
}

export async function findTopPerformersBySprintIds(sprintIds: string[]) {
  const avgStoryPoints = await prisma.sprintEngineer.groupBy({
    by: ["engineerId"], // Group only by engineerId
    where: {
      sprintId: { in: sprintIds },
    },
    _avg: {
      storyPoints: true, // Calculate the average story points
    },
    orderBy: {
      _avg: {
        storyPoints: "desc",
      },
    },
  });

  // Fetch engineer details in one query
  const engineerIds = avgStoryPoints.map(
    (perf: { engineerId: string }) => perf.engineerId
  );

  const engineers = await prisma.engineer.findMany({
    where: { id: { in: engineerIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Merge results
  return avgStoryPoints.map(
    (performer: {
      engineerId: string;
      _avg: { storyPoints: Decimal | number | null };
    }) => {
      const engineer = engineers.find(
        (eng: { id: string }) => eng.id === performer.engineerId
      );
      return {
        id: performer.engineerId,
        name: engineer?.name,
        email: engineer?.email,
        storyPoints:
          performer._avg.storyPoints instanceof Decimal
            ? performer._avg.storyPoints.toNumber()
            : Number(performer._avg.storyPoints || 0),
      };
    }
  );
}

export async function findEngineerTrendBySprintIds(sprintIds: string[]) {
  const sprintStoryPoints = await prisma.sprintEngineer.findMany({
    where: { sprintId: { in: sprintIds } },
    select: {
      sprintId: true,
      sprint: { select: { name: true } },
      engineerId: true,
      engineer: { select: { id: true, name: true } },
      storyPoints: true,
    },
    orderBy: [{ sprintId: "asc" }, { storyPoints: "desc" }],
  });

  const sprintMap = new Map<
    string,
    {
      sprintId: string;
      sprintName: string;
      engineers: { id: number; name: string; storyPoints: number }[];
    }
  >();

  sprintStoryPoints.forEach(
    ({
      sprintId,
      sprint,
      engineer,
      storyPoints,
    }: {
      sprintId: string;
      sprint: { name: string };
      engineer: { id: number; name: string };
      storyPoints: Decimal | number | null;
    }) => {
      if (!sprintMap.has(sprintId)) {
        sprintMap.set(sprintId, {
          sprintId,
          sprintName: sprint.name,
          engineers: [],
        });
      }

      sprintMap.get(sprintId)!.engineers.push({
        id: engineer.id,
        name: engineer.name,
        storyPoints:
          storyPoints instanceof Decimal
            ? storyPoints.toNumber()
            : Number(storyPoints || 0),
      });
    }
  );

  return Array.from(sprintMap.values());
}

export async function findAveragesByEngineerAndSprintIds(
  sprintIds: string[],
  engineerId: number
) {
  // ✅ Fetch all required metrics from `sprintEngineer`
  const sprintEngineerData = await prisma.sprintEngineer.findMany({
    where: { sprintId: { in: sprintIds }, engineerId },
    select: {
      storyPoints: true,
      target: true,
      baseline: true,
      codingHours: true,
      targetCh: true,
      baselineCh: true,
    },
  });

  // Compute averages function (dividing by sprintIds.length)
  const computeAverage = (arr: number[]) =>
    sprintIds.length
      ? Number(
          (
            arr.reduce((sum, v) => (sum ?? 0) + (v ?? 0), 0) / sprintIds.length
          ).toFixed(2)
        )
      : 0;

  return {
    averageStoryPoint: computeAverage(
      sprintEngineerData.map((se: { storyPoints: Decimal | number | null }) =>
        se.storyPoints instanceof Decimal
          ? se.storyPoints.toNumber()
          : Number(se.storyPoints || 0)
      )
    ),
    averageTarget: computeAverage(
      sprintEngineerData.map((se: { target: Decimal | number | null }) =>
        se.target instanceof Decimal
          ? se.target.toNumber()
          : Number(se.target || 0)
      )
    ),
    averageBaseline: computeAverage(
      sprintEngineerData.map((se: { baseline: Decimal | number | null }) =>
        se.baseline instanceof Decimal
          ? se.baseline.toNumber()
          : Number(se.baseline || 0)
      )
    ),
    averageCodingHours: computeAverage(
      sprintEngineerData.map((se: { codingHours: Decimal | number | null }) =>
        se.codingHours instanceof Decimal
          ? se.codingHours.toNumber()
          : Number(se.codingHours || 0)
      )
    ),
    averageTargetCh: computeAverage(
      sprintEngineerData.map((se: { targetCh: Decimal | number | null }) =>
        se.targetCh instanceof Decimal
          ? se.targetCh.toNumber()
          : Number(se.targetCh || 0)
      )
    ),
    averageBaselineCh: computeAverage(
      sprintEngineerData.map((se: { baselineCh: Decimal | number | null }) =>
        se.baselineCh instanceof Decimal
          ? se.baselineCh.toNumber()
          : Number(se.baselineCh || 0)
      )
    ),
  };
}
