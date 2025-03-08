import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { API_KEY } from "@/constants/server";
import { getFolderList } from "@/lib/clickup/lists";
import { ClickUpTask, getListTasks } from "@/lib/clickup/tasks";
import { prisma } from "@/services/db";
import { linkSprintsToEngineers } from "@/services/sprint-engineers";
import { findTodaySprints } from "@/services/sprints";
import { linkTagsToTask } from "@/services/tags";
import { linkAssigneesToTask } from "@/services/task-assignees";

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
    const startDateUTC = new Date(Number(startDate));
    startDateUTC.setUTCHours(0, 0, 0, 0);
    const endDateUTC = new Date(Number(dueDate));
    endDateUTC.setUTCHours(23, 59, 59, 999);

    return {
      id,
      name: name.substring(0, 10),
      startDate: startDateUTC,
      endDate: endDateUTC,
    };
  });

  await prisma.$transaction(async (tx) => {
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
    async (tx) => {
      // First, bulk upsert all tasks
      await Promise.all(
        validTasks.map((taskData) =>
          tx.task.upsert({
            where: { id: taskData.id },
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
            tags: taskData.tags,
          })
        )
      );

      // Finally, link assignees for all tasks
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
    },
    {
      timeout: 10000, // 10 seconds timeout for each batch
      maxWait: 5000, // 5 seconds maximum wait time
    }
  );
}

async function syncTodayTasksFromClickUp() {
  try {
    const todaySprints = await findTodaySprints();

    // First, fetch all statuses to create a name-to-id mapping
    const statuses = await prisma.status.findMany();
    const statusMap = new Map(statuses.map((s) => [s.name, s.id]));

    for (const sprint of todaySprints) {
      await linkSprintsToEngineers(sprint.id);
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

      // Process tasks in smaller batches
      const batchSize = 25; // Reduced batch size
      for (let i = 0; i < allTasks.length; i += batchSize) {
        const taskBatch = allTasks.slice(i, i + batchSize);
        try {
          await processBatch(taskBatch, sprint, statusMap, statuses);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2028"
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
              await processBatch(smallerBatch, sprint, statusMap, statuses);
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

// POST /api/sprints/sync - Synchronize all sprints from ClickUp
export async function POST(request: Request) {
  try {
    if (API_KEY !== request.headers.get("x-api-key")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
