import { prisma } from "@/services/db";

export async function linkSprintsToReviewers(sprintId: string, organizationId: string) {
  try {
    if (!sprintId) {
      console.log(`❌ Sprint ID ${sprintId} not found.`);
      return;
    }

    const reviewers = await prisma.reviewer.findMany({
      where: {
        reviewerOrganizations: {
          some: {
            organizationId
          }
        }
      },
      select: {
        id: true,
      },
    });
    await Promise.all(
      reviewers.map(async (reviewer: { id: number }) => {
        const { id: reviewerId } = reviewer;

        await prisma.sprintReviewer.upsert({
          where: { sprintId_reviewerId: { sprintId, reviewerId } },
          update: {
            taskCount: 0,
            rejectedCount: 0,
            scenarioCount: 0,
            supportedCount: 0,
          },
          create: {
            sprintId,
            reviewerId,
            taskCount: 0,
            rejectedCount: 0,
            scenarioCount: 0,
            supportedCount: 0,
          },
        });
        console.log(
          `✅ Sprint Reviewer Updated: Sprint ${sprintId}, Reviewer ${reviewerId}`
        );
      })
    );
  } catch (error) {
    console.error(
      `❌ Error updating sprint reviewers for Sprint ${sprintId}:`,
      error
    );
  }
}
