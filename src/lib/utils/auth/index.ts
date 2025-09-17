import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { findEngineerOrganization } from "@/services/engineers";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";
import { ROLE } from "@/types/roles";

export async function authenticateAndRedirect() {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in"); // Redirect if not logged in
  }

  const { roleId, engineerId } = await findRoleIdAndEngineerIdByUserId(userId);

  if (roleId === ROLE.SOFTWARE_ENGINEER && engineerId) {
    // Get the engineer's organization to include in the URL
    const organizationId = await findEngineerOrganization(engineerId);
    const targetUrl = organizationId
      ? `/engineer/${engineerId}?org=${organizationId}`
      : `/engineer/${engineerId}`;
    return redirect(targetUrl); // Redirect to engineer page if role is SOFTWARE_ENGINEER
  }

  return { userId, roleId, engineerId };
}
