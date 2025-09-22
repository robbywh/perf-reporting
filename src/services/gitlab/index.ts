import { CACHE_STRATEGY } from "@/constants/server";
import { prisma } from "@/services/db";

export interface MRDetail {
  gitlabId: number;
  title: string;
}

export interface MRDetailsResponse {
  mrDetails: MRDetail[];
  totalMRSubmitted: number;
  averageMRSubmitted: number;
}

export async function findMRDetailsBySprintIdsAndEngineerId(
  sprintIds: string[],
  engineerId: number,
): Promise<MRDetailsResponse> {
  const sprintKey =
    sprintIds.length === 1
      ? sprintIds[0]
      : sprintIds.sort().join("_").substring(0, 20);

  const mrData = await prisma.sprintGitlab.findMany({
    where: {
      sprintId: { in: sprintIds },
      engineerId,
    },
    select: {
      gitlabId: true,
      gitlab: {
        select: {
          title: true,
        },
      },
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: [`mr_details_eng_${engineerId}`, `sprints_${sprintKey}`],
    },
  });

  const mrDetails: MRDetail[] = mrData.map((mr) => ({
    gitlabId: mr.gitlabId,
    title: mr.gitlab.title,
  }));

  const totalMRSubmitted = mrDetails.length;
  const averageMRSubmitted =
    sprintIds.length > 0
      ? Number((totalMRSubmitted / sprintIds.length).toFixed(2))
      : 0;

  return {
    mrDetails,
    totalMRSubmitted,
    averageMRSubmitted,
  };
}
