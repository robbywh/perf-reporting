import { Suspense } from "react";

import { BarChartCapacity } from "@/components/charts/bar-chart-capacity";
import { LineChartSPCoding } from "@/components/charts/line-chart-sp-coding";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-task";
import { PieTaskCategoryChart } from "@/components/charts/pie-task-category";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import { TopPerformers } from "@/components/top-performers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  findCapacityVsRealityBySprintIds,
  findTopPerformersBySprintIds,
} from "@/services/sprint-engineers";
import { findAllSprints } from "@/services/sprints";

// eslint-disable-next-line camelcase
export const experimental_ppr = true;

export default async function Home() {
  const sprints = await findAllSprints();

  const sprintIds = sprints.map((sprint) => sprint.id);
  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  const topPerformersData = await findTopPerformersBySprintIds(sprintIds);
  return (
    <div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[7]">
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
            <BarChartCapacity sprints={sprintsCapacity} />
          </Suspense>
        </div>
        <div className="flex-[3]">
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
            <TopPerformers performers={topPerformersData} />
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
