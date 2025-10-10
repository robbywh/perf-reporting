import { NextResponse } from "next/server";

import { CRON_SECRET, getApiConfig } from "@/constants/server";
import { ClickUpTask, getListTasks } from "@/lib/clickup/tasks";
import { prisma } from "@/services/db";
import { findTodaySprints } from "@/services/sprints";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    // Get query parameters for targeted sync
    const { searchParams } = new URL(request.url);
    const targetOrgId = searchParams.get("organization_id") || undefined;
    const targetSprintId = searchParams.get("sprint_id") || undefined;

    console.log(
      `🔄 Starting project sync${targetOrgId ? ` for organization: ${targetOrgId}` : ""}${targetSprintId ? ` for sprint: ${targetSprintId}` : ""}`
    );

    // Get all organizations that have API configuration
    const organizations = await prisma.organization.findMany({
      where: targetOrgId ? { id: targetOrgId } : undefined,
      select: {
        id: true,
        name: true,
        settings: {
          where: {
            param: { in: ["CLICKUP_API_TOKEN"] },
          },
          select: {
            param: true,
            value: true,
          },
        },
      },
    });

    // Filter organizations that have required settings
    const validOrganizations = organizations.filter((org) => {
      const hasToken = org.settings.some(
        (s) => s.param === "CLICKUP_API_TOKEN" && s.value
      );
      return hasToken;
    });

    console.log(
      `🔍 Found ${validOrganizations.length} organizations with ClickUp configuration`
    );

    let totalTasksUpdated = 0;

    // Process each organization sequentially
    for (const org of validOrganizations) {
      try {
        console.log(`\n📋 Processing organization: ${org.name} (${org.id})`);

        // Get API configuration from database
        const apiConfig = await getApiConfig(org.id);

        if (!apiConfig.CLICKUP_API_TOKEN) {
          console.log(
            `⚠️ Missing ClickUp API configuration for organization ${org.id}, skipping...`
          );
          continue;
        }

        // Get sprints based on filter
        let sprints;
        if (targetSprintId) {
          // Specific sprint requested
          const sprint = await prisma.sprint.findUnique({
            where: { id: targetSprintId },
            select: { id: true, name: true, organizationId: true },
          });
          sprints = sprint && sprint.organizationId === org.id ? [sprint] : [];
        } else {
          // Get today's sprints for this organization
          sprints = await findTodaySprints(org.id);
        }

        console.log(`📅 Found ${sprints.length} sprint(s) to process`);

        // Process each sprint
        for (const sprint of sprints) {
          console.log(
            `🔄 Syncing tasks for sprint: ${sprint.name} (${sprint.id})`
          );

          let page = 0;
          let lastPage = false;
          const allTasks: ClickUpTask[] = [];

          // Fetch all tasks from ClickUp
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

          console.log(`📦 Fetched ${allTasks.length} tasks from ClickUp`);

          // Get all valid project IDs from the custom field options
          const projectIds = new Set<string>();
          allTasks.forEach((task) => {
            const projectField = task.custom_fields?.find(
              (field) => field.name === "Project"
            );
            if (projectField?.type_config?.options) {
              projectField.type_config.options.forEach((option) => {
                projectIds.add(option.id);
              });
            }
          });

          // Update tasks with project_id
          let updatedCount = 0;
          for (const task of allTasks) {
            const projectField = task.custom_fields?.find(
              (field) => field.name === "Project"
            );
            const rawProjectId = projectField?.value?.[0] ?? null;
            const projectId =
              rawProjectId && projectIds.has(rawProjectId)
                ? rawProjectId
                : null;

            // Only update the task if it exists in database
            try {
              const existingTask = await prisma.task.findUnique({
                where: {
                  id_sprintId: {
                    id: task.id,
                    sprintId: sprint.id,
                  },
                },
                select: { id: true },
              });

              if (existingTask) {
                await prisma.task.update({
                  where: {
                    id_sprintId: {
                      id: task.id,
                      sprintId: sprint.id,
                    },
                  },
                  data: {
                    projectId,
                  },
                });
                updatedCount++;
              }
            } catch (error) {
              console.warn(
                `⚠️ Failed to update task ${task.id}: ${error instanceof Error ? error.message : "Unknown error"}`
              );
            }
          }

          console.log(
            `✅ Updated ${updatedCount} tasks in sprint ${sprint.name}`
          );
          totalTasksUpdated += updatedCount;
        }

        console.log(`✅ Completed sync for organization: ${org.name}`);
      } catch (error) {
        console.error(
          `❌ Error syncing organization ${org.name} (${org.id}):`,
          error
        );
        // Continue with next organization instead of failing completely
      }
    }

    const responseMessage = targetSprintId
      ? `Successfully synchronized sprint ${targetSprintId}`
      : targetOrgId
        ? `Successfully synchronized organization ${targetOrgId}`
        : "Successfully synchronized all organizations";

    return NextResponse.json({
      success: true,
      message: responseMessage,
      tasksUpdated: totalTasksUpdated,
      organizationsProcessed: validOrganizations.length,
      ...(targetOrgId && { targetOrganization: targetOrgId }),
      ...(targetSprintId && { targetSprint: targetSprintId }),
    });
  } catch (error) {
    console.error("Error synchronizing project_id:", error);
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
