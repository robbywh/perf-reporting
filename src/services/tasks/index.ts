import type { Decimal } from "@prisma/client/runtime/library";

import {
  APPROVED_STATUS_IDS,
  NODEV_TAGS,
  SPECIAL_TASK_PREFIXES,
} from "@/constants/client";
import { CACHE_STRATEGY } from "@/constants/server";

import { prisma } from "../db";
import { findMRDetailsBySprintIdsAndEngineerId } from "../gitlab";

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
  parentTaskId: string | null;
  taskTags: { tag: { id: string } }[];
  sprintId: string;
};

// Type for detailed task information
export type DetailedTask = {
  id: string;
  name: string;
  status: {
    name: string;
  } | null;
  assignees: Array<{
    engineer: {
      id: number;
      name: string;
    };
  }>;
  parentTaskAssignees: Array<{
    engineer: {
      id: number;
      name: string;
    };
  }>;
  parentTask: {
    id: string;
    name: string;
  } | null;
  reviewers: Array<{
    reviewer: {
      id: number;
      name: string;
    };
  }>;
};

// Type for QA tasks breakdown
export type QATasksBreakdown = {
  approvedTasks: DetailedTask[];
  rejectedTasks: DetailedTask[];
};

export async function findCountTasksByProject(sprintIds: string[]) {
  // First get organization ID from sprint
  const sprint = await prisma.sprint.findFirst({
    where: { id: { in: sprintIds } },
    select: { organizationId: true },
  });

  if (!sprint) {
    return [];
  }

  // Get all parent tasks with their projects and story points
  const parentTasks = await prisma.task.findMany({
    where: {
      parentTaskId: null,
      sprintId: { in: sprintIds },
      statusId: { in: APPROVED_STATUS_IDS },
    },
    select: {
      id: true,
      projectId: true,
      storyPoint: true,
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["parentTasksForProject"],
    },
  });

  // Get all subtasks for these parent tasks
  const parentTaskIds = parentTasks.map((task) => task.id);
  const subtasks = parentTaskIds.length > 0
    ? await prisma.task.findMany({
        where: {
          sprintId: { in: sprintIds },
          parentTaskId: { in: parentTaskIds },
        },
        select: {
          parentTaskId: true,
          storyPoint: true,
        },
        cacheStrategy: {
          ...CACHE_STRATEGY.DEFAULT,
          tags: ["subtasksForProject"],
        },
      })
    : [];

  // Calculate total story points including subtasks for each parent task
  const subtaskMap = new Map<string, number>();
  subtasks.forEach((subtask) => {
    if (subtask.parentTaskId) {
      const current = subtaskMap.get(subtask.parentTaskId) || 0;
      subtaskMap.set(
        subtask.parentTaskId,
        current + (Number(subtask.storyPoint) || 0),
      );
    }
  });

  // Group by project and sum story points
  const projectStoryPoints = new Map<string | null, number>();
  parentTasks.forEach((task) => {
    const subtaskSP = subtaskMap.get(task.id) || 0;
    const totalStoryPoint = (Number(task.storyPoint) || 0) + subtaskSP;

    const currentSP = projectStoryPoints.get(task.projectId) || 0;
    projectStoryPoints.set(task.projectId, currentSP + totalStoryPoint);
  });

  // Fetch project names
  const projectIds = Array.from(projectStoryPoints.keys())
    .filter((id): id is string => id !== null);

  const result = projectIds.length > 0
    ? await prisma.project.findMany({
        where: {
          id: { in: projectIds },
        },
        select: {
          id: true,
          name: true,
          color: true,
        },
        cacheStrategy: {
          ...CACHE_STRATEGY.DEFAULT,
          tags: ["projectNames"],
        },
      })
    : [];

  // Map project names and colors to grouped story points
  const projectMap = Object.fromEntries(
    result.map((proj: { id: string; name: string; color: string | null }) => [
      proj.id,
      { name: proj.name, color: proj.color },
    ]),
  );

  const finalResult = Array.from(projectStoryPoints.entries())
    .map(([projectId, storyPoints]) => ({
      project: projectId
        ? projectMap[projectId]?.name || "OTHER"
        : "OTHER",
      projectId,
      color: projectId ? projectMap[projectId]?.color || null : null,
      count: storyPoints,
    }))
    .sort((a, b) => b.count - a.count); // Sort by story points descending

  return finalResult;
}

export async function findCountTasksByCategory(sprintIds: string[]) {
  // First get organization ID from sprint
  const sprint = await prisma.sprint.findFirst({
    where: { id: { in: sprintIds } },
    select: { organizationId: true },
  });

  if (!sprint) {
    return [];
  }

  // Get all parent tasks with their categories and story points
  const parentTasks = await prisma.task.findMany({
    where: {
      parentTaskId: null,
      sprintId: { in: sprintIds },
      statusId: { in: APPROVED_STATUS_IDS },
    },
    select: {
      id: true,
      categoryId: true,
      storyPoint: true,
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["parentTasksForCategory"],
    },
  });

  // Get all subtasks for these parent tasks
  const parentTaskIds = parentTasks.map((task) => task.id);
  const subtasks = parentTaskIds.length > 0
    ? await prisma.task.findMany({
        where: {
          sprintId: { in: sprintIds },
          parentTaskId: { in: parentTaskIds },
        },
        select: {
          parentTaskId: true,
          storyPoint: true,
        },
        cacheStrategy: {
          ...CACHE_STRATEGY.DEFAULT,
          tags: ["subtasksForCategory"],
        },
      })
    : [];

  // Calculate total story points including subtasks for each parent task
  const subtaskMap = new Map<string, number>();
  subtasks.forEach((subtask) => {
    if (subtask.parentTaskId) {
      const current = subtaskMap.get(subtask.parentTaskId) || 0;
      subtaskMap.set(
        subtask.parentTaskId,
        current + (Number(subtask.storyPoint) || 0),
      );
    }
  });

  // Group by category and sum story points
  const categoryStoryPoints = new Map<string | null, number>();
  parentTasks.forEach((task) => {
    const subtaskSP = subtaskMap.get(task.id) || 0;
    const totalStoryPoint = (Number(task.storyPoint) || 0) + subtaskSP;

    const currentSP = categoryStoryPoints.get(task.categoryId) || 0;
    categoryStoryPoints.set(task.categoryId, currentSP + totalStoryPoint);
  });

  // Fetch category names
  const categoryIds = Array.from(categoryStoryPoints.keys())
    .filter((id): id is string => id !== null);

  const result = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
        },
        select: {
          id: true,
          name: true,
          color: true,
        },
        cacheStrategy: {
          ...CACHE_STRATEGY.DEFAULT,
          tags: ["categoryNames"],
        },
      })
    : [];

  // Map category names and colors to grouped story points
  const categoryMap = Object.fromEntries(
    result.map((cat: { id: string; name: string; color: string | null }) => [
      cat.id,
      { name: cat.name, color: cat.color },
    ]),
  );

  const finalResult = Array.from(categoryStoryPoints.entries())
    .map(([categoryId, storyPoints]) => ({
      category: categoryId
        ? categoryMap[categoryId]?.name || "OTHER"
        : "OTHER",
      categoryId,
      color: categoryId ? categoryMap[categoryId]?.color || null : null,
      count: storyPoints,
    }))
    .sort((a, b) => b.count - a.count); // Sort by story points descending

  return finalResult;
}

export async function findTotalTaskToQACounts(
  sprintIds: string[],
  engineerId?: number,
) {
  const tasks = (await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      statusId: { in: APPROVED_STATUS_IDS },
      OR: [
        { name: { startsWith: SPECIAL_TASK_PREFIXES.QA, mode: "insensitive" } },
        { name: { startsWith: "QA", mode: "insensitive" } },
      ],
      NOT: [
        { name: { contains: SPECIAL_TASK_PREFIXES.SCENARIO, mode: "insensitive" } },
        { name: { contains: SPECIAL_TASK_PREFIXES.SUPPORT, mode: "insensitive" } },
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
      ...CACHE_STRATEGY.DEFAULT,
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
    ]),
  );

  // Filtering tasks: Check if engineerId is assigned directly or through parentTaskId
  const filteredTasks = engineerId
    ? tasks.filter(
        (task: TaskWithAssignees) =>
          // Task has direct engineer assignment
          task.assignees.some(
            (assignee: { engineerId: number }) =>
              assignee.engineerId === engineerId,
          ) ||
          // Parent task has engineer assigned
          (task.parentTaskId &&
            parentTaskMap.get(task.parentTaskId)?.includes(engineerId)),
      )
    : tasks;

  const approvedTasks = filteredTasks.filter(
    (task: TaskWithAssignees) =>
      !(task.name?.toLowerCase() || "").includes(SPECIAL_TASK_PREFIXES.REJECTED),
  ).length;

  const rejectedTasks = filteredTasks.filter((task: TaskWithAssignees) =>
    (task.name?.toLowerCase() || "").includes(SPECIAL_TASK_PREFIXES.REJECTED),
  ).length;

  return {
    approvedTasks,
    rejectedTasks,
  };
}

export async function findAverageSPAndMergedCountBySprintIds(
  sprintIds: string[],
  engineerId: number,
) {
  // Create a hash or composite identifier for multiple sprints to stay within cache tag limits
  const sprintKey =
    sprintIds.length === 1
      ? sprintIds[0]
      : sprintIds.sort().join("_").substring(0, 20);

  // Fetch tasks and GitLab merge request data in parallel with optimized caching
  const [tasks, gitlabMRData] = await Promise.all([
    (await prisma.task.findMany({
      where: {
        sprintId: { in: sprintIds },
        assignees: { some: { engineerId } },
        parentTaskId: { not: null },
      },
      select: {
        id: true,
        name: true,
        parentTaskId: true,
        storyPoint: true,
        statusId: true,
        sprintId: true,
        taskTags: { select: { tag: { select: { id: true } } } },
        status: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      cacheStrategy: {
        ...CACHE_STRATEGY.DEFAULT,
        tags: [`tasks_eng_${engineerId}`, `sprints_${sprintKey}`],
      },
    })) as (TaskWithTags & {
      id: string;
      name: string;
      status: {
        id: string;
        name: string;
      };
    })[],
    await prisma.sprintGitlab.findMany({
      where: { sprintId: { in: sprintIds }, engineerId },
      select: { sprintId: true },
      cacheStrategy: {
        ...CACHE_STRATEGY.DEFAULT,
        tags: [`gitlab_eng_${engineerId}`, `sprints_${sprintKey}`],
      },
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

  // Store tasks by category for modal display
  interface TaskDetail {
    id: string;
    name: string;
    storyPoint: number;
    statusId: string;
    statusName: string;
    statusColor: string;
    parentTaskId?: string;
  }

  const tasksByCategory: Record<string, TaskDetail[]> = {
    ongoingDev: [],
    ongoingSupport: [],
    nonDevelopment: [],
    supportApproved: [],
    devApproved: [],
  };

  // Define status colors based on categories
  const statusColors: Record<string, string> = {
    to_do: "#6B7280", // Gray
    in_progress: "#3B82F6", // Blue
    tech_review: "#8B5CF6", // Purple
    product_review: "#F59E0B", // Amber
    product_approval: "#10B981", // Emerald
    ready_for_qa: "#8B5CF6", // Purple
    ready_to_qa: "#8B5CF6", // Purple
    qa_review: "#EC4899", // Pink
    rejected: "#DC2626", // Red
    product_approved: "#059669", // Green
  };

  tasks.forEach((task) => {
    const sp = Number(task.storyPoint) || 0;
    const tags = task.taskTags.map(
      ({ tag }: { tag: { id: string } }) => tag.id,
    );
    const isSupport = tags.includes("support");
    const isNonDev = tags.some((tag) => NODEV_TAGS.includes(tag));
    const isApproved = APPROVED_STATUS_IDS.includes(task.statusId || "");

    // Determine the task category
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

    // Sum up story points by category (include all tasks in sum, even without parentTaskId)
    if (category in categorySums) {
      categorySums[category] += sp;
    }

    // Get status color based on statusId
    const statusColor = statusColors[task.statusId || ""] || "#9CA3AF"; // Default gray

    // Store task details for the modal, but only if it has a parentTaskId
    if (category in tasksByCategory && task.parentTaskId) {
      tasksByCategory[category].push({
        id: task.id,
        name: task.name,
        storyPoint: sp,
        statusId: task.statusId || "",
        statusName: task.status?.name || "Unknown",
        statusColor,
        parentTaskId: task.parentTaskId,
      });
    }
  });

  // Compute averages by dividing by sprint count
  const computeAverage = (total: number) =>
    sprintIds.length > 0 ? Number((total / sprintIds.length).toFixed(2)) : 0;

  // Compute merged count average from GitLab data
  const totalMergedCount = gitlabMRData.length;
  const averageMergedCount = computeAverage(totalMergedCount);

  // Fetch MR details
  const mrData = await findMRDetailsBySprintIdsAndEngineerId(
    sprintIds,
    engineerId,
  );

  return {
    averageOngoingDev: computeAverage(categorySums.ongoingDev),
    averageOngoingSupport: computeAverage(categorySums.ongoingSupport),
    averageNonDevelopment: computeAverage(categorySums.nonDevelopment),
    averageSupportApproved: computeAverage(categorySums.supportApproved),
    averageDevApproved: computeAverage(categorySums.devApproved),
    averageMergedCount,
    taskDetails: tasksByCategory,
    mrDetails: mrData.mrDetails,
    totalMRSubmitted: mrData.totalMRSubmitted,
    averageMRSubmitted: mrData.averageMRSubmitted,
  };
}

export async function deleteTaskFromSprint(taskId: string, sprintId: string) {
  try {
    // Delete task and its related records in a transaction
    await prisma.$transaction(async (tx) => {
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
      `✅ Task ${taskId} successfully deleted from Sprint ${sprintId}`,
    );
  } catch (error) {
    console.error(
      `❌ Error deleting Task ${taskId} from Sprint ${sprintId}:`,
      error,
    );
    throw new Error("Failed to delete task from sprint");
  }
}

export async function findTasksByCategory(
  sprintIds: string[],
  categoryId: string,
) {
  // First get organization ID from sprint
  const sprint = await prisma.sprint.findFirst({
    where: { id: { in: sprintIds } },
    select: { organizationId: true },
  });

  if (!sprint) {
    return [];
  }

  // Get parent tasks for the category
  const parentTasks = await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      categoryId,
      parentTaskId: null,
    },
    select: {
      id: true,
      name: true,
      storyPoint: true,
      sprintId: true,
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      assignees: {
        select: {
          engineer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reviewers: {
        select: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      taskTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["tasksByCategory"],
    },
  });

  // Get all subtasks for these parent tasks
  const parentTaskIds = parentTasks.map((task) => task.id);
  const subtasks =
    parentTaskIds.length > 0
      ? await prisma.task.findMany({
          where: {
            sprintId: { in: sprintIds },
            parentTaskId: { in: parentTaskIds },
          },
          select: {
            parentTaskId: true,
            storyPoint: true,
          },
          cacheStrategy: {
            ...CACHE_STRATEGY.DEFAULT,
            tags: ["subtasksByCategory"],
          },
        })
      : [];

  // Calculate total story points including subtasks
  const subtaskMap = new Map<string, number>();
  subtasks.forEach((subtask) => {
    if (subtask.parentTaskId) {
      const current = subtaskMap.get(subtask.parentTaskId) || 0;
      subtaskMap.set(
        subtask.parentTaskId,
        current + (Number(subtask.storyPoint) || 0),
      );
    }
  });

  const tasksWithTotalSP = parentTasks.map((task) => {
    const subtaskSP = subtaskMap.get(task.id) || 0;
    const totalStoryPoint = (Number(task.storyPoint) || 0) + subtaskSP;

    return {
      ...task,
      storyPoint: task.storyPoint ? Number(task.storyPoint) : null,
      totalStoryPoint,
    };
  });

  return tasksWithTotalSP;
}

export async function findAllTasksByCategories(sprintIds: string[]) {
  // First get organization ID from sprint
  const sprint = await prisma.sprint.findFirst({
    where: { id: { in: sprintIds } },
    select: { organizationId: true },
  });

  if (!sprint) {
    return [];
  }

  // Get all parent tasks with their categories
  const parentTasks = await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      parentTaskId: null,
      statusId: { in: APPROVED_STATUS_IDS },
    },
    select: {
      id: true,
      name: true,
      storyPoint: true,
      sprintId: true,
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      assignees: {
        select: {
          engineer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reviewers: {
        select: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      taskTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        category: {
          name: "asc",
        },
      },
      {
        name: "asc",
      },
    ],
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["allTasksByCategories"],
    },
  });

  // Get all subtasks for these parent tasks
  const parentTaskIds = parentTasks.map((task) => task.id);
  const subtasks =
    parentTaskIds.length > 0
      ? await prisma.task.findMany({
          where: {
            sprintId: { in: sprintIds },
            parentTaskId: { in: parentTaskIds },
          },
          select: {
            parentTaskId: true,
            storyPoint: true,
          },
          cacheStrategy: {
            ...CACHE_STRATEGY.DEFAULT,
            tags: ["allSubtasksByCategories"],
          },
        })
      : [];

  // Calculate total story points including subtasks
  const subtaskMap = new Map<string, number>();
  subtasks.forEach((subtask) => {
    if (subtask.parentTaskId) {
      const current = subtaskMap.get(subtask.parentTaskId) || 0;
      subtaskMap.set(
        subtask.parentTaskId,
        current + (Number(subtask.storyPoint) || 0),
      );
    }
  });

  const tasksWithTotalSP = parentTasks.map((task) => {
    const subtaskSP = subtaskMap.get(task.id) || 0;
    const totalStoryPoint = (Number(task.storyPoint) || 0) + subtaskSP;

    return {
      ...task,
      storyPoint: task.storyPoint ? Number(task.storyPoint) : null,
      totalStoryPoint,
    };
  });

  return tasksWithTotalSP;
}

export async function findAllTasksByProjects(sprintIds: string[]) {
  // First get organization ID from sprint
  const sprint = await prisma.sprint.findFirst({
    where: { id: { in: sprintIds } },
    select: { organizationId: true },
  });

  if (!sprint) {
    return [];
  }

  // Get all parent tasks with their projects
  const parentTasks = await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      parentTaskId: null,
      statusId: { in: APPROVED_STATUS_IDS },
    },
    select: {
      id: true,
      name: true,
      storyPoint: true,
      sprintId: true,
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      assignees: {
        select: {
          engineer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reviewers: {
        select: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      taskTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        project: {
          name: "asc",
        },
      },
      {
        name: "asc",
      },
    ],
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["allTasksByProjects"],
    },
  });

  // Get all subtasks for these parent tasks
  const parentTaskIds = parentTasks.map((task) => task.id);
  const subtasks =
    parentTaskIds.length > 0
      ? await prisma.task.findMany({
          where: {
            sprintId: { in: sprintIds },
            parentTaskId: { in: parentTaskIds },
          },
          select: {
            parentTaskId: true,
            storyPoint: true,
          },
          cacheStrategy: {
            ...CACHE_STRATEGY.DEFAULT,
            tags: ["allSubtasksByProjects"],
          },
        })
      : [];

  // Calculate total story points including subtasks
  const subtaskMap = new Map<string, number>();
  subtasks.forEach((subtask) => {
    if (subtask.parentTaskId) {
      const current = subtaskMap.get(subtask.parentTaskId) || 0;
      subtaskMap.set(
        subtask.parentTaskId,
        current + (Number(subtask.storyPoint) || 0),
      );
    }
  });

  const tasksWithTotalSP = parentTasks.map((task) => {
    const subtaskSP = subtaskMap.get(task.id) || 0;
    const totalStoryPoint = (Number(task.storyPoint) || 0) + subtaskSP;

    return {
      ...task,
      storyPoint: task.storyPoint ? Number(task.storyPoint) : null,
      totalStoryPoint,
    };
  });

  return tasksWithTotalSP;
}

export async function findDetailedTaskToQACounts(
  sprintIds: string[],
  engineerId?: number,
): Promise<QATasksBreakdown> {
  const tasks = await prisma.task.findMany({
    where: {
      sprintId: { in: sprintIds },
      statusId: { in: APPROVED_STATUS_IDS },
      OR: [
        { name: { startsWith: SPECIAL_TASK_PREFIXES.QA, mode: "insensitive" } },
        { name: { startsWith: "QA", mode: "insensitive" } },
      ],
      NOT: [
        { name: { contains: SPECIAL_TASK_PREFIXES.SCENARIO, mode: "insensitive" } },
        { name: { contains: SPECIAL_TASK_PREFIXES.SUPPORT, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      parentTaskId: true,
      status: {
        select: {
          name: true,
        },
      },
      assignees: {
        select: {
          engineer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reviewers: {
        select: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    cacheStrategy: {
      ...CACHE_STRATEGY.DEFAULT,
      tags: ["findDetailedTaskToQACounts"],
    },
  });

  // Fetch parent tasks with their assignees
  const parentTaskIds = tasks
    .map((task) => task.parentTaskId)
    .filter((id): id is string => id !== null);

  const parentTasks = parentTaskIds.length
    ? await prisma.task.findMany({
        where: {
          id: { in: parentTaskIds },
        },
        select: {
          id: true,
          name: true,
          assignees: {
            select: {
              engineerId: true,
              engineer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    : [];

  // Create a map of parent task ID to assignees
  const parentTaskAssigneesMap = new Map<
    string,
    Array<{ engineer: { id: number; name: string } }>
  >(
    parentTasks.map((task) => [
      task.id,
      task.assignees.map((assignee) => ({
        engineer: assignee.engineer,
      })),
    ]),
  );

  // Create a map of parent task ID to task info
  const parentTaskMap = new Map<string, { id: string; name: string }>(
    parentTasks.map((task) => [task.id, { id: task.id, name: task.name }]),
  );

  // If engineerId is provided, filter tasks by engineer assignment
  let filteredTasks = tasks;

  if (engineerId) {
    const parentTaskEngineerMap = new Map<string, number[]>(
      parentTasks.map((task) => [
        task.id,
        task.assignees.map((a) => a.engineerId),
      ]),
    );

    filteredTasks = tasks.filter(
      (task) =>
        // Task has direct engineer assignment
        task.assignees.some(
          (assignee) => assignee.engineer.id === engineerId,
        ) ||
        // Parent task has engineer assigned
        (task.parentTaskId &&
          parentTaskEngineerMap.get(task.parentTaskId)?.includes(engineerId)),
    );
  }

  // Map tasks to include parent task assignees
  const mapTaskWithParentAssignees = (
    task: (typeof tasks)[0],
  ): DetailedTask => ({
    id: task.id,
    name: task.name,
    status: task.status,
    assignees: task.assignees,
    parentTaskAssignees: task.parentTaskId
      ? parentTaskAssigneesMap.get(task.parentTaskId) || []
      : [],
    parentTask: task.parentTaskId
      ? parentTaskMap.get(task.parentTaskId) || null
      : null,
    reviewers: task.reviewers,
  });

  const approvedTasks = filteredTasks
    .filter((task) => !(task.name?.toLowerCase() || "").includes(SPECIAL_TASK_PREFIXES.REJECTED))
    .map(mapTaskWithParentAssignees);

  const rejectedTasks = filteredTasks
    .filter((task) => (task.name?.toLowerCase() || "").includes(SPECIAL_TASK_PREFIXES.REJECTED))
    .map(mapTaskWithParentAssignees);

  return {
    approvedTasks,
    rejectedTasks,
  };
}
