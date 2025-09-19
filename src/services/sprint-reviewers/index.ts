import { APPROVED_STATUS_IDS } from "@/constants/client";
import { CACHE_STRATEGY } from "@/constants/server";
import { prisma } from "@/services/db";

export interface QATaskBreakdown {
  count: number;
  data: string[];
}

export interface QAPerformanceData {
  reviewerId: number;
  reviewerName: string;
  rejectedTasks: QATaskBreakdown;
  scenarioTasks: QATaskBreakdown;
  approvedTasks: QATaskBreakdown;
  supportedTasks: QATaskBreakdown;
  totalCount: number;
}

export async function findQAPerformanceBySprintIds(sprintIds: string[]): Promise<QAPerformanceData[]> {
  // Get all QA tasks for the specified sprints (including scenario and support)
  const tasks = await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      statusId: { in: APPROVED_STATUS_IDS },
      OR: [
        { name: { startsWith: "[QA]", mode: "insensitive" } },
        { name: { startsWith: "QA", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      statusId: true,
      reviewers: {
        select: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["qaPerformance"],
    },
  });

  // Initialize response structure with reviewers
  const reviewerMap: Record<string, QAPerformanceData> = {};

  // Process tasks and organize by reviewer
  tasks.forEach((task) => {
    const taskName = task.name?.toLowerCase() || '';

    // Handle tasks with no reviewers
    if (task.reviewers.length === 0) {
      const noReviewerKey = "No Reviewer";

      // Initialize No Reviewer entry if not exists
      if (!reviewerMap[noReviewerKey]) {
        reviewerMap[noReviewerKey] = {
          reviewerId: 0, // Special ID for No Reviewer
          reviewerName: noReviewerKey,
          rejectedTasks: { count: 0, data: [] },
          scenarioTasks: { count: 0, data: [] },
          approvedTasks: { count: 0, data: [] },
          supportedTasks: { count: 0, data: [] },
          totalCount: 0,
        };
      }

      // Process different categories with Tasks to QA consistent approved/rejected logic
      if (taskName.includes("[scenario]")) {
        reviewerMap[noReviewerKey].scenarioTasks.count++;
        reviewerMap[noReviewerKey].scenarioTasks.data.push(task.name || '');
      }
      else if (taskName.includes("[support]")) {
        reviewerMap[noReviewerKey].supportedTasks.count++;
        reviewerMap[noReviewerKey].supportedTasks.data.push(task.name || '');
      }
      // For Tasks to QA consistency: approved/rejected logic must match exactly
      else if (taskName.includes("[rejected]")) {
        reviewerMap[noReviewerKey].rejectedTasks.count++;
        reviewerMap[noReviewerKey].rejectedTasks.data.push(task.name || '');
      }
      // All other QA tasks are considered approved (same logic as Tasks to QA)
      else {
        reviewerMap[noReviewerKey].approvedTasks.count++;
        reviewerMap[noReviewerKey].approvedTasks.data.push(task.name || '');
      }
    }

    // Process each reviewer for this task
    task.reviewers.forEach((taskReviewer) => {
      const reviewerId = taskReviewer.reviewer.id;
      const reviewerName = taskReviewer.reviewer.name;

      // Initialize reviewer data if not exists
      if (!reviewerMap[reviewerName]) {
        reviewerMap[reviewerName] = {
          reviewerId,
          reviewerName,
          rejectedTasks: { count: 0, data: [] },
          scenarioTasks: { count: 0, data: [] },
          approvedTasks: { count: 0, data: [] },
          supportedTasks: { count: 0, data: [] },
          totalCount: 0,
        };
      }

      // Process different categories with Tasks to QA consistent approved/rejected logic
      if (taskName.includes("[scenario]")) {
        reviewerMap[reviewerName].scenarioTasks.count++;
        reviewerMap[reviewerName].scenarioTasks.data.push(task.name || '');
      }
      else if (taskName.includes("[support]")) {
        reviewerMap[reviewerName].supportedTasks.count++;
        reviewerMap[reviewerName].supportedTasks.data.push(task.name || '');
      }
      // For Tasks to QA consistency: approved/rejected logic must match exactly
      else if (taskName.includes("[rejected]")) {
        reviewerMap[reviewerName].rejectedTasks.count++;
        reviewerMap[reviewerName].rejectedTasks.data.push(task.name || '');
      }
      // All other QA tasks are considered approved (same logic as Tasks to QA)
      else {
        reviewerMap[reviewerName].approvedTasks.count++;
        reviewerMap[reviewerName].approvedTasks.data.push(task.name || '');
      }
    });
  });

  // Calculate total counts and filter out reviewers with no tasks
  const result = Object.values(reviewerMap).map(reviewer => {
    reviewer.totalCount =
      reviewer.rejectedTasks.count +
      reviewer.scenarioTasks.count +
      reviewer.approvedTasks.count +
      reviewer.supportedTasks.count;
    return reviewer;
  }).filter(reviewer => reviewer.totalCount > 0);

  return result;
}

export interface ReviewerDetailedTask {
  id: string;
  name: string;
  status: string | null;
  taskType: 'scenario' | 'rejected' | 'supported';
}

export interface ReviewerTasksDetail {
  reviewerId: number;
  reviewerName: string;
  scenarios: ReviewerDetailedTask[];
  rejected: ReviewerDetailedTask[];
  supported: ReviewerDetailedTask[];
  totalCounts: {
    scenarioCount: number;
    rejectedCount: number;
    supportedCount: number;
  };
}

export async function findReviewerTasksDetailBySprintIds(
  reviewerId: number,
  sprintIds: string[]
): Promise<ReviewerTasksDetail | null> {
  // Get reviewer info
  const reviewer = await prisma.reviewer.findUnique({
    where: { id: reviewerId },
    select: { id: true, name: true },
  });

  if (!reviewer) {
    return null;
  }

  // Get all tasks reviewed by this reviewer for the given sprints
  const taskReviewers = await prisma.taskReviewer.findMany({
    where: {
      reviewerId,
      sprintId: { in: sprintIds },
    },
    select: {
      task: {
        select: {
          id: true,
          name: true,
          status: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: [`reviewerTasks_${reviewerId}`],
    },
  });

  // Get summary counts from sprint reviewers
  const sprintReviewers = await prisma.sprintReviewer.findMany({
    where: {
      reviewerId,
      sprintId: { in: sprintIds },
    },
    select: {
      scenarioCount: true,
      rejectedCount: true,
      supportedCount: true,
    },
  });

  // Aggregate counts
  const totalCounts = sprintReviewers.reduce(
    (acc: { scenarioCount: number; rejectedCount: number; supportedCount: number }, sr) => {
      acc.scenarioCount += sr.scenarioCount ?? 0;
      acc.rejectedCount += sr.rejectedCount ?? 0;
      acc.supportedCount += sr.supportedCount ?? 0;
      return acc;
    },
    { scenarioCount: 0, rejectedCount: 0, supportedCount: 0 }
  );

  // Categorize tasks based on name patterns
  const scenarios: ReviewerDetailedTask[] = [];
  const rejected: ReviewerDetailedTask[] = [];
  const supported: ReviewerDetailedTask[] = [];

  taskReviewers.forEach(({ task }) => {
    const taskName = task.name?.toLowerCase() || '';

    const taskDetail: ReviewerDetailedTask = {
      id: task.id,
      name: task.name || '',
      status: task.status?.name || null,
      taskType: 'scenario', // default
    };

    if (taskName.includes('[scenario]')) {
      taskDetail.taskType = 'scenario';
      scenarios.push(taskDetail);
    } else if (taskName.includes('[rejected]')) {
      taskDetail.taskType = 'rejected';
      rejected.push(taskDetail);
    } else if (taskName.includes('[support]')) {
      taskDetail.taskType = 'supported';
      supported.push(taskDetail);
    } else {
      // Default to scenario if no specific pattern
      scenarios.push(taskDetail);
    }
  });

  return {
    reviewerId: reviewer.id,
    reviewerName: reviewer.name,
    scenarios,
    rejected,
    supported,
    totalCounts,
  };
}

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
