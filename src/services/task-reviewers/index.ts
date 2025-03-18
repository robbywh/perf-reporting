import { APPROVED_STATUS_NAMES } from "@/constants/client";
import { prisma } from "@/services/db";

interface TaskReviewer {
  id: string;
  assignees?: { id: number; username: string }[];
  sprintId: string;
  storyPoint: number;
  statusName: string;
  name: string;
  taskTags?: { tagId: string }[];
}

export async function linkReviewersToTask(task: TaskReviewer) {
  if (!task.id) {
    console.error(
      "❌ Task ID is null or undefined, skipping reviewer linking."
    );
    return;
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
      `❌ Task ID ${task.id} in Sprint ${task.sprintId} does not exist in the database, skipping.`
    );
    return;
  }

  // ✅ Fetch all reviewers in one query for performance
  const reviewerIds = task.assignees.map((a) => a.id);
  const existingReviewers = await prisma.reviewer.findMany({
    where: { id: { in: reviewerIds } },
    select: { id: true },
  });

  const existingReviewerSet = new Set(existingReviewers.map((e) => e.id));
  const taskReviewerData = [];

  // Check task name patterns
  const isQATask =
    (task.name.toLowerCase().includes("[qa]") ||
      task.name.toLowerCase().includes("qa:")) &&
    !task.name.toLowerCase().includes("[scenario]");
  const isScenarioTask = task.name.toLowerCase().includes("[scenario]");
  const scenarioCount =
    task.name.toLowerCase().includes("[scenario]") && task?.storyPoint
      ? task.storyPoint
      : 1;
  const isRejectedTask = task.name.toLowerCase().includes("[rejected]");
  const isSupportedTask = task.name.toLowerCase().includes("[support]");

  for (const assignee of task.assignees) {
    // Only process if the assignee is also a reviewer
    if (!existingReviewerSet.has(assignee.id)) {
      console.warn(
        `⏩ Skipping ${assignee.username} - Not a reviewer for this task.`
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
      `✅ ${taskReviewerData.length} reviewers linked to Task ID ${task.id} in Sprint ${task.sprintId}.`
    );
  }
}
