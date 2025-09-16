import { Decimal } from "@prisma/client/runtime/library";

import { adjustBaselineTarget } from "@/actions/leave-holiday";
import { getApiConfig } from "@/constants/server";
import { getMergedMRsBySprintPeriod } from "@/lib/gitlab/mr"; // Ensure this function is defined
import { prisma } from "@/services/db";

export async function linkSprintsToEngineers(
  sprintId: string,
  organizationId: string
) {
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

    // Get API configuration from database
    const apiConfig = await getApiConfig(organizationId);

    if (!apiConfig.GITLAB_PERSONAL_ACCESS_TOKEN || !apiConfig.GITLAB_GROUP_ID) {
      console.log(
        "❌ Missing GitLab API configuration, skipping GitLab integration"
      );
      return;
    }

    // ✅ Fetch merged MRs within the sprint period
    const allMergedMRs = await getMergedMRsBySprintPeriod(
      sprintStartDate.toISOString(),
      sprintEndDate.toISOString(),
      apiConfig.GITLAB_BASE_URL!,
      apiConfig.GITLAB_PERSONAL_ACCESS_TOKEN,
      apiConfig.GITLAB_GROUP_ID
    );

    // ✅ Fetch engineers & job levels filtered by organization using many-to-many relationship
    const engineers = await prisma.engineer.findMany({
      where: {
        engineerOrganizations: {
          some: {
            organizationId,
          },
        },
      },
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
      cacheStrategy: {
        swr: 2 * 60, // 2 minutes
        ttl: 10 * 60, // 10 minutes
        tags: [`allEngineers_${organizationId}`],
      },
    });

    // ✅ Create a map for fast engineer lookup by GitLab user ID
    const engineerByGitlabId = new Map<number, (typeof engineers)[0]>();
    engineers.forEach((engineer) => {
      if (engineer.gitlabUserId) {
        engineerByGitlabId.set(engineer.gitlabUserId, engineer);
      }
    });

    // ✅ Upsert GitLab MRs to gitlab table and create sprint_gitlab records
    const mrCountByAssignee = new Map<number, number>();
    const sprintGitlabBatch: { gitlabId: number; engineerId: number }[] = [];

    // ✅ First, batch upsert all GitLab MRs in batches of 50 with timeouts
    console.log(
      `🔄 Processing ${allMergedMRs.length} GitLab MRs in batches of 50`
    );

    const batchSize = 50;
    for (let i = 0; i < allMergedMRs.length; i += batchSize) {
      const batch = allMergedMRs.slice(i, i + batchSize);

      try {
        await Promise.race([
          Promise.all(
            batch.map((merged) =>
              prisma.gitlab.upsert({
                where: { id: merged.id },
                update: { title: merged.title },
                create: { id: merged.id, title: merged.title },
              })
            )
          ),
          new Promise((_resolve, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    `GitLab MR batch ${i + 1}-${Math.min(i + batchSize, allMergedMRs.length)} timeout`
                  )
                ),
              30000
            )
          ),
        ]);

        console.log(
          `✅ Processed GitLab MR batch ${i + 1}-${Math.min(i + batchSize, allMergedMRs.length)}/${allMergedMRs.length}`
        );
      } catch (error) {
        console.error(
          `❌ Error processing GitLab MR batch ${i + 1}-${Math.min(i + batchSize, allMergedMRs.length)}:`,
          error
        );
        // Continue with next batch instead of failing completely
      }
    }

    // ✅ Process MRs for sprint_gitlab relationships and counting
    for (const merged of allMergedMRs) {
      const assigneeId = merged.assignee?.id;
      if (!assigneeId) continue;

      // ✅ Find the engineer by GitLab user ID using the map
      const engineer = engineerByGitlabId.get(assigneeId);

      if (engineer) {
        sprintGitlabBatch.push({
          gitlabId: merged.id,
          engineerId: engineer.id,
        });

        console.log(
          `✅ GitLab MR queued for linking: MR ${merged.id} -> Sprint ${sprintId}, Engineer ${engineer.id}`
        );
      } else {
        console.log(
          `⚠️ Engineer not found for GitLab user ID ${assigneeId} for MR ${merged.id}`
        );
      }

      mrCountByAssignee.set(
        assigneeId,
        (mrCountByAssignee.get(assigneeId) || 0) + 1
      );
    }

    // ✅ Batch insert sprint_gitlab records
    if (sprintGitlabBatch.length > 0) {
      try {
        const values = sprintGitlabBatch
          .map(
            ({ gitlabId, engineerId }) =>
              `(${gitlabId}, '${sprintId}', ${engineerId})`
          )
          .join(", ");

        await prisma.$executeRawUnsafe(`
          INSERT INTO sprint_gitlab (gitlab_id, sprint_id, engineer_id)
          VALUES ${values}
          ON CONFLICT (gitlab_id, sprint_id, engineer_id) DO NOTHING
        `);

        console.log(
          `✅ Batch inserted ${sprintGitlabBatch.length} sprint_gitlab records`
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log(
          `❌ Error batch inserting sprint_gitlab records: ${errorMessage}`
        );

        // Fallback to individual inserts
        for (const { gitlabId, engineerId } of sprintGitlabBatch) {
          try {
            await prisma.$executeRaw`
              INSERT INTO sprint_gitlab (gitlab_id, sprint_id, engineer_id)
              VALUES (${gitlabId}, ${sprintId}, ${engineerId})
              ON CONFLICT (gitlab_id, sprint_id, engineer_id) DO NOTHING
            `;
          } catch (individualError: unknown) {
            const individualErrorMessage =
              individualError instanceof Error
                ? individualError.message
                : "Unknown error";
            console.log(
              `ℹ️ Sprint GitLab record may already exist: MR ${gitlabId}, Sprint ${sprintId}, Engineer ${engineerId} - ${individualErrorMessage}`
            );
          }
        }
      }
    }

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
          engineerId, // No need for conversion, using the actual type
          null,
          false,
          prisma
        );

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
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["capacityVsReality"],
    },
  });
  // Map and aggregate the results
  return sprints.map(
    (sprint: {
      id: string;
      name: string;
      sprintEngineers: {
        storyPoints: Decimal | number | null;
        baseline: Decimal | number | null;
        target: Decimal | number | null;
      }[];
    }) => {
      const totalStoryPoints = sprint.sprintEngineers.reduce(
        (sum: number, se: { storyPoints: Decimal | number | null }) =>
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
    }
  );
}

export async function findTopPerformersBySprintIds(sprintIds: string[]) {
  // Get average story points per engineer
  const avgStoryPoints = await prisma.sprintEngineer.groupBy({
    by: ["engineerId"], // Group only by engineerId
    where: {
      sprintId: { in: sprintIds },
    },
    _avg: {
      storyPoints: true, // Calculate the average story points
      target: true, // Calculate the average target
    },
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["topPerformers"],
    },
  });

  // Fetch engineer details in one query
  const engineerIds = avgStoryPoints.map((perf) => perf.engineerId);

  const engineers = await prisma.engineer.findMany({
    where: { id: { in: engineerIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["allPerformers"],
    },
  });

  // Merge results
  const performersWithCompletion = avgStoryPoints.map((performer) => {
    const engineer = engineers.find((eng) => eng.id === performer.engineerId);
    const storyPoints =
      performer._avg.storyPoints instanceof Decimal
        ? performer._avg.storyPoints.toNumber()
        : Number(performer._avg.storyPoints || 0);
    const target =
      performer._avg.target instanceof Decimal
        ? performer._avg.target.toNumber()
        : Number(performer._avg.target || 0);

    // Calculate completion percentage (0 if target is 0 to avoid division by zero)
    const completionPercentage = target > 0 ? (storyPoints / target) * 100 : 0;

    return {
      id: performer.engineerId,
      name: engineer?.name,
      email: engineer?.email,
      storyPoints,
      target,
      completionPercentage,
    };
  });

  // Sort by completion percentage in descending order
  return performersWithCompletion.sort(
    (a, b) => b.completionPercentage - a.completionPercentage
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
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["sprintStoryPoints"],
    },
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
    cacheStrategy: {
      swr: 2 * 60, // 2 minutes
      ttl: 10 * 60, // 10 minutes
      tags: ["findAveragesByEngineerAndSprintIds"],
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
