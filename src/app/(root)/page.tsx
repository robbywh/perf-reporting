import { auth } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import {
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
} from "@/actions/leave-holiday";
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
import {
  LeavePublicHoliday,
  LeavePublicHolidaySkeleton,
} from "@/components/leave-public-holiday-form";
import {
  TopPerformers,
  TopPerformersSkeleton,
} from "@/components/top-performers";
import { authenticateAndRedirect } from "@/lib/utils/auth";
import { findAllEngineers } from "@/services/engineers";
import {
  findCapacityVsRealityBySprintIds,
  findEngineerTrendBySprintIds,
  findTopPerformersBySprintIds,
} from "@/services/sprint-engineers";
import { findSprintsWithLeavesAndHolidays } from "@/services/sprints";
import {
  findCountTasksByCategory,
  findTotalTaskToQACounts,
} from "@/services/tasks";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";
import { ROLE } from "@/types/roles";

async function TopPerformersContainer({ sprintIds }: { sprintIds: string[] }) {
  noStore(); // Opt out of static rendering for dynamic data
  const topPerformersData = await findTopPerformersBySprintIds(sprintIds);
  return (
    <TopPerformers
      performers={topPerformersData}
      sprintIds={sprintIds.join(",")}
    />
  );
}

async function BarChartCapacityContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  return <BarChartCapacity sprints={sprintsCapacity} />;
}

async function LineChartSPCodingContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const sprintData = await findEngineerTrendBySprintIds(sprintIds);
  return <LineChartSPCoding sprintData={sprintData} />;
}

async function PieTaskCategoryChartContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const taskData = await findCountTasksByCategory(sprintIds);
  return <PieTaskCategoryChart taskData={taskData} />;
}

async function PieDonutTaskChartContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const data = await findTotalTaskToQACounts(sprintIds);
  return <PieDonutTaskChart data={data} />;
}

async function LeavePublicHolidayContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const data = await findSprintsWithLeavesAndHolidays(sprintIds);
  const engineers = await findAllEngineers();
  const { userId } = await auth();
  const { roleId } = await findRoleIdAndEngineerIdByUserId(userId || "");
  return (
    <LeavePublicHoliday
      sprints={data}
      roleId={roleId || ""}
      engineers={engineers}
      addLeaveOrHolidayAction={addLeaveOrHolidayAction}
      deleteLeaveOrHolidayAction={deleteLeaveOrHolidayAction}
      showActionButton={roleId === ROLE.ENGINEERING_MANAGER}
    />
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sprintIds?: string }>;
}) {
  noStore(); // Opt out of static rendering for dynamic data
  await authenticateAndRedirect();
  const parameters = await searchParams;
  const sprintIds = parameters?.sprintIds
    ? parameters.sprintIds.split(",").filter(Boolean)
    : ["901606315079"];

  return (
    <main>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="min-h-[400px] flex-[7]">
          <Suspense
            fallback={<BarChartCapacitySkeleton />}
            key="bar-chart-capacity"
          >
            <BarChartCapacityContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="min-h-[400px] flex-[3]">
          <Suspense fallback={<TopPerformersSkeleton />} key="top-performers">
            <TopPerformersContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
      </div>

      {/* Defer non-critical content with priority loading */}
      <div className="mb-6 min-h-[500px]">
        <Suspense
          fallback={<LineChartSPCodingSkeleton />}
          key="line-chart-sp-coding"
        >
          <LineChartSPCodingContainer sprintIds={sprintIds} />
        </Suspense>
      </div>

      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="min-h-[400px] flex-[2]">
          <Suspense
            fallback={<PieChartSkeleton title="Task Category" />}
            key="pie-task-category"
          >
            <PieTaskCategoryChartContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="min-h-[400px] flex-[1]">
          <Suspense
            fallback={<PieDonutChartSkeleton title="Tasks to QA" />}
            key="pie-donut-task"
          >
            <PieDonutTaskChartContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
      </div>

      <div className="min-h-[300px]">
        <Suspense
          fallback={<LeavePublicHolidaySkeleton />}
          key="leave-public-holiday"
        >
          <LeavePublicHolidayContainer sprintIds={sprintIds} />
        </Suspense>
      </div>
    </main>
  );
}
