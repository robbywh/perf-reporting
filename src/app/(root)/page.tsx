import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { BarChartCapacity } from "@/components/charts/bar-chart-multiple/bar-chart-capacity";
import { LineChartSPCoding } from "@/components/charts/line-chart/line-chart-sp-coding";
import { PieTaskCategoryChart } from "@/components/charts/pie-chart/pie-task-category";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-chart/pie-donut-task";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import { SprintMultiSelect } from "@/components/sprint-multi-select";
import { TopPerformers } from "@/components/top-performers";
import { Skeleton } from "@/components/ui/skeleton";
import { getWelcomeMessage } from "@/lib/utils/global";
import { findCapacityVsRealityBySprintIds } from "@/services/sprint-engineers";
import { findAllSprints } from "@/services/sprints";
import { findRoleIdByUserId } from "@/services/users";

// eslint-disable-next-line camelcase
export const experimental_ppr = true;

const WelcomeMessage = async () => {
  const user = await currentUser(); // Fetch the logged-in user
  const firstName = user?.firstName || "Guest";
  const role = await findRoleIdByUserId(user?.id || "");
  const welcomeMessage = getWelcomeMessage(role || "", firstName);

  return <div className="flex-1 text-lg font-bold">{welcomeMessage}</div>;
};

export default async function Home() {
  const sprints = await findAllSprints();

  const formattedSprints = sprints.map((sprint) => ({
    value: sprint.id,
    label: sprint.name,
  }));

  const sprintIds = sprints.map((sprint) => sprint.id);
  console.log(sprintIds);
  const data = await findCapacityVsRealityBySprintIds(sprintIds);

  console.log(data);
  return (
    <div>
      <div className="mb-6 flex flex-row items-center gap-4">
        <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
          <WelcomeMessage />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-6 w-60 rounded-md" />}>
          <SprintMultiSelect sprints={formattedSprints} />
        </Suspense>
      </div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[7]">
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
            <BarChartCapacity />
          </Suspense>
        </div>
        <div className="flex-[3]">
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
            <TopPerformers />
          </Suspense>
        </div>
      </div>
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
          <LineChartSPCoding />
        </Suspense>
      </div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[2]">
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-md" />}>
            <PieTaskCategoryChart />
          </Suspense>
        </div>
        <div className="flex-[1]">
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-md" />}>
            <PieDonutTaskChart />
          </Suspense>
        </div>
      </div>
      <div>
        <Suspense fallback={<Skeleton className="h-20 w-full rounded-md" />}>
          <LeavePublicHoliday />
        </Suspense>
      </div>
    </div>
  );
}
