import { auth } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import {
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
} from "@/actions/leave-holiday";
import { BarChartCapacitySkeleton } from "@/components/charts/bar-chart-capacity";
import { LineChartSPCodingSkeleton } from "@/components/charts/line-chart-sp-coding";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
import {
  DynamicBarChartCapacity,
  DynamicLineChartSPCoding,
  DynamicPieTaskCategoryChart,
  DynamicPieDonutTaskChart,
  DynamicTopPerformers,
  DynamicLeavePublicHoliday,
} from "@/components/client-wrappers";
import { LeavePublicHolidaySkeleton } from "@/components/leave-public-holiday-form";
import { TopPerformersSkeleton } from "@/components/top-performers";
import { authenticateAndRedirect } from "@/lib/utils/auth";
import { findAllEngineers } from "@/services/engineers";
import {
  findCapacityVsRealityBySprintIds,
  findEngineerTrendBySprintIds,
  findTopPerformersBySprintIds,
} from "@/services/sprint-engineers";
import { findSprintsWithLeavesAndHolidays } from "@/services/sprints";
import { getCurrentSprintId } from "@/services/sprints/getCurrentSprintId";
import {
  findCountTasksByCategory,
  findDetailedTaskToQACounts,
  findTotalTaskToQACounts,
} from "@/services/tasks";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";
import { DashboardData } from "@/types/dashboard";
import { ROLE } from "@/types/roles";

// Centralized data fetching function
async function fetchDashboardData(sprintIds: string[]): Promise<DashboardData> {
  noStore();

  // Fetch all data in parallel
  const [
    topPerformersData,
    sprintsCapacity,
    sprintData,
    taskCategoryData,
    taskQAData,
    detailedTaskQAData,
    leavesAndHolidays,
    engineers,
    authData,
  ] = await Promise.all([
    findTopPerformersBySprintIds(sprintIds),
    findCapacityVsRealityBySprintIds(sprintIds),
    findEngineerTrendBySprintIds(sprintIds),
    findCountTasksByCategory(sprintIds),
    findTotalTaskToQACounts(sprintIds),
    findDetailedTaskToQACounts(sprintIds),
    findSprintsWithLeavesAndHolidays(sprintIds),
    findAllEngineers(),
    auth(),
  ]);

  // Get role info after auth
  const { roleId } = await findRoleIdAndEngineerIdByUserId(
    authData.userId || ""
  );

  return {
    topPerformersData,
    sprintsCapacity,
    sprintData,
    taskCategoryData,
    taskQAData,
    detailedTaskQAData,
    leavesAndHolidays,
    engineers,
    roleId: roleId || "",
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sprintIds?: string }>;
}) {
  noStore();
  await authenticateAndRedirect();
  const parameters = await searchParams;

  let sprintIds: string[];
  if (parameters?.sprintIds) {
    sprintIds = parameters.sprintIds.split(",").filter(Boolean);
  } else {
    const currentSprintId = await getCurrentSprintId();
    sprintIds = currentSprintId ? [currentSprintId] : [];
  }

  // Fetch all data at once
  const {
    topPerformersData,
    sprintsCapacity,
    sprintData,
    taskCategoryData,
    taskQAData,
    detailedTaskQAData,
    leavesAndHolidays,
    engineers,
    roleId,
  } = await fetchDashboardData(sprintIds);

  return (
    <main>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-h-[400px] lg:col-span-2">
          <Suspense fallback={<BarChartCapacitySkeleton />}>
            <DynamicBarChartCapacity sprints={sprintsCapacity} />
          </Suspense>
        </div>
        <div className="min-h-[400px] lg:col-span-1">
          <Suspense fallback={<TopPerformersSkeleton />}>
            <DynamicTopPerformers
              performers={topPerformersData}
              sprintIds={sprintIds.join(",")}
            />
          </Suspense>
        </div>
      </div>

      <div className="mb-6 min-h-[500px]">
        <Suspense fallback={<LineChartSPCodingSkeleton />}>
          <DynamicLineChartSPCoding sprintData={sprintData} />
        </Suspense>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-h-[400px] lg:col-span-2">
          <Suspense fallback={<PieChartSkeleton title="Task Category" />}>
            <DynamicPieTaskCategoryChart taskData={taskCategoryData} />
          </Suspense>
        </div>
        <div className="min-h-[400px]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <DynamicPieDonutTaskChart
              data={taskQAData}
              detailedData={detailedTaskQAData}
            />
          </Suspense>
        </div>
      </div>

      <div className="min-h-[300px]">
        <Suspense fallback={<LeavePublicHolidaySkeleton />}>
          <DynamicLeavePublicHoliday
            sprints={leavesAndHolidays}
            roleId={roleId}
            engineers={engineers}
            addLeaveOrHolidayAction={addLeaveOrHolidayAction}
            deleteLeaveOrHolidayAction={deleteLeaveOrHolidayAction}
            showActionButton={roleId === ROLE.ENGINEERING_MANAGER}
          />
        </Suspense>
      </div>
    </main>
  );
}
