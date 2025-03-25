import { APPROVED_STATUS_IDS } from "@/constants/client";
import { CRON_SECRET } from "@/constants/server";
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
    // Get today's sprints
    const todaySprints = await findTodaySprints();
    const sprintIds = todaySprints.map(
      (sprint: { id: string | number }) => sprint.id
    );

    // Get tasks with the specified statuses from today's sprints
    const tasks = await prisma.task.findMany({
      where: {
        statusId: {
          in: APPROVED_STATUS_IDS,
        },
        sprintId: {
          in: sprintIds.map(String),
        },
        parentTaskId: null, // Only get parent tasks
      },
      select: {
        id: true,
        name: true,
        sprintId: true,
        status: {
          select: {
            name: true,
          },
        },
        assignees: {
          select: {
            engineer: {
              select: {
                name: true,
              },
            },
          },
        },
        sprint: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create table headers
    const headers = ["Sprint", "Task ID", "Task Name", "Status", "Assignee"];
    const headerRow = `| ${headers.join(" | ")} |`;
    const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

    // Format tasks into table rows
    const taskRows = tasks
      .map(
        (task: {
          id: string;
          name: string;
          sprintId: string;
          status: { name: string } | null;
          assignees: { engineer: { name: string } }[];
          sprint: { name: string };
        }) => {
          const assigneeNames = task.assignees
            .map((a: { engineer: { name: string } }) => a.engineer.name)
            .join(", ");
          const statusName = task.status?.name || "No status";
          return `| ${task.sprint.name} | ${task.id} | ${task.name} | ${statusName} | ${assigneeNames || "No assignee"} |`;
        }
      )
      .join("\n");

    // Combine all parts
    const formattedText = `${headerRow}\n${separatorRow}\n${taskRows}`;

    console.log("formattedText", formattedText);

    // Return text file response
    return new Response(formattedText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating Notion script:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return new Response(`Error: ${errorMessage}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
