import { APPROVED_STATUS_IDS } from "@/constants/client";
import type { Decimal } from "@prisma/client/runtime/library";

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

// Define types for task group result
type GroupedTask = {
  categoryId: string | null;
  _count: { id: number };
};

// Define types for task with assignees
type TaskWithAssignees = {
  id: string;
  sprintId: string;
  name: string;
  parentTaskId: string | null;
  assignees: { engineerId: number }[];
};

// Type for parent task
type ParentTask = {
  id: string;
  assignees: { engineerId: number }[];
};

// Type for tasks with tags
type TaskWithTags = {
  storyPoint: Decimal | null;
  statusId: string | null;
  taskTags: { tag: { id: string } }[];
  sprintId: string;
};

// Type for sprint engineer data
type SprintEngineerData = {
  mergedCount: number | null;
};

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
      where: {
        id_sprintId: {
          id: task.id,
          sprintId: task.sprintId,
        },
      },
      update: taskData,
      create: { id: task.id, ...taskData },
    });

    console.log(
      `✅ Task '${task.name}' (ID: ${task.id}, Sprint: ${task.sprintId}) upserted successfully.`
    );
  } catch (error) {
    console.error(`❌ Error processing Task ID ${task.id}:`, error);
    throw new Error("Failed to upsert task");
  }
}

export async function findCountTasksByCategory(sprintIds: string[]) {
  const groupedTasks = (await prisma.task.groupBy({
    by: ["categoryId"],
    where: {
      parentTaskId: null,
      sprintId: { in: sprintIds },
    },
    _count: {
      id: true,
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
  })) as GroupedTask[];

  // Fetch category names in the same query
  const result = await prisma.category.findMany({
    where: {
      id: {
        in: groupedTasks
          .map((task: GroupedTask) => task.categoryId)
          .filter((id: string | null): id is string => id !== null),
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
    result.map((cat: { id: string; name: string }) => [cat.id, cat.name])
  );

  const finalResult = groupedTasks.map((task: GroupedTask) => ({
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
  const tasks = (await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      statusId: { in: APPROVED_STATUS_IDS },
      OR: [
        { name: { startsWith: "[QA]", mode: "insensitive" } },
        { name: { startsWith: "QA", mode: "insensitive" } },
      ],
      NOT: [
        { name: { contains: "[Scenario]", mode: "insensitive" } },
        { name: { contains: "[support]", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      sprintId: true,
      name: true,
      parentTaskId: true,
      assignees: { select: { engineerId: true } },
    },
    cacheStrategy: {
      swr: 5 * 60,
      ttl: 8 * 60 * 60,
      tags: ["findTotalTaskToQACounts"],
    },
  })) as TaskWithAssignees[];

  // Fetch parent tasks separately
  const parentTaskIds = tasks
    .map((task: TaskWithAssignees) => task.parentTaskId)
    .filter((id: string | null): id is string => id !== null);

  const parentTasks = parentTaskIds.length
    ? ((await prisma.task.findMany({
        where: {
          id: { in: parentTaskIds },
        },
        select: {
          id: true,
          assignees: { select: { engineerId: true } },
        },
      })) as ParentTask[])
    : [];

  // Convert parentTasks to a map for quick lookup
  const parentTaskMap = new Map<string, number[]>(
    parentTasks.map((task: ParentTask) => [
      task.id,
      task.assignees.map((a: { engineerId: number }) => a.engineerId),
    ])
  );

  // Filtering tasks: Check if engineerId is assigned directly or through parentTaskId
  const filteredTasks = engineerId
    ? tasks.filter(
        (task: TaskWithAssignees) =>
          // Task has direct engineer assignment
          task.assignees.some(
            (assignee: { engineerId: number }) =>
              assignee.engineerId === engineerId
          ) ||
          // Parent task has engineer assigned
          (task.parentTaskId &&
            parentTaskMap.get(task.parentTaskId)?.includes(engineerId))
      )
    : tasks;

  const approvedTasks = filteredTasks.filter(
    (task: TaskWithAssignees) => !task.name.toLowerCase().includes("[rejected]")
  ).length;

  const rejectedTasks = filteredTasks.filter((task: TaskWithAssignees) =>
    task.name.toLowerCase().includes("[rejected]")
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
    }) as TaskWithTags[],
    prisma.sprintEngineer.findMany({
      where: { sprintId: { in: sprintIds }, engineerId },
      select: { mergedCount: true },
    }) as SprintEngineerData[],
  ]);

  // Define category mappings for story point sum per sprint
  const categorySums: Record<string, number> = {
    ongoingDev: 0,
    ongoingSupport: 0,
    nonDevelopment: 0,
    supportApproved: 0,
    devApproved: 0,
  };

  tasks.forEach(({ storyPoint, statusId, taskTags }: TaskWithTags) => {
    const sp = Number(storyPoint) || 0;
    const tags = taskTags.map(({ tag }: { tag: { id: string } }) => tag.id);
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
  const mergedCounts = sprintEngineerData.map(
    (se: SprintEngineerData) => se.mergedCount || 0
  );
  const averageMergedCount = computeAverage(
    mergedCounts.reduce((sum: number, v: number) => sum + v, 0)
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

export async function deleteTaskFromSprint(taskId: string, sprintId: string) {
  try {
    // Delete task and its related records in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete task tags first
      await tx.taskTag.deleteMany({
        where: {
          taskId,
          sprintId,
        },
      });

      // Delete task assignees
      await tx.taskAssignee.deleteMany({
        where: {
          taskId,
          sprintId,
        },
      });

      // Finally delete the task
      await tx.task.delete({
        where: {
          id_sprintId: {
            id: taskId,
            sprintId,
          },
        },
      });
    });

    console.log(
      `✅ Task ${taskId} successfully deleted from Sprint ${sprintId}`
    );
  } catch (error) {
    console.error(
      `❌ Error deleting Task ${taskId} from Sprint ${sprintId}:`,
      error
    );
    throw new Error("Failed to delete task from sprint");
  }
}
