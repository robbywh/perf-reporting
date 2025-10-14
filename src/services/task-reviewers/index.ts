import { APPROVED_STATUS_NAMES, SPECIAL_TASK_PREFIXES } from "@/constants/client";
import { prisma } from "@/services/db";

interface TaskReviewer {
  id: string;
  assignees?: { id: number; username: string }[];
  sprintId: string;
  storyPoint: number;
  statusName: string;
  name?: string;
  taskTags?: { tagId: string }[];
  organizationId?: string;
}

export async function linkReviewersToTask(task: TaskReviewer) {
  if (!task.id) {
    console.error(
      "❌ Task ID is null or undefined, skipping reviewer linking.",
    );
    return;
  }

  if (!task.name) {
    console.warn(
      `⚠️ Task name is null or undefined for Task ID ${task.id}, using empty string.`,
    );
  }

  if (!task.assignees || task.assignees.length === 0) {
    console.warn(`🟡 No reviewers found for Task ID ${task.id}, skipping.`);
    return;
  }

  // ✅ Ensure the task exists to prevent foreign key errors
  const existingTask = await prisma.task.findUnique({
    where: {
      id_sprintId: {
        id: task.id,
        sprintId: task.sprintId,
      },
    },
    select: { id: true, sprintId: true },
  });

  if (!existingTask) {
    console.error(
      `❌ Task ID ${task.id} in Sprint ${task.sprintId} does not exist in the database, skipping.`,
    );
    return;
  }

  // ✅ Fetch all reviewers in one query for performance, filtered by organization
  const reviewerIds = task.assignees.map((a) => a.id);
  const reviewerQuery: {
    id: { in: number[] };
    reviewerOrganizations?: { some: { organizationId: string } };
  } = { id: { in: reviewerIds } };

  // If organizationId is provided, filter reviewers by organization
  if (task.organizationId) {
    reviewerQuery.reviewerOrganizations = {
      some: {
        organizationId: task.organizationId,
      },
    };
  }

  const existingReviewers = await prisma.reviewer.findMany({
    where: reviewerQuery,
    select: { id: true },
  });

  const existingReviewerSet = new Set(
    existingReviewers.map((reviewer: { id: number }) => reviewer.id),
  );
  const taskReviewerData = [];

  // Check task name patterns (with null/undefined safety)
  const taskNameLower = task.name?.toLowerCase() || "";
  const isQATask =
    (taskNameLower.includes(SPECIAL_TASK_PREFIXES.QA.toLowerCase()) || taskNameLower.includes("qa:")) &&
    !taskNameLower.includes(SPECIAL_TASK_PREFIXES.SCENARIO.toLowerCase());
  const isScenarioTask = taskNameLower.includes(SPECIAL_TASK_PREFIXES.SCENARIO.toLowerCase());
  const scenarioCount =
    taskNameLower.includes(SPECIAL_TASK_PREFIXES.SCENARIO.toLowerCase()) && task?.storyPoint
      ? task.storyPoint
      : 1;
  const isRejectedTask = taskNameLower.includes(SPECIAL_TASK_PREFIXES.REJECTED.toLowerCase());
  const isSupportedTask = taskNameLower.includes(SPECIAL_TASK_PREFIXES.SUPPORT.toLowerCase());

  for (const assignee of task.assignees) {
    // Only process if the assignee is also a reviewer
    if (!existingReviewerSet.has(assignee.id)) {
      console.warn(
        `⏩ Skipping ${assignee.username} - Not a reviewer for this task.`,
      );
      continue;
    }

    taskReviewerData.push({
      taskId: task.id,
      reviewerId: assignee.id,
      sprintId: task.sprintId,
    });

    if (APPROVED_STATUS_NAMES.includes(task.statusName)) {
      await prisma.sprintReviewer.upsert({
        where: {
          sprintId_reviewerId: {
            sprintId: task.sprintId,
            reviewerId: assignee.id,
          },
        },
        create: {
          sprintId: task.sprintId,
          reviewerId: assignee.id,
          taskCount: isQATask ? 1 : 0,
          rejectedCount: isRejectedTask ? 1 : 0,
          scenarioCount: isScenarioTask ? scenarioCount : 0,
          supportedCount: isSupportedTask ? 1 : 0,
        },
        update: {
          taskCount: isQATask ? { increment: 1 } : undefined,
          rejectedCount: isRejectedTask ? { increment: 1 } : undefined,
          scenarioCount: isScenarioTask
            ? { increment: scenarioCount }
            : undefined,
          supportedCount: isSupportedTask ? { increment: 1 } : undefined,
        },
      });
    }
  }

  if (taskReviewerData.length > 0) {
    // ✅ Use batch `createMany()` for efficiency
    await prisma.taskReviewer.createMany({
      data: taskReviewerData,
      skipDuplicates: true, // Avoid duplicate inserts
    });

    console.log(
      `✅ ${taskReviewerData.length} reviewers linked to Task ID ${task.id} in Sprint ${task.sprintId}.`,
    );
  }
}
