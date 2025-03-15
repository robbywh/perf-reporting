import { NextResponse } from "next/server";

import { CRON_SECRET } from "@/constants/server";
import { prisma } from "@/services/db";

export async function GET(
  request: Request,
  context: { params: { sprintId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const params = await Promise.resolve(context.params);
    const { sprintId } = params;
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get("reviewerId");

    // Get all tasks for the sprint
    const tasks = await prisma.task.findMany({
      where: {
        sprintId,
        ...(reviewerId && {
          reviewers: {
            some: {
              reviewerId: parseInt(reviewerId),
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        statusId: true,
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
    });

    // Initialize response structure
    const response = {
      rejectedTasks: {
        count: 0,
        data: [] as string[],
      },
      scenarioTasks: {
        count: 0,
        data: [] as string[],
      },
      qaTasks: {
        count: 0,
        data: [] as string[],
      },
    };

    // Process tasks
    tasks.forEach((task) => {
      const taskName = task.name.toLowerCase();

      // Check for rejected tasks
      if (taskName.includes("[rejected]")) {
        response.rejectedTasks.count++;
        response.rejectedTasks.data.push(task.name);
      }
      // Check for scenario tasks
      else if (taskName.includes("[scenario]")) {
        response.scenarioTasks.count++;
        response.scenarioTasks.data.push(task.name);
      }
      // Check for QA tasks (excluding scenario tasks)
      else if (
        (taskName.includes("[qa]") || taskName.includes("qa:")) &&
        !taskName.includes("[scenario]")
      ) {
        response.qaTasks.count++;
        response.qaTasks.data.push(task.name);
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching sprint reviewer statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprint reviewer statistics" },
      { status: 500 }
    );
  }
}
