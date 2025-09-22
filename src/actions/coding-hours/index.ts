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
  try {
    // Sanitize fileName by removing special characters and replacing spaces with hyphens
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9-_.]/g, "-") // Replace special chars with hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .toLowerCase(); // Convert to lowercase

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const finalFileName = `${sanitizedFileName}-${timestamp}.${fileExtension}`;

    console.log("Server: Starting blob upload:", {
      originalFileName: fileName,
      sanitizedFileName: finalFileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
    });

    const blob = await put(`${filePath}${finalFileName}`, file, {
      access: "public",
    });

    console.log("Server: Blob upload successful:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("Server: Blob upload failed:", error);
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
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
