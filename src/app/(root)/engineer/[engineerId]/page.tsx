import { Suspense } from "react";

import {
  BarChartMultiple,
  BarChartMultipleSkeleton,
} from "@/components/charts/bar-chart-multiple";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-task";
import { CodingHoursForm } from "@/components/coding-hours-form";
import { LeavePublicHoliday } from "@/components/leave-public-holiday-form";
import { StatsCards, StatsCardsSkeleton } from "@/components/stats-cards";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ Import ShadCN Skeleton
import { findAveragesByEngineerAndSprintIds } from "@/services/sprint-engineers";
import {
  findAverageSPAndMergedCountBySprintIds,
  findTotalTaskToQACounts,
} from "@/services/tasks";

async function StatsCardsContainer({ sprintIds }: { sprintIds: string[] }) {
  const data = await findAverageSPAndMergedCountBySprintIds(sprintIds, 5753351);
  return <StatsCards data={data} />;
}

async function PieDonutTaskChartContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const data = await findTotalTaskToQACounts(sprintIds, 5753351);
  return <PieDonutTaskChart data={data} />;
}

async function BarChartMultipleContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const data = await findAveragesByEngineerAndSprintIds(sprintIds, 5753351);
  return <BarChartMultiple data={data} />;
}

export default async function EngineerPage({
  searchParams,
}: {
  searchParams: Promise<{ sprintIds?: string }>;
}) {
  const parameters = await searchParams;
  const sprintIds = parameters?.sprintIds
    ? parameters.sprintIds.split(",").filter(Boolean)
    : ["901606315079"];

  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCardsContainer sprintIds={sprintIds} />
        </Suspense>
      </div>

      {/* Charts Section */}
      <div className="flex flex-row items-stretch gap-4">
        <div className="flex-[6]">
          <Suspense fallback={<BarChartMultipleSkeleton />}>
            <BarChartMultipleContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="flex-[4]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <PieDonutTaskChartContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
      </div>

      {/* Coding Hours Form */}
      <div className="mb-6 flex">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
          <CodingHoursForm />
        </Suspense>
      </div>

      {/* Leave & Public Holiday Form */}
      <div>
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
          <LeavePublicHoliday sprints={[]} engineers={[]} />
        </Suspense>
      </div>
    </div>
  );
}
