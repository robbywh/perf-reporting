import { APPROVED_STATUS_IDS, REJECTED_STATUS_IDS } from "@/constants/client";

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

export async function findCountTasksByCategory(sprintIds: string[]) {
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
    cacheStrategy: {
      swr: 5 * 60,
      ttl: 8 * 60 * 60,
      tags: ["groupedTasks"],
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
    cacheStrategy: {
      swr: 5 * 60,
      ttl: 8 * 60 * 60,
      tags: ["categoryNames"],
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

export async function findTotalTaskToQACounts(
  sprintIds: string[],
  engineerId?: number
) {
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
      parentTaskId: true,
      taskTags: { select: { tagId: true } },
      assignees: { select: { engineerId: true } },
    },
    cacheStrategy: {
      swr: 5 * 60,
      ttl: 8 * 60 * 60,
      tags: ["findTotalTaskToQACounts"],
    },
  });

  // Fetch parent tasks separately
  const parentTaskIds = tasks
    .map((task) => task.parentTaskId)
    .filter((id): id is string => id !== null);

  const parentTasks = parentTaskIds.length
    ? await prisma.task.findMany({
        where: { id: { in: parentTaskIds } },
        select: {
          id: true,
          assignees: { select: { engineerId: true } },
        },
      })
    : [];

  // Convert parentTasks to a map for quick lookup
  const parentTaskMap = new Map(
    parentTasks.map((task) => [
      task.id,
      task.assignees.map((a) => a.engineerId),
    ])
  );

  // Filtering tasks: Check if engineerId is assigned directly or through parentTaskId
  const filteredTasks = engineerId
    ? tasks.filter(
        (task) =>
          // Task has direct engineer assignment
          task.assignees.some(
            (assignee) => assignee.engineerId === engineerId
          ) ||
          // Parent task has engineer assigned
          (task.parentTaskId &&
            parentTaskMap.get(task.parentTaskId)?.includes(engineerId))
      )
    : tasks; // If no engineerId, include all tasks

  const approvedTasks = filteredTasks.filter(
    (task) =>
      !task.taskTags.some((tag) => REJECTED_STATUS_IDS.includes(tag.tagId))
  ).length;

  const rejectedTasks = filteredTasks.filter((task) =>
    task.taskTags.some((tag) => REJECTED_STATUS_IDS.includes(tag.tagId))
  ).length;

  return {
    approvedTasks,
    rejectedTasks,
  };
}

export async function findAverageSPAndMergedCountBySprintIds(
  sprintIds: string[],
  engineerId: number
) {
  // Fetch tasks and sprint engineer data in parallel
  const [tasks, sprintEngineerData] = await Promise.all([
    prisma.task.findMany({
      where: {
        sprintId: { in: sprintIds },
        assignees: { some: { engineerId } },
      },
      select: {
        storyPoint: true,
        statusId: true,
        sprintId: true,
        taskTags: { select: { tag: { select: { id: true } } } },
      },
    }),
    prisma.sprintEngineer.findMany({
      where: { sprintId: { in: sprintIds }, engineerId },
      select: { mergedCount: true },
    }),
  ]);

  // Define category mappings for story point sum per sprint
  const categorySums: Record<string, number> = {
    ongoingDev: 0,
    ongoingSupport: 0,
    nonDevelopment: 0,
    supportApproved: 0,
    devApproved: 0,
  };

  tasks.forEach(({ storyPoint, statusId, taskTags }) => {
    const sp = Number(storyPoint) || 0;
    const tags = taskTags.map(({ tag }) => tag.id);
    const isSupport = tags.includes("support");
    const isNonDev = tags.includes("nodev");
    const isApproved = APPROVED_STATUS_IDS.includes(statusId || "");

    const category = isApproved
      ? isSupport
        ? "supportApproved"
        : isNonDev
          ? "nonDevelopment"
          : "devApproved"
      : isSupport
        ? "ongoingSupport"
        : isNonDev
          ? "ongoingNonDev"
          : "ongoingDev";

    categorySums[category] += sp;
  });

  // Compute averages by dividing by sprint count
  const computeAverage = (total: number) =>
    sprintIds.length > 0 ? Number((total / sprintIds.length).toFixed(2)) : 0;

  // Compute merged count average
  const mergedCounts = sprintEngineerData.map((se) => se.mergedCount || 0);
  const averageMergedCount = computeAverage(
    mergedCounts.reduce((sum, v) => sum + v, 0)
  );

  return {
    averageOngoingDev: computeAverage(categorySums.ongoingDev),
    averageOngoingSupport: computeAverage(categorySums.ongoingSupport),
    averageNonDevelopment: computeAverage(categorySums.nonDevelopment),
    averageSupportApproved: computeAverage(categorySums.supportApproved),
    averageDevApproved: computeAverage(categorySums.devApproved),
    averageMergedCount,
  };
}
