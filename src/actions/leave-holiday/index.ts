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

async function findSprintByDate(
  date: Date,
  tx: PrismaTransactionClient = prisma
) {
  // Convert date to YYYY-MM-DD format
  const dateStr = date.toISOString().split("T")[0];
  console.log("Finding sprint for date:", dateStr);

  const startOfDay = new Date(dateStr + "T00:00:00.000Z");
  const endOfDay = new Date(dateStr + "T23:59:59.999Z");

  console.log(
    "Looking for sprint containing time range:",
    startOfDay.toISOString(),
    "to",
    endOfDay.toISOString()
  );

  const sprint = await tx.sprint.findFirst({
    where: {
      AND: [
        {
          startDate: {
            lte: endOfDay,
          },
        },
        {
          endDate: {
            gte: startOfDay,
          },
        },
      ],
    },
  });

  console.log("Found sprint:", sprint?.id);
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

  // Get affected sprint engineers
  const sprintEngineers = await tx.sprintEngineer.findMany({
    where: engineerId
      ? { sprintId: sprint.id, engineerId }
      : { sprintId: sprint.id },
    select: {
      engineerId: true,
    },
    include: {
      engineer: {
        include: {
          jobLevel: true,
        },
      },
    },
  });

  // Calculate reduction factor
  const reductionFactor = leaveType === "full_day" ? 1 : 0.5;
  // Calculate how much to adjust per day
  const updates = sprintEngineers.map(
    (sprintEngineer: {
      engineer: { jobLevel: { baseline: number; target: number } };
      engineerId: number;
    }) => {
      const { baseline, target } = sprintEngineer.engineer.jobLevel;
      const baselinePerDay = Number(baseline) / WORKING_DAYS_PER_SPRINT;
      const targetPerDay = Number(target) / WORKING_DAYS_PER_SPRINT;

      // If deleting, we add back the days (increment)
      // If adding, we reduce the days (decrement)
      const baselineChange = isDelete
        ? baselinePerDay * reductionFactor
        : -(baselinePerDay * reductionFactor);
      const targetChange = isDelete
        ? targetPerDay * reductionFactor
        : -(targetPerDay * reductionFactor);

      return tx.sprintEngineer.update({
        where: {
          sprintId_engineerId: {
            sprintId: sprint.id,
            engineerId: sprintEngineer.engineerId,
          },
        },
        data: {
          baseline: {
            increment: baselineChange,
          },
          target: {
            increment: targetChange,
          },
        },
      });
    }
  );

  // Execute all updates in parallel
  await Promise.all(updates);
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

  try {
    await prisma.$transaction(
      async (tx) => {
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

          await adjustBaselineTarget(
            dateObj,
            engineerId,
            requestType,
            false,
            tx
          );
        } else {
          await tx.publicHoliday.create({
            data: {
              date: dateObj,
              description: parsedData.data.description || "",
            },
          });

          await adjustBaselineTarget(dateObj, null, "full_day", false, tx);
        }
      },
      {
        timeout: 10000, // Increase timeout to 10 seconds
      }
    );

    revalidatePath(`/`);
    return { success: true };
  } catch (error) {
    console.error("Error adding leave/holiday:", error);
    return { success: false, error: "Failed to add leave/holiday" };
  }
}
