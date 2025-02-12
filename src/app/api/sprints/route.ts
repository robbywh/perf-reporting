import { NextResponse } from "next/server";

import { getFolderList } from "@/lib/clickup/lists.service";
import { prisma } from "@/services/db";

export async function POST() {
  try {
    // Call the external API library to fetch sprint lists from ClickUp.
    const folderListResponse = await getFolderList();

    // Ensure the response contains a "lists" array.
    const lists = folderListResponse.lists;
    if (!lists || !Array.isArray(lists)) {
      return NextResponse.json(
        { error: "Invalid API response structure" },
        { status: 400 }
      );
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
            start_date: startDateUTC,
            end_date: endDateUTC,
          },
        });
      }
    }

    return NextResponse.json({ message: "Sprints processed successfully" });
  } catch (error) {
    console.error("Error processing sprints:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
