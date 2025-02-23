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

export async function countTasksByCategory(sprintIds: string[]) {
  const groupedTasks = await prisma.task.groupBy({
    by: ["categoryId"],
    where: {
      parentTaskId: null,
      sprintId: { in: sprintIds },
    },
    _count: {
      id: true, // Counting tasks per category
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  // Fetch category names in the same query
  const result = await prisma.category.findMany({
    where: {
      id: {
        in: groupedTasks
          .map((task) => task.categoryId)
          .filter((id): id is string => id !== null),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Map category names to grouped counts
  const categoryMap = Object.fromEntries(
    result.map((cat) => [cat.id, cat.name])
  );

  const finalResult = groupedTasks.map((task) => ({
    category: task.categoryId
      ? categoryMap[task.categoryId] || "OTHER"
      : "OTHER",
    count: task._count.id,
  }));

  return finalResult;
}

export async function findAverageTaskToQACounts(sprintIds: string[]) {
  const tasks = await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      OR: [
        { name: { contains: "[QA]", mode: "insensitive" } },
        { name: { contains: "QA:", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      sprintId: true,
      taskTags: {
        select: { tagId: true },
      },
    },
  });

  const approvedTasks = tasks.filter(
    (task) =>
      !task.taskTags.some((tag) =>
        ["rejected_mainfeat", "rejected_staging"].includes(tag.tagId)
      )
  ).length;

  const rejectedTasks = tasks.filter((task) =>
    task.taskTags.some((tag) =>
      ["rejected_mainfeat", "rejected_staging"].includes(tag.tagId)
    )
  ).length;

  // Compute the averages
  const averageApprovedTasks = approvedTasks / sprintIds.length;
  const averageRejectedTasks = rejectedTasks / sprintIds.length;

  return {
    averageApprovedTasks: Number(averageApprovedTasks.toFixed(2)),
    averageRejectedTasks: Number(averageRejectedTasks.toFixed(2)),
  };
}
