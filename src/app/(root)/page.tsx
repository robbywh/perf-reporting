import { Suspense } from "react";

import {
  BarChartCapacity,
  BarChartCapacitySkeleton,
} from "@/components/charts/bar-chart-capacity";
import { LineChartSPCoding } from "@/components/charts/line-chart-sp-coding";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-task";
import { PieTaskCategoryChart } from "@/components/charts/pie-task-category";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import {
  TopPerformers,
  TopPerformersSkeleton,
} from "@/components/top-performers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  findCapacityVsRealityBySprintIds,
  findEngineerTrendBySprintIds,
  findTopPerformersBySprintIds,
} from "@/services/sprint-engineers";
import { findAllSprints } from "@/services/sprints";

// eslint-disable-next-line camelcase
export const experimental_ppr = true;

export async function TopPerformersContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const topPerformersData = await findTopPerformersBySprintIds(sprintIds);
  return <TopPerformers performers={topPerformersData} />;
}

export async function BarChartCapacityContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  return <BarChartCapacity sprints={sprintsCapacity} />;
}

export async function LineChartSPCodingContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const sprintData = await findEngineerTrendBySprintIds(sprintIds);
  return <LineChartSPCoding sprintData={sprintData} />;
}

export default async function Home() {
  const sprints = await findAllSprints();

  const sprintIds = sprints.map((sprint) => sprint.id);

  return (
    <div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[7]">
          <Suspense fallback={<BarChartCapacitySkeleton />}>
            <BarChartCapacityContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="flex-[3]">
          <Suspense fallback={<TopPerformersSkeleton />}>
            <TopPerformersContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
      </div>
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
          <LineChartSPCodingContainer sprintIds={sprintIds} />
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
