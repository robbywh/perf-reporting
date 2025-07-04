"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/services/db";

const updateCodingHoursSchema = z.object({
  sprintId: z.string(),
  engineerId: z.number(),
  codingHours: z.number().positive(),
  codingHoursUrl: z.string().optional(),
});

export async function uploadFile({
  file,
  fileName,
  filePath,
}: {
  file: File;
  fileName: string;
  filePath: string;
}): Promise<string> {
  const blob = await put(`${filePath}${fileName}`, file, {
    access: "public",
  });
  return blob.url;
}

export async function updateCodingHoursAction(data: {
  sprintId: string;
  engineerId: number;
  codingHours: number;
  codingHoursUrl?: string | null;
}) {
  const parsedData = updateCodingHoursSchema.safeParse(data);
  if (!parsedData.success) throw new Error("Invalid input data");

  await prisma.sprintEngineer.update({
    where: {
      sprintId_engineerId: {
        sprintId: parsedData.data.sprintId,
        engineerId: parsedData.data.engineerId,
      },
    },
    data: {
      codingHours: parsedData.data.codingHours,
      codingHoursUrl: parsedData.data.codingHoursUrl,
    },
  });

  revalidatePath(`/engineer/${parsedData.data.engineerId}`);
}
