import { APPROVED_STATUS_NAMES } from "@/constants/client";
import { prisma } from "@/services/db";

interface TaskAssignee {
  id: string;
  assignees?: { id: number; username: string }[];
  sprintId: string;
  storyPoint: number;
  statusName: string;
  organizationId?: string;
}

export async function linkAssigneesToTask(task: TaskAssignee) {
  if (!task.id) {
    console.error(
      "❌ Task ID is null or undefined, skipping assignee linking.",
    );
    return;
  }

  if (!task.assignees || task.assignees.length === 0) {
    console.warn(`🟡 No assignees found for Task ID ${task.id}, skipping.`);
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

  // ✅ Fetch all engineers in one query for performance, filtered by organization
  const engineerIds = task.assignees.map((a) => a.id);
  const engineerQuery: {
    id: { in: number[] };
    engineerOrganizations?: { some: { organizationId: string } };
  } = { id: { in: engineerIds } };

  // If organizationId is provided, filter engineers by organization
  if (task.organizationId) {
    engineerQuery.engineerOrganizations = {
      some: {
        organizationId: task.organizationId,
      },
    };
  }

  const existingEngineers = await prisma.engineer.findMany({
    where: engineerQuery,
    select: { id: true },
  });

  const existingEngineerSet = new Set(
    existingEngineers.map((engineer: { id: number }) => engineer.id),
  );
  const taskAssigneeData = [];

  for (const assignee of task.assignees) {
    if (!existingEngineerSet.has(assignee.id)) {
      console.warn(`⏩ Skipping ${assignee.username} - Not an engineer.`);
      continue;
    }

    taskAssigneeData.push({
      taskId: task.id,
      engineerId: assignee.id,
      sprintId: task.sprintId,
    });

    // Calculate story point for each sprint per engineer
    if (APPROVED_STATUS_NAMES.includes(task.statusName)) {
      await prisma.sprintEngineer.upsert({
        where: {
          sprintId_engineerId: {
            sprintId: task.sprintId,
            engineerId: assignee.id,
          },
        },
        create: {
          sprintId: task.sprintId,
          engineerId: assignee.id,
          storyPoints: task.storyPoint,
        },
        update: {
          storyPoints: { increment: task.storyPoint },
        },
      });
    }
  }

  if (taskAssigneeData.length > 0) {
    // ✅ Use batch `createMany()` for efficiency
    await prisma.taskAssignee.createMany({
      data: taskAssigneeData,
      skipDuplicates: true, // Avoid duplicate inserts
    });

    console.log(
      `✅ ${taskAssigneeData.length} assignees linked to Task ID ${task.id} in Sprint ${task.sprintId}.`,
    );
  }
}
