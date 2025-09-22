import { NextRequest, NextResponse } from "next/server";

import { findAllTasksByCategories } from "@/services/tasks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sprintIds = searchParams.get("sprintIds");

    if (!sprintIds) {
      return NextResponse.json(
        { error: "sprintIds is required" },
        { status: 400 },
      );
    }

    const sprintIdArray = sprintIds.split(",").filter(Boolean);
    const tasks = await findAllTasksByCategories(sprintIdArray);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching all tasks by categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
