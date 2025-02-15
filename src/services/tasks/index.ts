import { prisma } from "../db";

interface Task {
  id: string;
  name: string;
  sprintId: string;
  statusName?: string | null;
  categoryId?: string | null;
  parentTaskId?: string | null;
  storyPoint?: number | null;
}

export async function upsertTask(task: Task) {
  try {
    if (!task.statusName) {
      console.warn(`🟡 Task ${task.id} has no statusName, skipping.`);
      return;
    }

    // ✅ Fetch status in one query
    const existingStatus = await prisma.status.findUnique({
      where: { name: task.statusName },
      select: { id: true },
    });

    if (!existingStatus) {
      console.warn(
        `🟡 Status '${task.statusName}' not found, skipping Task ID ${task.id}.`
      );
      return;
    }

    // ✅ Prepare task data
    const taskData = {
      name: task.name,
      sprintId: task.sprintId,
      statusId: existingStatus.id,
      categoryId: task.categoryId || null,
      parentTaskId: task.parentTaskId || null,
      storyPoint: task.storyPoint || null,
    };

    // ✅ Upsert task (insert if missing, update otherwise)
    await prisma.task.upsert({
      where: { id: task.id },
      update: taskData,
      create: { id: task.id, ...taskData },
    });

    console.log(
      `✅ Task '${task.name}' (ID: ${task.id}) upserted successfully.`
    );
  } catch (error) {
    console.error(`❌ Error processing Task ID ${task.id}:`, error);
    throw new Error("Failed to upsert task");
  }
}
