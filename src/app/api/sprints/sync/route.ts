import { NextResponse } from "next/server";

import { CRON_SECRET } from "@/constants/server";
import { getFolderList } from "@/lib/clickup/lists";
import { ClickUpTask, getListTasks } from "@/lib/clickup/tasks";
import { prisma } from "@/services/db";
import { linkSprintsToEngineers } from "@/services/sprint-engineers";
import { linkSprintsToReviewers } from "@/services/sprint-reviewers";
import {
  findCurrentAndFutureSprints,
  findTodaySprints,
} from "@/services/sprints";
import { linkTagsToTask } from "@/services/tags";
import { linkAssigneesToTask } from "@/services/task-assignees";
import { linkReviewersToTask } from "@/services/task-reviewers";

// Define a type for the transaction object
type PrismaTransaction = {
  sprint: typeof prisma.sprint;
  task: typeof prisma.task;
  taskTag: typeof prisma.taskTag;
  taskAssignee: typeof prisma.taskAssignee;
  taskReviewer: typeof prisma.taskReviewer;
  // Use unknown instead of any for better type safety
  [key: string]: unknown;
};

async function syncSprintsFromClickUp() {
  // Call the external API library to fetch sprint lists from ClickUp.
  const folderListResponse = await getFolderList();

  // Ensure the response contains a "lists" array.
  const lists = folderListResponse.lists;
  if (!lists || !Array.isArray(lists)) {
    throw new Error("Invalid API response structure");
  }

  // Process all sprints in a single transaction
  const sprintData = lists.map((list) => {
    const { id, name, start_date: startDate, due_date: dueDate } = list;

    // Create dates with +1 day adjustment in a single step
    const startTimestamp = Number(startDate) + 24 * 60 * 60 * 1000; // Add 1 day in milliseconds
    const startDateUTC = new Date(startTimestamp);
    startDateUTC.setUTCHours(0, 0, 0, 0);

    const endTimestamp = Number(dueDate) + 24 * 60 * 60 * 1000; // Add 1 day in milliseconds
    const endDateUTC = new Date(endTimestamp);
    endDateUTC.setUTCHours(23, 59, 59, 999);

    return {
      id,
      name: name.substring(0, 10),
      startDate: startDateUTC,
      endDate: endDateUTC,
    };
  });

  await prisma.$transaction(async (tx: PrismaTransaction) => {
    // Bulk upsert all sprints
    await Promise.all(
      sprintData.map((sprint) =>
        tx.sprint.upsert({
          where: { id: sprint.id },
          create: sprint,
          update: sprint,
        })
      )
    );
  });
}

async function processBatch(
  tasks: ClickUpTask[],
  sprint: { id: string },
  statusMap: Map<string, string>,
  statuses: { id: string; name: string }[]
) {
  const taskDataBatch = tasks.map((task) => {
    const categoryField = task.custom_fields?.find(
      (field) => field.name === "Kategori"
    );
    const categoryId = categoryField?.value?.[0] ?? null;
    const storyPoint = task.time_estimate ? task.time_estimate / 3600000 : 0;
    const statusId = statusMap.get(task.status.status);
    if (!statusId) {
      console.warn(
        `🟡 Task ${task.id} (${task.name}) has an invalid status: ${task.status.status}`
      );
    }
    return {
      id: task.id,
      name: task.name,
      sprintId: sprint.id,
      statusId,
      categoryId,
      parentTaskId: task.parent,
      storyPoint,
      tags: task.tags,
      assignees: task.assignees,
    };
  });

  // Filter out tasks with invalid status
  const validTasks = taskDataBatch.filter((task) => task.statusId);

  // Use a transaction with a longer timeout for this batch
  await prisma.$transaction(
    async (tx: PrismaTransaction) => {
      // First, bulk upsert all tasks
      await Promise.all(
        validTasks.map((taskData) =>
          tx.task.upsert({
            where: {
              id_sprintId: {
                id: taskData.id,
                sprintId: taskData.sprintId,
              },
            },
            create: {
              id: taskData.id,
              name: taskData.name,
              sprintId: taskData.sprintId,
              statusId: taskData.statusId,
              categoryId: taskData.categoryId,
              parentTaskId: taskData.parentTaskId,
              storyPoint: taskData.storyPoint,
            },
            update: {
              name: taskData.name,
              statusId: taskData.statusId,
              categoryId: taskData.categoryId,
              parentTaskId: taskData.parentTaskId,
              storyPoint: taskData.storyPoint,
            },
          })
        )
      );

      // Then, link tags for all tasks
      await Promise.all(
        validTasks.map((taskData) =>
          linkTagsToTask({
            id: taskData.id,
            sprintId: taskData.sprintId,
            tags: taskData.tags,
          })
        )
      );

      await Promise.all(
        validTasks.map((taskData) =>
          linkAssigneesToTask({
            id: taskData.id,
            assignees: taskData.assignees,
            sprintId: taskData.sprintId,
            storyPoint: taskData.storyPoint,
            statusName: taskData.statusId
              ? statuses.find((s) => s.id === taskData.statusId)?.name || ""
              : "",
          })
        )
      );

      await Promise.all(
        validTasks.map((taskData) =>
          linkReviewersToTask({
            id: taskData.id,
            assignees: taskData.assignees,
            sprintId: taskData.sprintId,
            storyPoint: taskData.storyPoint,
            statusName: taskData.statusId
              ? statuses.find((s) => s.id === taskData.statusId)?.name || ""
              : "",
            name: taskData.name,
            taskTags: taskData.tags?.map((tag) => ({ tagId: tag.name })),
          })
        )
      );
    },
    {
      timeout: 10000, // 10 seconds timeout for each batch
      maxWait: 5000, // 5 seconds maximum wait time
    }
  );
}

async function syncTodayTasksFromClickUp() {
  try {
    // Get current and future sprints for engineer/reviewer linking
    const currentAndFutureSprints = await findCurrentAndFutureSprints();

    // Link engineers and reviewers for current and future sprints
    for (const sprint of currentAndFutureSprints) {
      await linkSprintsToEngineers(sprint.id);
      await linkSprintsToReviewers(sprint.id);
    }

    // Get today's sprints for task syncing
    const todaySprints = await findTodaySprints();

    // First, fetch all statuses to create a name-to-id mapping
    const statuses = await prisma.status.findMany();
    const statusMap = new Map<string, string>(
      statuses.map((s: { name: string; id: string }) => [s.name, s.id])
    );

    // Only sync tasks for today's sprints
    for (const sprint of todaySprints) {
      let page = 0;
      let lastPage = false;
      const allTasks: ClickUpTask[] = [];

      // First, collect all tasks for this sprint
      while (!lastPage) {
        const response = await getListTasks(sprint.id, page);
        allTasks.push(...response.tasks);
        lastPage = response.last_page;
        page++;
      }

      // Get all existing tasks in this sprint
      const existingTasks = await prisma.task.findMany({
        where: {
          sprintId: sprint.id,
        },
        select: {
          id: true,
        },
      });

      // Create a set of task IDs from all ClickUp tasks
      const clickUpTaskIds = new Set(allTasks.map((task) => task.id));

      // Find tasks that exist in DB but not in ClickUp (moved to another sprint)
      const tasksToDelete = existingTasks.filter(
        (task: { id: string }) => !clickUpTaskIds.has(task.id)
      );

      // Delete tasks that were moved to another sprint
      if (tasksToDelete.length > 0) {
        await prisma.$transaction(async (tx: PrismaTransaction) => {
          // Delete task tags first
          await tx.taskTag.deleteMany({
            where: {
              taskId: { in: tasksToDelete.map((t: { id: string }) => t.id) },
              sprintId: sprint.id,
            },
          });

          // Delete task assignees
          await tx.taskAssignee.deleteMany({
            where: {
              taskId: { in: tasksToDelete.map((t: { id: string }) => t.id) },
              sprintId: sprint.id,
            },
          });

          // Delete task reviewers
          await tx.taskReviewer.deleteMany({
            where: {
              taskId: { in: tasksToDelete.map((t: { id: string }) => t.id) },
              sprintId: sprint.id,
            },
          });

          // Finally delete the tasks
          await tx.task.deleteMany({
            where: {
              id: { in: tasksToDelete.map((t: { id: string }) => t.id) },
              sprintId: sprint.id,
            },
          });
        });

        console.log(
          `✅ Deleted ${tasksToDelete.length} tasks that were moved from Sprint ${sprint.id}`
        );
      }

      // Process tasks in smaller batches
      const batchSize = 25; // Reduced batch size
      for (let i = 0; i < allTasks.length; i += batchSize) {
        const taskBatch = allTasks.slice(i, i + batchSize);
        try {
          await processBatch(
            taskBatch,
            sprint,
            statusMap as Map<string, string>,
            statuses
          );
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            "code" in error &&
            (error as { code: string }).code === "P2028"
          ) {
            console.warn(
              `Transaction timeout for batch ${i}-${
                i + batchSize
              }, retrying with smaller batch...`
            );
            // If transaction times out, process the batch in even smaller chunks
            const smallerBatchSize = 10;
            for (let j = 0; j < taskBatch.length; j += smallerBatchSize) {
              const smallerBatch = taskBatch.slice(j, j + smallerBatchSize);
              await processBatch(
                smallerBatch,
                sprint,
                statusMap as Map<string, string>,
                statuses
              );
            }
          } else {
            throw error;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully synchronized today's tasks",
    });
  } catch (error) {
    console.error("Error synchronizing tasks:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET /api/sprints/sync - Synchronize all sprints from ClickUp
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }
    await syncSprintsFromClickUp();
    await syncTodayTasksFromClickUp();

    return NextResponse.json({
      success: true,
      message: "Successfully synchronized sprints from ClickUp",
    });
  } catch (error) {
    console.error("Error synchronizing sprints:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
