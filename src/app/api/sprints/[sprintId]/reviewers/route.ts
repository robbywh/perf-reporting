import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { APPROVED_STATUS_IDS } from "@/constants/client";
import { CRON_SECRET } from "@/constants/server";
import { prisma } from "@/services/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const { sprintId } = await params;
    const { searchParams } = new URL(request.url);

    // Get reviewerIds from comma-separated string
    const reviewerIdsParam = searchParams.get("reviewerIds");
    const reviewerIds = reviewerIdsParam
      ? reviewerIdsParam.split(",").filter((id) => id.trim() !== "")
      : [];

    // Get all tasks for the sprint with status product_approval or product_review
    const tasks = await prisma.task.findMany({
      where: {
        sprintId,
        statusId: {
          in: APPROVED_STATUS_IDS,
        },
        ...(reviewerIds.length > 0 && {
          reviewers: {
            some: {
              reviewerId: {
                in: reviewerIds.map((id) => parseInt(id)),
              },
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

    // Initialize response structure with reviewers
    const reviewerMap: Record<
      string,
      {
        rejectedTasks: { count: number; data: string[] };
        scenarioTasks: { count: number; data: string[] };
        qaTasks: { count: number; data: string[] };
        supportedTasks: { count: number; data: string[] };
      }
    > = {};

    // Process tasks and organize by reviewer
    tasks.forEach((task) => {
      const taskName = task.name.toLowerCase();

      // Process each reviewer for this task
      task.reviewers.forEach((taskReviewer) => {
        const reviewerName = taskReviewer.reviewer.name;

        // Initialize reviewer data if not exists
        if (!reviewerMap[reviewerName]) {
          reviewerMap[reviewerName] = {
            rejectedTasks: { count: 0, data: [] },
            scenarioTasks: { count: 0, data: [] },
            qaTasks: { count: 0, data: [] },
            supportedTasks: { count: 0, data: [] },
          };
        }

        // Check for rejected tasks
        if (taskName.includes("[rejected]")) {
          reviewerMap[reviewerName].rejectedTasks.count++;
          reviewerMap[reviewerName].rejectedTasks.data.push(task.name);
        }
        // Check for scenario tasks
        else if (taskName.includes("[scenario]")) {
          reviewerMap[reviewerName].scenarioTasks.count++;
          reviewerMap[reviewerName].scenarioTasks.data.push(task.name);
        }
        // Check for QA tasks (excluding scenario tasks)
        else if (
          (taskName.includes("[qa]") || taskName.includes("qa:")) &&
          !taskName.includes("[scenario]")
        ) {
          reviewerMap[reviewerName].qaTasks.count++;
          reviewerMap[reviewerName].qaTasks.data.push(task.name);
        }
        // Check for Support tasks
        else if (taskName.includes("[support]")) {
          reviewerMap[reviewerName].supportedTasks.count++;
          reviewerMap[reviewerName].supportedTasks.data.push(task.name);
        }
      });
    });

    return NextResponse.json({ reviewers: reviewerMap });
  } catch (error) {
    console.error("Error fetching sprint reviewer statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprint reviewer statistics" },
      { status: 500 }
    );
  }
}
