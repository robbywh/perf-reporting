// Utility to get current sprintId from today's date
import { findTodaySprints } from "@/services/sprints";

export async function getCurrentSprintId(): Promise<string | null> {
  const sprints = await findTodaySprints();
  if (sprints && sprints.length > 0) {
    return sprints[0].id;
  }
  return null;
}
