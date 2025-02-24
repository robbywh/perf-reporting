import { APPROVED_STATUS_NAMES } from "@/constants/client";
import { prisma } from "@/services/db";

interface TaskAssignee {
  id: string;
  assignees?: { id: number; username: string }[];
  sprintId: string;
  storyPoint: number;
  statusName: string;
}

export async function linkAssigneesToTask(task: TaskAssignee) {
  if (!task.id) {
    console.error(
      "❌ Task ID is null or undefined, skipping assignee linking."
    );
    return;
  }

  if (!task.assignees || task.assignees.length === 0) {
    console.warn(`🟡 No assignees found for Task ID ${task.id}, skipping.`);
    return;
  }

  // ✅ Ensure the task exists to prevent foreign key errors
  const existingTask = await prisma.task.findUnique({
    where: { id: task.id },
    select: { id: true },
  });

  if (!existingTask) {
    console.error(
      `❌ Task ID ${task.id} does not exist in the database, skipping.`
    );
    return;
  }

  // ✅ Fetch all engineers in one query for performance
  const engineerIds = task.assignees.map((a) => a.id);
  const existingEngineers = await prisma.engineer.findMany({
    where: { id: { in: engineerIds } },
    select: { id: true },
  });

  const existingEngineerSet = new Set(existingEngineers.map((e) => e.id));
  const taskAssigneeData = [];

  for (const assignee of task.assignees) {
    if (!existingEngineerSet.has(assignee.id)) {
      console.warn(`⏩ Skipping ${assignee.username} - Not an engineer.`);
      continue;
    }

    taskAssigneeData.push({ taskId: task.id, engineerId: assignee.id });

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
      `✅ ${taskAssigneeData.length} assignees linked to Task ID ${task.id}.`
    );
  }
}
