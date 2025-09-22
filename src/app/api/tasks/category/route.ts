import { NextRequest, NextResponse } from "next/server";

import { findTasksByCategory } from "@/services/tasks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sprintIds = searchParams.get("sprintIds");
    const categoryId = searchParams.get("categoryId");

    if (!sprintIds || !categoryId) {
      return NextResponse.json(
        { error: "sprintIds and categoryId are required" },
        { status: 400 },
      );
    }

    const sprintIdArray = sprintIds.split(",").filter(Boolean);
    const tasks = await findTasksByCategory(sprintIdArray, categoryId);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
