"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/services/db";

const WORKING_DAYS_PER_SPRINT = 10;

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

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

async function findSprintByDate(
  date: Date,
  tx: PrismaTransactionClient = prisma
) {
  const sprint = await tx.sprint.findFirst({
    where: {
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
  return sprint;
}

async function adjustBaselineTarget(
  date: Date,
  engineerId: number | null,
  leaveType:
    | "full_day"
    | "half_day_before_break"
    | "half_day_after_break"
    | null,
  isDelete: boolean = false,
  tx: PrismaTransactionClient = prisma
) {
  // Find sprint based on date
  const sprint = await findSprintByDate(date, tx);
  if (!sprint) {
    throw new Error("No sprint found for the given date");
  }

  // Calculate reduction factor based on leave type
  const reductionFactor = leaveType === "full_day" ? 1 : leaveType ? 0.5 : 1;

  // Query to get affected sprint engineers
  const sprintEngineers = await tx.sprintEngineer.findMany({
    where: engineerId
      ? { sprintId: sprint.id, engineerId }
      : { sprintId: sprint.id },
    include: {
      engineer: {
        include: {
          jobLevel: true,
        },
      },
    },
  });

  // Update each affected sprint engineer
  for (const sprintEngineer of sprintEngineers) {
    const { baseline, target } = sprintEngineer.engineer.jobLevel;

    let newBaseline: number;
    let newTarget: number;

    if (isDelete) {
      newBaseline =
        (Number(sprintEngineer.baseline) * WORKING_DAYS_PER_SPRINT) /
        (WORKING_DAYS_PER_SPRINT - reductionFactor);
      newTarget =
        (Number(sprintEngineer.target) * WORKING_DAYS_PER_SPRINT) /
        (WORKING_DAYS_PER_SPRINT - reductionFactor);
    } else {
      newBaseline =
        (Number(baseline) * (WORKING_DAYS_PER_SPRINT - reductionFactor)) /
        WORKING_DAYS_PER_SPRINT;
      newTarget =
        (Number(target) * (WORKING_DAYS_PER_SPRINT - reductionFactor)) /
        WORKING_DAYS_PER_SPRINT;
    }

    // Update sprint engineer
    await tx.sprintEngineer.update({
      where: {
        sprintId_engineerId: {
          sprintId: sprint.id,
          engineerId: sprintEngineer.engineerId,
        },
      },
      data: {
        baseline: newBaseline,
        target: newTarget,
      },
    });
  }
}

export async function deleteLeaveOrHolidayAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const type = formData.get("type") as "leave" | "holiday";
  const date = formData.get("date") as string;

  if (!id || !type || !date) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (type === "leave") {
        // Get leave details before deletion
        const leave = await tx.leave.findUnique({
          where: { id },
          select: { engineerId: true, type: true, date: true },
        });

        if (!leave) throw new Error("Leave not found");

        // Delete the leave
        await tx.leave.delete({ where: { id } });

        // Readjust baseline and target for the specific engineer
        await adjustBaselineTarget(
          leave.date,
          leave.engineerId,
          leave.type,
          true, // isDelete flag
          tx
        );
      } else {
        // Get holiday before deletion
        const holiday = await tx.publicHoliday.findUnique({
          where: { id },
          select: { date: true },
        });

        if (!holiday) throw new Error("Holiday not found");

        // Delete the holiday
        await tx.publicHoliday.delete({ where: { id } });

        // Readjust baseline and target for all engineers
        await adjustBaselineTarget(
          holiday.date,
          null,
          "full_day",
          true, // isDelete flag
          tx
        );
      }
    });

    revalidatePath(`/`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting leave/holiday:", error);
    return { success: false, error: "Failed to delete leave/holiday" };
  }
}

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
  const dateObj = new Date(date);

  try {
    // Start a transaction
    await prisma.$transaction(async (tx) => {
      if (type === "leave" && engineerId) {
        // Create leave record
        await tx.leave.create({
          data: {
            engineerId,
            description: description || "",
            date: dateObj.toISOString(),
            type: leaveType || "full_day",
          },
        });

        // Adjust baseline and target for the specific engineer
        await adjustBaselineTarget(
          dateObj,
          engineerId,
          leaveType || "full_day",
          false,
          tx
        );
      } else {
        // Create public holiday record
        await tx.publicHoliday.create({
          data: {
            description: description || "",
            date: dateObj.toISOString(),
          },
        });

        // Adjust baseline and target for all engineers in the sprint
        await adjustBaselineTarget(dateObj, null, "full_day", false, tx);
      }
    });

    revalidatePath(`/`);
    return { success: true };
  } catch (error) {
    console.error("Error adding leave/holiday:", error);
    return { success: false, error: "Failed to add leave/holiday" };
  }
}
