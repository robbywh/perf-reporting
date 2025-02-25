"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/services/db";

const leaveOrHolidaySchema = z.object({
  description: z.string(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  type: z.enum(["leave", "holiday"]),
  engineerId: z.number().optional(),
});

export async function addLeaveOrHolidayAction(formData: FormData) {
  const parsedData = leaveOrHolidaySchema.safeParse({
    description: formData.get("description"),
    date: formData.get("date"),
    type: formData.get("type"),
    engineerId: formData.get("engineerId")
      ? Number(formData.get("engineerId"))
      : undefined,
  });

  if (!parsedData.success) {
    return { success: false, error: parsedData.error.errors };
  }

  const { description, date, type, engineerId } = parsedData.data;

  try {
    if (type === "leave" && engineerId) {
      await prisma.leave.create({
        data: {
          engineerId,
          description: description || "",
          date: new Date(date).toISOString(),
        },
      });
    } else {
      await prisma.publicHoliday.create({
        data: {
          description: description || "",
          date: new Date(date).toISOString(),
        },
      });
    }
    revalidatePath(`/`);
    return { success: true };
  } catch (error) {
    console.error("Error adding leave/holiday:", error);
    return { success: false, error: "Failed to add leave/holiday" };
  }
}
