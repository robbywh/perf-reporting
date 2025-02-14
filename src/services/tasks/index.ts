import { prisma } from "../db";
import { linkTagsToTask } from "../tags";

interface Task {
  id: string;
  name: string;
  sprintId: string;
  statusId?: string | null;
  categoryId?: string | null;
  parentTaskId?: string | null;
  storyPoint?: number | null;
}

export async function upsertTaskWithTags(task: Task) {
  try {
    // Upsert task into the database
    const taskData = {
      name: task.name,
      sprintId: task.sprintId,
      statusId: task.statusId || null,
      categoryId: task.categoryId || null,
      parentTaskId: task.parentTaskId || null,
      storyPoint: task.storyPoint || null,
    };

    await prisma.task.upsert({
      where: { id: task.id },
      update: taskData,
      create: {
        id: task.id,
        ...taskData,
      },
    });

    console.log(`Task ${task.id} upserted successfully.`);
    await linkTagsToTask(task);
  } catch (error) {
    console.error(`Error processing task ${task.id}:`, error);
    throw new Error("Failed to upsert task");
  }
}
