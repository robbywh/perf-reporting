"use server";

import { findAllSprints } from "@/services/sprints";

export async function getSprintsForOrganization(organizationId: string) {
  console.log(
    "🚀 Server Action: Getting sprints for organization:",
    organizationId,
  );

  try {
    const sprints = await findAllSprints(organizationId);
    console.log("✅ Server Action: Sprints found:", sprints.length);
    return { success: true, data: sprints };
  } catch (error) {
    console.error("❌ Server Action Error fetching sprints:", error);
    return { success: false, error: "Failed to fetch sprints" };
  }
}
