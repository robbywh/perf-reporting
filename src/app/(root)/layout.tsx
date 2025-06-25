import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { Toaster } from "sonner";

import { SprintActions } from "@/components/sprint-actions";
import { SprintDateRange } from "@/components/sprint-date-range";
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

  // Find current sprint
  const currentSprint = allSprints.find(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      currentDate <= new Date(sprint.endDate)
  );

  // Today's sprint
  const todaySprint = currentSprint ? [currentSprint] : [];

  // Past sprints should exclude current sprint
  const past1MonthSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= oneMonthAgo &&
      (currentSprint ? sprint.value !== currentSprint.value : true)
  );

  const past3MonthsSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= threeMonthsAgo &&
      (currentSprint ? sprint.value !== currentSprint.value : true)
  );

  const past6MonthsSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= sixMonthsAgo &&
      (currentSprint ? sprint.value !== currentSprint.value : true)
  );

  const defaultSprint = currentSprint || allSprints[allSprints.length - 1];

  const sprintOptions = [
    { label: "Today", sprints: todaySprint },
    { label: "Past 1 Month", sprints: past1MonthSprints },
    { label: "Past 3 Months", sprints: past3MonthsSprints },
    { label: "Past 6 Months", sprints: past6MonthsSprints },
  ];

  return (
    <div>
      <Toaster position="top-right" closeButton richColors />
      <Header />
      <div className="flex flex-col gap-2 px-10 pt-10">
        <div className="flex items-center justify-between">
          <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
            <WelcomeMessage />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-6 w-40 rounded-md" />}>
            <SprintDateRange allSprints={allSprints} />
          </Suspense>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
            <div className="flex-1">
              <SprintMultiSelect
                sprints={allSprints}
                defaultSprintId={defaultSprint?.value}
                sprintOptions={sprintOptions}
              />
            </div>
          </Suspense>
          <Suspense fallback={<Skeleton className="h-10 w-28 rounded-md" />}>
            <SprintActions />
          </Suspense>
        </div>
      </div>
      <div className="p-10">
        {children}
        <div className="mt-4">
          {defaultSprint && (
            <div className="text-sm text-muted-foreground">
              Showing data for sprint:{" "}
              <span className="font-medium">{defaultSprint.label}</span> (
              {new Intl.DateTimeFormat("default", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(defaultSprint.startDate))}{" "}
              -{" "}
              {new Intl.DateTimeFormat("default", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(defaultSprint.endDate))}
              )
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
