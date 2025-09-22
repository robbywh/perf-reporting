import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { findUserOrganizations } from "@/services/organizations";
import { getCurrentSprintId } from "@/services/sprints/getCurrentSprintId";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";
import { ROLE } from "@/types/roles";

export async function authenticateAndRedirect() {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in"); // Redirect if not logged in
  }

  const { roleId, engineerId } = await findRoleIdAndEngineerIdByUserId(userId);

  if (roleId === ROLE.SOFTWARE_ENGINEER && engineerId) {
    // Get the user's top organization (first in their organization list)
    const organizations = await findUserOrganizations(userId);
    const organizationId =
      organizations.length > 0 ? organizations[0].id : null;

    if (organizationId) {
      // Get current sprint for the organization
      const currentSprintId = await getCurrentSprintId(organizationId);
      const targetUrl = currentSprintId
        ? `/engineer/${engineerId}?org=${organizationId}&sprintIds=${currentSprintId}`
        : `/engineer/${engineerId}?org=${organizationId}`;
      return redirect(targetUrl);
    } else {
      return redirect(`/engineer/${engineerId}`);
    }
  }

  return { userId, roleId, engineerId };
}
