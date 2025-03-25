import { prisma } from "@/services/db";

interface TaskTag {
  id: string;
  sprintId: string;
  tags?: { name: string }[];
}

export async function linkTagsToTask(task: TaskTag) {
  if (!task.id) {
    console.error("❌ Task ID is null or undefined, skipping tag linking.");
    return;
  }

  if (!task.tags || task.tags.length === 0) {
    console.warn(`🟡 No tags found for Task ID ${task.id}, skipping.`);
    return;
  }

  // ✅ Fetch task and existing tags in one query batch
  const [existingTask, existingTags] = await Promise.all([
    prisma.task.findUnique({
      where: {
        id_sprintId: {
          id: task.id,
          sprintId: task.sprintId,
        },
      },
      select: { id: true, sprintId: true },
    }),
    prisma.tag.findMany({
      where: { name: { in: task.tags.map((tag) => tag.name) } },
      select: { id: true, name: true },
    }),
  ]);

  if (!existingTask) {
    console.error(
      `❌ Task ID ${task.id} in Sprint ${task.sprintId} does not exist in the database, skipping.`
    );
    return;
  }

  const tagMap = new Map(
    existingTags.map((tag: { name: string; id: string }) => [tag.name, tag.id])
  );
  const taskTagRelations = [];

  for (const tag of task.tags) {
    const tagId = tagMap.get(tag.name);
    if (!tagId) {
      console.warn(`🟡 Tag '${tag.name}' does not exist, skipping.`);
      continue;
    }

    taskTagRelations.push({
      taskId: task.id,
      tagId,
      sprintId: task.sprintId,
    });
  }

  if (taskTagRelations.length > 0) {
    // ✅ Use batch `createMany` for efficiency
    await prisma.taskTag.createMany({
      data: taskTagRelations,
      skipDuplicates: true, // Avoid inserting duplicates
    });

    console.log(
      `✅ ${taskTagRelations.length} tags linked to Task ID ${task.id} in Sprint ${task.sprintId}.`
    );
  }
}
