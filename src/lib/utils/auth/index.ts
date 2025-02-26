import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { findRoleIdAndEngineerIdByUserId } from "@/services/users";
import { ROLE } from "@/types/roles";

export async function authenticateAndRedirect() {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in"); // Redirect if not logged in
  }

  const { roleId, engineerId } = await findRoleIdAndEngineerIdByUserId(userId);

  if (roleId === ROLE.SOFTWARE_ENGINEER) {
    const targetUrl = `/engineer/${engineerId}`;
    return redirect(targetUrl); // Redirect to engineer page if role is SOFTWARE_ENGINEER
  }

  return { userId, roleId, engineerId };
}
