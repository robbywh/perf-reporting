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
  engineerId: number
): Promise<MRDetailsResponse> {
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
