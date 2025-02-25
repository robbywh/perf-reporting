"use server";

import { prisma } from "@/services/db";

export async function addLeaveOrHoliday({
  description,
  date,
  type,
  engineerId,
}: {
  sprintId: string;
  description?: string;
  date: string;
  type: "leave" | "holiday";
  engineerId?: number;
}) {
  try {
    if (type === "leave" && engineerId) {
      await prisma.leave.create({
        data: {
          engineerId,
          description: description || "",
          date,
        },
      });
    } else {
      await prisma.publicHoliday.create({
        data: {
          description: description || "", // Store holiday description
          date,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding leave/holiday:", error);
    return { success: false, error: "Failed to add leave/holiday" };
  }
}
