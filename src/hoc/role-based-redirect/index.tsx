import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { findRoleIdAndEngineerIdByUserId } from "@/services/users";

const MANAGER_ROLES = ["em", "cto", "vp", "pm"];

export default async function RoleBasedRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in"); // Redirect if not logged in
  }

  const { roleId, engineerId } = await findRoleIdAndEngineerIdByUserId(userId);

  if (roleId && !MANAGER_ROLES.includes(roleId)) {
    redirect(`/engineer/${engineerId}`); // Redirect engineers to dashboard
  }

  return <>{children}</>; // Only managers see this
}
