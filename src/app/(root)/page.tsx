import { Suspense } from "react";

import {
  BarChartCapacity,
  BarChartCapacitySkeleton,
} from "@/components/charts/bar-chart-capacity";
import {
  LineChartSPCoding,
  LineChartSPCodingSkeleton,
} from "@/components/charts/line-chart-sp-coding";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
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
import {
  countTasksByCategory,
  findAverageTaskToQACounts,
} from "@/services/tasks";

// eslint-disable-next-line camelcase
export const experimental_ppr = true;

async function TopPerformersContainer({ sprintIds }: { sprintIds: string[] }) {
  const topPerformersData = await findTopPerformersBySprintIds(sprintIds);
  return <TopPerformers performers={topPerformersData} />;
}

async function BarChartCapacityContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  return <BarChartCapacity sprints={sprintsCapacity} />;
}

async function LineChartSPCodingContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const sprintData = await findEngineerTrendBySprintIds(sprintIds);
  return <LineChartSPCoding sprintData={sprintData} />;
}

async function PieTaskCategoryChartContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const taskData = await countTasksByCategory(sprintIds);
  return <PieTaskCategoryChart taskData={taskData} />;
}

async function PieDonutTaskChartContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const data = await findAverageTaskToQACounts(sprintIds);
  return <PieDonutTaskChart data={data} />;
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
        <Suspense fallback={<LineChartSPCodingSkeleton />}>
          <LineChartSPCodingContainer sprintIds={sprintIds} />
        </Suspense>
      </div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[2]">
          <Suspense fallback={<PieChartSkeleton title="Task Category" />}>
            <PieTaskCategoryChartContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="flex-[1]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <PieDonutTaskChartContainer sprintIds={sprintIds} />
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

  // return (
  //     <div>
  //       <div className="mb-6 flex flex-row justify-center gap-4">
  //         <div className="flex-[7]">
  //           <BarChartCapacitySkeleton />
  //         </div>
  //         <div className="flex-[3]">
  //           <TopPerformersSkeleton />
  //         </div>
  //       </div>
  //       <div className="mb-6">
  //         <LineChartSPCodingSkeleton />
  //       </div>
  //       <div className="mb-6 flex flex-row justify-center gap-4">
  //         <div className="flex-[2]">
  //           <PieChartSkeleton title="Task Category" />
  //         </div>
  //         <div className="flex-[1]">
  //           <PieDonutChartSkeleton title="Tasks to QA" />
  //         </div>
  //       </div>
  //       <div>
  //         <Suspense fallback={<Skeleton className="h-20 w-full rounded-md" />}>
  //           <LeavePublicHoliday />
  //         </Suspense>
  //       </div>
  //     </div>
  //   );
}
