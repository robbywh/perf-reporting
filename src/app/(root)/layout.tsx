import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { SprintMultiSelect } from "@/components/sprint-multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { getWelcomeMessage } from "@/lib/utils/global";
import { findAllSprints } from "@/services/sprints";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";

import Header from "../../components/header";

const WelcomeMessage = async () => {
  const user = await currentUser(); // Fetch the logged-in user
  const firstName = user?.firstName || "Guest";
  const { roleId } = await findRoleIdAndEngineerIdByUserId(user?.id || "");
  const welcomeMessage = getWelcomeMessage(roleId || "", firstName);

  return <div className="flex-1 text-lg font-bold">{welcomeMessage}</div>;
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sprints = await findAllSprints();

  const formattedSprints = sprints.map((sprint) => ({
    value: sprint.id,
    label: sprint.name,
    startDate: new Date(sprint.startDate),
    endDate: new Date(sprint.endDate),
  }));

  const currentDate = new Date();
  const defaultSprint =
    formattedSprints.find(
      (sprint) =>
        new Date(sprint.startDate) <= currentDate &&
        currentDate <= new Date(sprint.endDate)
    ) || formattedSprints[0];
  return (
    <div>
      <Header />
      <div className="flex flex-row items-center gap-4 px-10 pt-10">
        <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
          <WelcomeMessage />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
          <SprintMultiSelect
            sprints={formattedSprints}
            defaultSprintId={defaultSprint.value}
          />
        </Suspense>
      </div>
      <div className="p-10">{children}</div>
    </div>
  );
}
