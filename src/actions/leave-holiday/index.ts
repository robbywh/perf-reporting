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
  leaveType: z
    .enum(["full_day", "half_day_before_break", "half_day_after_break"])
    .optional(),
});

export async function addLeaveOrHolidayAction(formData: FormData) {
  const parsedData = leaveOrHolidaySchema.safeParse({
    description: formData.get("description"),
    date: formData.get("date"),
    type: formData.get("type"),
    engineerId: formData.get("engineerId")
      ? Number(formData.get("engineerId"))
      : undefined,
    leaveType: formData.get("leaveType"),
  });

  if (!parsedData.success) {
    return { success: false, error: parsedData.error.errors };
  }

  const { description, date, type, engineerId, leaveType } = parsedData.data;

  try {
    if (type === "leave" && engineerId) {
      await prisma.leave.create({
        data: {
          engineerId,
          description: description || "",
          date: new Date(date).toISOString(),
          type: leaveType || "full_day",
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
