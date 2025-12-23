"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/services/db";

const WORKING_DAYS_PER_SPRINT = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaTransactionClient = any;

type LeaveTypeKey =
  | "cuti_tahunan"
  | "sakit"
  | "izin"
  | "cuti_menikah"
  | "cuti_menikahkan_anak"
  | "cuti_khitanan_anak"
  | "cuti_baptis_anak"
  | "cuti_istri_melahirkan"
  | "cuti_keluarga_meninggal"
  | "cuti_keluarga_serumah_meninggal"
  | "cuti_ibadah_haji";

const LeaveTypeMapping: Record<LeaveTypeKey, string> = {
  cuti_tahunan: "Cuti Tahunan",
  sakit: "Sakit",
  izin: "Izin",
  cuti_menikah: "Cuti Menikah",
  cuti_menikahkan_anak: "Cuti Menikahkan Anak",
  cuti_khitanan_anak: "Cuti Khitanan Anak",
  cuti_baptis_anak: "Cuti Baptis Anak",
  cuti_istri_melahirkan: "Cuti Istri Melahirkan atau Keguguran",
  cuti_keluarga_meninggal: "Cuti Keluarga Meninggal",
  cuti_keluarga_serumah_meninggal:
    "Cuti Anggota Keluarga Dalam Satu Rumah Meninggal",
  cuti_ibadah_haji: "Cuti Ibadah Haji",
};

const leaveOrHolidaySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("leave"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    engineerId: z.string().transform((val) => Number(val)),
    leaveType: z.string(),
    requestType: z.enum([
      "full_day",
      "half_day_before_break",
      "half_day_after_break",
    ]),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal("holiday"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    description: z.string().optional(),
  }),
]);

type SprintEngineer = {
  engineer: {
    id: number;
    jobLevel: {
      baseline: number;
      target: number;
    };
    leaves: Array<{
      date: Date;
      type: "full_day" | "half_day_before_break" | "half_day_after_break";
    }>;
  };
};

async function findSprintByDate(
  date: Date,
  tx: PrismaTransactionClient = prisma,
  organizationId?: string
) {
  // Convert all dates to UTC midnight for comparison
  const dateToFind = new Date(
    date.toISOString().split("T")[0] + "T00:00:00.000Z"
  );

  const sprint = await tx.sprint.findFirst({
    where: {
      AND: [
        {
          startDate: {
            lte: new Date(dateToFind.getTime() + 24 * 60 * 60 * 1000), // Include entire day
          },
        },
        {
          endDate: {
            gte: dateToFind,
          },
        },
        ...(organizationId ? [{ organizationId }] : []),
      ],
    },
    // Also fetch start and end dates for logging
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });

  return sprint;
}

export async function adjustBaselineTarget(
  date: Date,
  engineerId: number | null,
  leaveType:
    | "full_day"
    | "half_day_before_break"
    | "half_day_after_break"
    | null,
  isDelete: boolean = false,
  tx: PrismaTransactionClient = prisma,
  organizationId?: string
) {
  // Validate organizationId is provided
  if (!organizationId) {
    console.warn("adjustBaselineTarget: organizationId is missing");
  }

  // Convert input date to UTC midnight for consistent comparison
  const dateToProcess = new Date(
    date.toISOString().split("T")[0] + "T00:00:00.000Z"
  );

  // Find sprint based on date - organizationId is required for proper filtering
  const sprint = await findSprintByDate(dateToProcess, tx, organizationId);
  if (!sprint) {
    throw new Error(
      `No sprint found for the given date${organizationId ? ` in organization ${organizationId}` : ""}`
    );
  }

  console.log("adjustBaselineTarget - Organization ID:", organizationId);
  console.log("adjustBaselineTarget - Sprint found:", sprint.name, sprint.id);

  // Get affected sprint engineers with their leaves and holidays in parallel
  const [sprintEngineers, publicHolidays] = await Promise.all([
    tx.sprintEngineer.findMany({
      where: engineerId
        ? { sprintId: sprint.id, engineerId }
        : { sprintId: sprint.id },
      include: {
        engineer: {
          include: {
            jobLevel: true,
            leaves: {
              where: {
                date: {
                  gte: sprint.startDate,
                  lte: sprint.endDate,
                },
              },
            },
          },
        },
      },
    }),
    tx.publicHoliday.findMany({
      where: {
        date: {
          gte: sprint.startDate,
          lte: sprint.endDate,
        },
      },
    }),
  ]);

  // Calculate how much to adjust per day for each engineer
  const updates = sprintEngineers.map((sprintEngineer: SprintEngineer) => {
    const { baseline, target } = sprintEngineer.engineer.jobLevel;
    const baselinePerDay = Number(baseline) / WORKING_DAYS_PER_SPRINT;
    const targetPerDay = Number(target) / WORKING_DAYS_PER_SPRINT;

    // Calculate total reduction from leaves
    let totalLeaveReduction = 0;

    // Count all existing leaves except the one being modified
    sprintEngineer.engineer.leaves.forEach((leave) => {
      const reduction = leave.type === "full_day" ? 1 : 0.5;
      totalLeaveReduction += reduction;
    });

    // Add the leave being modified if we're adding (not deleting)
    if (!isDelete && engineerId && leaveType) {
      const reduction = leaveType === "full_day" ? 1 : 0.5;
      totalLeaveReduction += reduction;
    }

    // Calculate holiday reduction
    let holidayReduction = publicHolidays.length;

    // Adjust holiday count if we're modifying a holiday
    if (!engineerId) {
      if (isDelete) {
        holidayReduction -= 1;
      } else {
        holidayReduction += 1;
      }
    }

    // Calculate total reduction including holidays
    const totalReduction = totalLeaveReduction + holidayReduction;

    // Calculate final baseline and target values
    const adjustedBaseline = Number(baseline) - baselinePerDay * totalReduction;
    const adjustedTarget = Number(target) - targetPerDay * totalReduction;

    return tx.sprintEngineer.update({
      where: {
        sprintId_engineerId: {
          sprintId: sprint.id,
          engineerId: sprintEngineer.engineer.id,
        },
      },
      data: {
        baseline: adjustedBaseline,
        target: adjustedTarget,
      },
    });
  });

  await Promise.all(updates);
}

export async function deleteLeaveOrHolidayAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const type = formData.get("type") as "leave" | "holiday";
  const date = formData.get("date") as string;
  const organizationId = formData.get("organizationId") as string | null;

  if (!id || !type || !date) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    // Parse the date string to a Date object
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: "Invalid date format" };
    }

    await prisma.$transaction(
      async (tx) => {
        if (type === "leave") {
          // Get leave details before deletion
          const leave = await tx.leave.findUnique({
            where: { id },
            select: { engineerId: true, type: true, date: true },
          });

          if (!leave) {
            throw new Error("Leave not found");
          }

          // Check if sprint exists for the given date
          const sprint = await findSprintByDate(
            leave.date,
            tx,
            organizationId || undefined
          );

          // Delete the leave
          await tx.leave.delete({ where: { id } });

          // Only adjust baseline if sprint exists
          if (sprint) {
            await adjustBaselineTarget(
              leave.date,
              leave.engineerId,
              leave.type,
              true, // isDelete flag
              tx,
              organizationId || undefined
            );
          }
        } else {
          // Get holiday before deletion
          const holiday = await tx.publicHoliday.findUnique({
            where: { id },
            select: { date: true },
          });

          if (!holiday) {
            throw new Error("Holiday not found");
          }

          // Check if sprint exists for the given date
          const sprint = await findSprintByDate(
            holiday.date,
            tx,
            organizationId || undefined
          );

          // Delete the holiday
          await tx.publicHoliday.delete({ where: { id } });

          // Only adjust baseline if sprint exists
          if (sprint) {
            await adjustBaselineTarget(
              holiday.date,
              null,
              "full_day",
              true, // isDelete flag
              tx,
              organizationId || undefined
            );
          }
        }
      },
      {
        timeout: 15000, // 14 seconds - under Prisma Accelerate's 15s limit
      }
    );

    revalidatePath(`/`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting leave/holiday:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete leave/holiday";
    return { success: false, error: errorMessage };
  }
}

export async function addLeaveOrHolidayAction(formData: FormData) {
  const rawData = {
    type: formData.get("type"),
    date: formData.get("date"),
    ...(formData.get("type") === "leave" && {
      engineerId: formData.get("engineerId"),
      leaveType: formData.get("leaveType"),
      requestType: formData.get("requestType"),
    }),
    description: formData.get("description"),
  };

  const parsedData = leaveOrHolidaySchema.safeParse(rawData);

  if (!parsedData.success) {
    return { success: false, error: parsedData.error.errors };
  }

  const dateObj = new Date(parsedData.data.date);
  const organizationId = formData.get("organizationId") as string | null;

  try {
    await prisma.$transaction(
      async (tx) => {
        // Check if sprint exists for the given date
        const sprint = await findSprintByDate(
          dateObj,
          tx,
          organizationId || undefined
        );

        if (parsedData.data.type === "leave") {
          const { engineerId, leaveType, requestType } = parsedData.data;
          await tx.leave.create({
            data: {
              date: dateObj,
              engineerId,
              type: requestType,
              description: LeaveTypeMapping[leaveType as LeaveTypeKey],
            },
          });

          // Only adjust baseline if sprint exists
          if (sprint) {
            await adjustBaselineTarget(
              dateObj,
              engineerId,
              requestType,
              false,
              tx,
              organizationId || undefined
            );
          }
        } else {
          await tx.publicHoliday.create({
            data: {
              date: dateObj,
              description: parsedData.data.description || "",
            },
          });

          // Only adjust baseline if sprint exists
          if (sprint) {
            await adjustBaselineTarget(
              dateObj,
              null,
              "full_day",
              false,
              tx,
              organizationId || undefined
            );
          }
        }
      },
      {
        timeout: 15000, // 14 seconds - under Prisma Accelerate's 15s limit
      }
    );

    revalidatePath(`/`);
    return { success: true };
  } catch (error) {
    console.error("Error adding leave/holiday:", error);
    return { success: false, error: "Failed to add leave/holiday" };
  }
}
