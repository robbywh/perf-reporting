import { NextResponse } from "next/server";

import { CRON_SECRET, getApiConfig } from "@/constants/server";
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

async function syncSprintsFromClickUp(organizationId: string, targetSprintId?: string) {
  const sprintInfo = targetSprintId ? ` for sprint ${targetSprintId}` : '';
  console.log(`🔄 Starting sprint sync for organization: ${organizationId}${sprintInfo}`);

  try {
    // Get API configuration from database
    const apiConfig = await getApiConfig(organizationId);

    if (!apiConfig.CLICKUP_API_TOKEN || !apiConfig.CLICKUP_FOLDER_ID) {
      console.log(
        `⚠️ Missing ClickUp API configuration for organization ${organizationId}, skipping...`
      );
      return;
    }

    // If targeting a specific sprint, validate it exists and belongs to this organization
    if (targetSprintId) {
      const existingSprint = await prisma.sprint.findFirst({
        where: {
          id: targetSprintId,
          organizationId
        }
      });

      if (!existingSprint) {
        console.log(`❌ Sprint ${targetSprintId} not found in organization ${organizationId}`);
        return;
      }
    }

    // Call the external API library to fetch sprint lists from ClickUp.
    const folderListResponse = await getFolderList(
      apiConfig.CLICKUP_API_TOKEN,
      apiConfig.CLICKUP_BASE_URL!,
      apiConfig.CLICKUP_FOLDER_ID
    );

    // Ensure the response contains a "lists" array.
    const lists = folderListResponse.lists;
    if (!lists || !Array.isArray(lists)) {
      throw new Error("Invalid API response structure");
    }

    // Filter lists if targeting a specific sprint
    const filteredLists = targetSprintId
      ? lists.filter(list => list.id === targetSprintId)
      : lists;

    if (targetSprintId && filteredLists.length === 0) {
      console.log(`⚠️ Sprint ${targetSprintId} not found in ClickUp folder`);
      return;
    }

    // Process all sprints in a single transaction
    const sprintData = filteredLists.map((list) => {
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
        organizationId,
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

    console.log(`✅ Successfully synchronized sprints for organization: ${organizationId}`);
  } catch (error) {
    console.error(
      `❌ Error synchronizing sprints for organization ${organizationId}:`,
      error
    );
    // Don't throw - let the main sync continue with next organization
  }
}

async function processBatch(
  tasks: ClickUpTask[],
  sprint: { id: string },
  statusMap: Map<string, string>,
  statuses: { id: string; name: string }[],
  categoryIds: Set<string>,
  organizationId: string
) {
  const taskDataBatch = tasks.map((task) => {
    const categoryField = task.custom_fields?.find(
      (field) => field.name === "Kategori"
    );
    const rawCategoryId = categoryField?.value?.[0] ?? null;
    // Only use categoryId if it exists in the organization
    const categoryId = rawCategoryId && categoryIds.has(rawCategoryId) ? rawCategoryId : null;

    if (rawCategoryId && !categoryIds.has(rawCategoryId)) {
      console.warn(
        `🟡 Task ${task.id} (${task.name}) has invalid category: ${rawCategoryId}, setting to null`
      );
    }

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

  // First, ensure all tasks are migrated/created before any linking
  await prisma.$transaction(
    async (tx: PrismaTransaction) => {
      // Step 1: Sequentially upsert all tasks to ensure they exist
      for (const taskData of validTasks) {
        await tx.task.upsert({
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
        });
      }
    },
    {
      timeout: 15000, // 15 seconds timeout for task creation
      maxWait: 10000, // 10 seconds maximum wait time
    }
  );

  // Step 2: After all tasks are guaranteed to exist, create relationships
  await Promise.all([
    // Link tags for all tasks
    Promise.all(
      validTasks.map((taskData) =>
        linkTagsToTask({
          id: taskData.id,
          sprintId: taskData.sprintId,
          tags: taskData.tags,
          organizationId,
        })
      )
    ),
    // Link assignees for all tasks
    Promise.all(
      validTasks.map((taskData) =>
        linkAssigneesToTask({
          id: taskData.id,
          assignees: taskData.assignees,
          sprintId: taskData.sprintId,
          storyPoint: taskData.storyPoint,
          statusName: taskData.statusId
            ? statuses.find((s) => s.id === taskData.statusId)?.name || ""
            : "",
          organizationId,
        })
      )
    ),
    // Link reviewers for all tasks
    Promise.all(
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
          organizationId,
        })
      )
    ),
  ]);
}

async function syncTodayTasksFromClickUp(organizationId: string, targetSprintId?: string) {
  try {
    const sprintInfo = targetSprintId ? ` for sprint ${targetSprintId}` : '';
    console.log(`🔄 Starting task sync for organization: ${organizationId}${sprintInfo}`);

    // Get API configuration from database
    const apiConfig = await getApiConfig(organizationId);

    if (!apiConfig.CLICKUP_API_TOKEN) {
      console.log(
        `⚠️ Missing ClickUp API configuration for organization ${organizationId}, skipping...`
      );
      return;
    }

    // Get sprints to sync - either specific sprint or current/future sprints
    let sprintsToSync;
    if (targetSprintId) {
      // For specific sprint, get just that sprint
      const specificSprint = await prisma.sprint.findFirst({
        where: {
          id: targetSprintId,
          organizationId
        }
      });

      if (!specificSprint) {
        console.log(`❌ Sprint ${targetSprintId} not found in organization ${organizationId}`);
        return;
      }

      sprintsToSync = [specificSprint];
      console.log(`🎯 Syncing specific sprint: ${specificSprint.name}`);
    } else {
      // Get current and future sprints for engineer/reviewer linking
      const currentAndFutureSprints = await findCurrentAndFutureSprints(organizationId);

      // Link engineers and reviewers for current and future sprints
      for (const sprint of currentAndFutureSprints) {
        await linkSprintsToEngineers(sprint.id, organizationId);
        await linkSprintsToReviewers(sprint.id, organizationId);
      }

      // Get today's sprints for task syncing
      sprintsToSync = await findTodaySprints(organizationId);
    }

    // First, fetch all statuses to create a name-to-id mapping
    const statuses = await prisma.status.findMany({
      where: { organizationId },
    });
    const statusMap = new Map<string, string>(
      statuses.map((s: { name: string; id: string }) => [s.name, s.id])
    );

    // Fetch all categories for this organization to validate categoryId
    const categories = await prisma.category.findMany({
      where: { organizationId },
    });
    const categoryIds = new Set(categories.map((c) => c.id));

    // Only sync tasks for the determined sprints
    for (const sprint of sprintsToSync) {
      let page = 0;
      let lastPage = false;
      const allTasks: ClickUpTask[] = [];

      // First, collect all tasks for this sprint
      try {
        while (!lastPage) {
          const response = await getListTasks(
            sprint.id,
            apiConfig.CLICKUP_API_TOKEN,
            apiConfig.CLICKUP_BASE_URL!,
            page
          );
          allTasks.push(...response.tasks);
          lastPage = response.last_page;
          page++;
        }
      } catch (error) {
        console.error(
          `❌ Error fetching tasks for sprint ${sprint.id} in organization ${organizationId}:`,
          error
        );
        // Skip this sprint and continue with next sprint
        continue;
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
            statuses,
            categoryIds,
            organizationId
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
                statuses,
                categoryIds,
                organizationId
              );
            }
          } else {
            throw error;
          }
        }
      }
    }

    console.log(
      `✅ Successfully synchronized tasks for organization: ${organizationId}`
    );
  } catch (error) {
    console.error(
      `❌ Error synchronizing tasks for organization ${organizationId}:`,
      error
    );
    throw error;
  }
}

// GET /api/sprints/sync - Synchronize sprints from ClickUp
// Optional query parameters:
// - organization_id: if provided with value, sync only that organization; if empty, sync all organizations
// - sprint_id: if provided with value, sync only that specific sprint; if empty, sync all sprints
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    // Parse URL to get optional parameters
    const url = new URL(request.url);
    const rawOrganizationId = url.searchParams.get("organization_id");
    const rawSprintId = url.searchParams.get("sprint_id");

    // Treat empty strings as null (sync all)
    const targetOrganizationId = rawOrganizationId && rawOrganizationId.trim() !== '' ? rawOrganizationId : null;
    const targetSprintId = rawSprintId && rawSprintId.trim() !== '' ? rawSprintId : null;

    // If sprint_id is provided, get its organization
    let sprintOrganizationId = targetOrganizationId;
    if (targetSprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: targetSprintId },
        select: { organizationId: true, name: true },
      });

      if (!sprint) {
        console.log(`❌ Sprint ${targetSprintId} not found`);
        return NextResponse.json({
          success: false,
          error: `Sprint ${targetSprintId} not found`,
        }, { status: 400 });
      }

      sprintOrganizationId = sprint.organizationId;
      console.log(`🎯 Targeting specific sprint: ${targetSprintId} (${sprint.name}) in organization: ${sprintOrganizationId}`);
    }

    // Build the where clause for organization filtering
    const organizationWhere = sprintOrganizationId
      ? { id: sprintOrganizationId }
      : {};

    // Get organizations that have API configuration (all or specific one)
    const organizations = await prisma.organization.findMany({
      where: organizationWhere,
      select: {
        id: true,
        name: true,
        settings: {
          where: {
            param: { in: ["CLICKUP_API_TOKEN", "CLICKUP_FOLDER_ID"] },
          },
          select: {
            param: true,
            value: true,
          },
        },
      },
    });

    // Filter organizations that have both required settings
    const validOrganizations = organizations.filter((org) => {
      const settings = org.settings;
      const hasToken = settings.some(
        (s) => s.param === "CLICKUP_API_TOKEN" && s.value
      );
      const hasFolder = settings.some(
        (s) => s.param === "CLICKUP_FOLDER_ID" && s.value
      );
      return hasToken && hasFolder;
    });

    // Log parameter interpretation
    if (rawOrganizationId !== null && rawOrganizationId.trim() === '') {
      console.log(`📝 Empty organization_id parameter detected - syncing all organizations`);
    }
    if (rawSprintId !== null && rawSprintId.trim() === '') {
      console.log(`📝 Empty sprint_id parameter detected - syncing all sprints`);
    }

    if (targetOrganizationId) {
      console.log(
        `🎯 Targeting specific organization: ${targetOrganizationId}`
      );

      if (validOrganizations.length === 0) {
        const message = organizations.length === 0
          ? `Organization ${targetOrganizationId} not found`
          : `Organization ${targetOrganizationId} found but missing ClickUp API configuration`;

        console.log(`❌ ${message}`);
        return NextResponse.json({
          success: false,
          error: message,
        }, { status: 400 });
      }

      console.log(
        `🔍 Found organization with ClickUp configuration: ${validOrganizations[0].name}`
      );
    } else {
      console.log(
        `🔍 Found ${validOrganizations.length} organizations with ClickUp configuration`
      );
    }

    // Process each organization sequentially to avoid overwhelming external APIs
    for (const org of validOrganizations) {
      try {
        console.log(`\n📋 Processing organization: ${org.name} (${org.id})`);
        await syncSprintsFromClickUp(org.id, targetSprintId || undefined);
        await syncTodayTasksFromClickUp(org.id, targetSprintId || undefined);
        console.log(`✅ Completed sync for organization: ${org.name}`);
      } catch (error) {
        console.error(
          `❌ Error syncing organization ${org.name} (${org.id}):`,
          error
        );
        // Continue with next organization instead of failing completely
      }
    }

    let message = '';
    if (targetSprintId) {
      message = `Successfully synchronized sprint ${targetSprintId}`;
    } else if (targetOrganizationId) {
      message = `Successfully synchronized sprints for organization ${targetOrganizationId}`;
    } else {
      message = `Successfully synchronized sprints for ${validOrganizations.length} organizations`;
    }

    return NextResponse.json({
      success: true,
      message,
      organizationsProcessed: validOrganizations.length,
      targetOrganization: targetOrganizationId || null,
      targetSprint: targetSprintId || null,
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
