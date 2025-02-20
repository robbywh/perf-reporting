import { NextResponse } from "next/server";

import { API_KEY } from "@/constants/server.constant";
import { getFolderList } from "@/lib/clickup/lists";
import { ClickUpTask, getListTasks } from "@/lib/clickup/tasks";
import { linkAssigneesToTask } from "@/services/assignees";
import { prisma } from "@/services/db";
import { linkSprintsToEngineers } from "@/services/sprint-engineers";
import { findTodaySprints } from "@/services/sprints";
import { linkTagsToTask } from "@/services/tags";
import { upsertTask } from "@/services/tasks";

async function syncSprintsFromClickUp() {
  // Call the external API library to fetch sprint lists from ClickUp.
  const folderListResponse = await getFolderList();

  // Ensure the response contains a "lists" array.
  const lists = folderListResponse.lists;
  if (!lists || !Array.isArray(lists)) {
    throw new Error("Invalid API response structure");
  }

  // Process each sprint list
  for (const list of lists) {
    const { id, name, start_date: startDate, due_date: dueDate } = list;

    // Convert epoch strings (or numbers) to Date objects.
    // These Date objects represent UTC dates. When calling toISOString(),
    // they will be in Zulu format (e.g., "2025-01-08T00:00:00.000Z").
    const startDateUTC = new Date(Number(startDate));
    const endDateUTC = new Date(Number(dueDate));

    // Check if a sprint with the given id already exists.
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
    });

    if (!existingSprint) {
      // Insert the new sprint record into the database.
      await prisma.sprint.create({
        data: {
          id,
          name,
          startDate: startDateUTC,
          endDate: endDateUTC,
        },
      });
    }
  }
}

async function syncTodayTasksFromClickUp() {
  try {
    const todaySprints = await findTodaySprints();

    for (const sprint of todaySprints) {
      await linkSprintsToEngineers(sprint.id);
      let page = 0;
      let lastPage = false;

      while (!lastPage) {
        // Fetch tasks for the current sprint and page
        const response = await getListTasks(sprint.id, page);
        const tasks: ClickUpTask[] = response.tasks;
        lastPage = response.last_page;

        // Process each task
        for (const task of tasks) {
          const categoryField = task.custom_fields?.find(
            (field) => field.name === "Kategori"
          );
          const categoryId = categoryField?.value?.[0] ?? null; // Get first category value if exists

          const storyPoint = task.time_estimate
            ? task.time_estimate / 3600000
            : 0;

          const taskData = {
            id: task.id,
            name: task.name,
            sprintId: sprint.id,
            statusName: task.status.status,
            categoryId,
            parentTaskId: task.parent,
            storyPoint,
          };
          await upsertTask(taskData).then(async () => {
            await linkTagsToTask({
              id: task.id,
              tags: task.tags,
            });
            await linkAssigneesToTask({
              id: task.id,
              assignees: task.assignees,
              sprintId: sprint.id,
              storyPoint,
              statusName: task.status.status,
            });
          });
        }

        // Move to next page
        page++;
      }
    }

    return NextResponse.json({ message: "Today's tasks synced successfully." });
  } catch (error) {
    console.error("Error syncing today's tasks:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (API_KEY !== request.headers.get("x-api-key")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncSprintsFromClickUp();
    await syncTodayTasksFromClickUp();

    return NextResponse.json({ message: "Sprints processed successfully" });
  } catch (error) {
    console.error("Error processing sprints:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
