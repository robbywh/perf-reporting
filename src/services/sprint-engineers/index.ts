import { Prisma } from "@prisma/client";

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

    const totalSprintDays = 10; // Default sprint length

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

    // ✅ Fetch leave days & public holidays in one query for all engineers
    const [leaveDaysData, publicHolidays] = await Promise.all([
      prisma.leave.groupBy({
        by: ["engineerId"],
        where: { date: { gte: sprintStartDate, lte: sprintEndDate } },
        _count: true,
      }),
      prisma.publicHoliday.count({
        where: { date: { gte: sprintStartDate, lte: sprintEndDate } },
      }),
    ]);

    // Convert leave days to a Map for quick lookup
    const leaveDaysMap = new Map(
      leaveDaysData.map((leave) => [leave.engineerId, leave._count])
    );

    // ✅ Process each engineer in parallel using `Promise.all()`
    await Promise.all(
      engineers.map(async (engineer) => {
        const { id: engineerId, gitlabUserId, jobLevelId, jobLevel } = engineer;

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
        const baselineStoryPoints = Number(baseline.toString());
        const targetStoryPoints = Number(target.toString());

        const leaveDays = leaveDaysMap.get(engineerId) || 0;
        const availableDays = totalSprintDays - leaveDays - publicHolidays;

        if (availableDays <= 0) {
          console.log(
            `⏩ No available working days for Sprint ${sprintId}, Engineer ${engineerId}`
          );
          return;
        }

        // ✅ Calculate adjusted values
        const adjustedTarget =
          (availableDays * targetStoryPoints) / totalSprintDays;
        const adjustedBaseline =
          (availableDays * baselineStoryPoints) / totalSprintDays;

        // ✅ Get merged count for this engineer
        const mergedCount = mrCountByAssignee.get(gitlabUserId) || 0;

        // ✅ Upsert into `sprint_engineer` table
        await prisma.sprintEngineer.upsert({
          where: { sprintId_engineerId: { sprintId, engineerId } },
          update: {
            jobLevelId,
            baseline: adjustedBaseline,
            target: adjustedTarget,
            storyPoints: 0,
            mergedCount,
          },
          create: {
            sprintId,
            engineerId,
            jobLevelId,
            baseline: adjustedBaseline,
            target: adjustedTarget,
            baselineCh,
            targetCh,
            mergedCount,
            storyPoints: 0,
          },
        });

        console.log(
          `✅ Sprint Engineer Updated: Sprint ${sprintId}, Engineer ${engineerId}, Job Level: ${jobLevelId}, Merged Count: ${mergedCount}`
        );
      })
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
}

export async function findCapacityVsRealityBySprintIds(
  sprintIds: string[]
): Promise<SprintCapacityReality[]> {
  const sprintEngineer: {
    sprintId: string;
    sprintName: string;
    totalStoryPoints: Prisma.Decimal | null;
    totalBaseline: Prisma.Decimal | null;
  }[] = await prisma.$queryRaw`
    SELECT 
      se.sprint_id AS "sprintId", 
      s.name AS "sprintName", 
      COALESCE(SUM(se.story_points), 0) AS "totalStoryPoints", 
      COALESCE(SUM(se.baseline), 0) AS "totalBaseline"
    FROM sprint s
    JOIN sprint_engineer se ON s.id = se.sprint_id
    WHERE se.sprint_id IN (${Prisma.join(sprintIds)})
    GROUP BY se.sprint_id, s.name
    ORDER BY se.sprint_id ASC;
  `;

  // Convert Prisma Decimal values to plain JavaScript numbers
  return sprintEngineer.map((sprint) => ({
    sprintId: sprint.sprintId,
    sprintName: sprint.sprintName, // Use actual sprint name
    totalStoryPoints: sprint.totalStoryPoints
      ? Number(sprint.totalStoryPoints)
      : 0,
    totalBaseline: sprint.totalBaseline ? Number(sprint.totalBaseline) : 0,
  }));
}
