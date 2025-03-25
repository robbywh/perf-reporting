import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { SprintMultiSelect } from "@/components/sprint-multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { getWelcomeMessage } from "@/lib/utils/global";
import { findAllSprints } from "@/services/sprints";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";

import Header from "../../components/header";

// Define types
type Sprint = {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
};

type SprintOption = {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
};

const WelcomeMessage = async () => {
  const user = await currentUser(); // Fetch the logged-in user
  const firstName = user?.firstName || "Guest";
  const { roleId } = await findRoleIdAndEngineerIdByUserId(user?.id || "");
  const welcomeMessage = getWelcomeMessage(roleId || "", firstName);

  return <div className="flex-1 text-lg font-bold">{welcomeMessage}</div>;
};

const getDateMonthsAgo = (months: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sprints = await findAllSprints();

  const allSprints = sprints.map((sprint: Sprint) => ({
    value: sprint.id,
    label: sprint.name,
    startDate: new Date(sprint.startDate),
    endDate: new Date(sprint.endDate),
  }));

  const currentDate = new Date();
  const oneMonthAgo = getDateMonthsAgo(1);
  const threeMonthsAgo = getDateMonthsAgo(3);
  const sixMonthsAgo = getDateMonthsAgo(6);

  const past1MonthSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= oneMonthAgo
  );

  const past3MonthsSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= threeMonthsAgo
  );

  const past6MonthsSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= sixMonthsAgo
  );

  const defaultSprint =
    allSprints.find(
      (sprint: SprintOption) =>
        new Date(sprint.startDate) <= currentDate &&
        currentDate <= new Date(sprint.endDate)
    ) || allSprints[allSprints.length - 1];

  const sprintOptions = [
    { label: "Past 1 Month", sprints: past1MonthSprints },
    { label: "Past 3 Months", sprints: past3MonthsSprints },
    { label: "Past 6 Months", sprints: past6MonthsSprints },
  ];

  return (
    <div>
      <Header />
      <div className="flex flex-row items-center gap-4 px-10 pt-10">
        <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
          <WelcomeMessage />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
          <SprintMultiSelect
            sprints={allSprints}
            defaultSprintId={defaultSprint?.value}
            sprintOptions={sprintOptions}
          />
        </Suspense>
      </div>
      <div className="p-10">{children}</div>
    </div>
  );
}
