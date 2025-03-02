import { auth } from "@clerk/nextjs/server";
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

// eslint-disable-next-line camelcase
export const experimental_ppr = true;

async function TopPerformersContainer({ sprintIds }: { sprintIds: string[] }) {
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
  const taskData = await findCountTasksByCategory(sprintIds);
  return <PieTaskCategoryChart taskData={taskData} />;
}

async function PieDonutTaskChartContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const data = await findTotalTaskToQACounts(sprintIds);
  return <PieDonutTaskChart data={data} />;
}

async function LeavePublicHolidayContainer({
  sprintIds,
}: {
  sprintIds: string[];
}) {
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
      isHideAddButton={roleId !== ROLE.ENGINEERING_MANAGER}
    />
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sprintIds?: string }>;
}) {
  await authenticateAndRedirect();
  const parameters = await searchParams;
  const sprintIds = parameters?.sprintIds
    ? parameters.sprintIds.split(",").filter(Boolean)
    : ["901606315079"];

  return (
    <main>
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
        <Suspense key={Math.random()} fallback={<LeavePublicHolidaySkeleton />}>
          <LeavePublicHolidayContainer sprintIds={sprintIds} />
        </Suspense>
      </div>
    </main>
  );
}
