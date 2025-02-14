import { prisma } from "@/services/db";

interface TaskTag {
  id: string;
  tags?: { name: string }[];
}

export async function linkTagsToTask(task: TaskTag) {
  if (!task.tags || task.tags.length === 0) return;

  for (const tag of task.tags) {
    try {
      const existingTag = await prisma.tag.findUnique({
        where: { name: tag.name },
      });

      if (existingTag) {
        await prisma.taskTag.upsert({
          where: {
            taskId_tagId: {
              taskId: task.id,
              tagId: existingTag.id,
            },
          },
          update: {},
          create: {
            taskId: task.id,
            tagId: existingTag.id,
          },
        });

        console.log(`Tag ${tag.name} linked to task ${task.id}.`);
      } else {
        console.log(`Tag ${tag.name} does not exist, skipping.`);
      }
    } catch (error) {
      console.error(`Error linking tag ${tag.name} to task ${task.id}:`, error);
    }
  }
}
