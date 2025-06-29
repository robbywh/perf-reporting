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
import { ROLE } from "@/types/roles";

// Centralized critical data fetching (auth and role info only)
async function fetchCriticalData(): Promise<{ roleId: string }> {
  noStore();

  const authData = await auth();
  const { roleId } = await findRoleIdAndEngineerIdByUserId(
    authData.userId || ""
  );

  return {
    roleId: roleId || "",
  };
}

// Individual async components for progressive loading
async function AsyncTopPerformers({ sprintIds }: { sprintIds: string[] }) {
  const topPerformersData = await findTopPerformersBySprintIds(sprintIds);
  return (
    <DynamicTopPerformers
      performers={topPerformersData}
      sprintIds={sprintIds.join(",")}
    />
  );
}

async function AsyncBarChartCapacity({ sprintIds }: { sprintIds: string[] }) {
  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  return <DynamicBarChartCapacity sprints={sprintsCapacity} />;
}

async function AsyncLineChartSPCoding({ sprintIds }: { sprintIds: string[] }) {
  const sprintData = await findEngineerTrendBySprintIds(sprintIds);
  return <DynamicLineChartSPCoding sprintData={sprintData} />;
}

async function AsyncPieTaskCategoryChart({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const taskCategoryData = await findCountTasksByCategory(sprintIds);
  return <DynamicPieTaskCategoryChart taskData={taskCategoryData} />;
}

async function AsyncPieDonutTaskChart({ sprintIds }: { sprintIds: string[] }) {
  const [taskQAData, detailedTaskQAData] = await Promise.all([
    findTotalTaskToQACounts(sprintIds),
    findDetailedTaskToQACounts(sprintIds),
  ]);
  return (
    <DynamicPieDonutTaskChart
      data={taskQAData}
      detailedData={detailedTaskQAData}
    />
  );
}

async function AsyncLeavePublicHoliday({
  sprintIds,
  roleId,
  showActionButton,
}: {
  sprintIds: string[];
  roleId: string;
  showActionButton: boolean;
}) {
  const [leavesAndHolidays, engineers] = await Promise.all([
    findSprintsWithLeavesAndHolidays(sprintIds),
    findAllEngineers(),
  ]);
  return (
    <DynamicLeavePublicHoliday
      sprints={leavesAndHolidays}
      roleId={roleId}
      engineers={engineers}
      addLeaveOrHolidayAction={addLeaveOrHolidayAction}
      deleteLeaveOrHolidayAction={deleteLeaveOrHolidayAction}
      showActionButton={showActionButton}
    />
  );
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

  // Fetch only critical data (role info) for immediate rendering
  const { roleId } = await fetchCriticalData();

  return (
    <main>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-h-[400px] lg:col-span-2">
          <Suspense fallback={<BarChartCapacitySkeleton />}>
            <AsyncBarChartCapacity sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="min-h-[400px] lg:col-span-1">
          <Suspense fallback={<TopPerformersSkeleton />}>
            <AsyncTopPerformers sprintIds={sprintIds} />
          </Suspense>
        </div>
      </div>

      <div className="mb-6 min-h-[500px]">
        <Suspense fallback={<LineChartSPCodingSkeleton />}>
          <AsyncLineChartSPCoding sprintIds={sprintIds} />
        </Suspense>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-h-[400px] lg:col-span-2">
          <Suspense fallback={<PieChartSkeleton title="Task Category" />}>
            <AsyncPieTaskCategoryChart sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="min-h-[400px]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <AsyncPieDonutTaskChart sprintIds={sprintIds} />
          </Suspense>
        </div>
      </div>

      <div className="min-h-[300px]">
        <Suspense fallback={<LeavePublicHolidaySkeleton />}>
          <AsyncLeavePublicHoliday
            sprintIds={sprintIds}
            roleId={roleId}
            showActionButton={roleId === ROLE.ENGINEERING_MANAGER}
          />
        </Suspense>
      </div>
    </main>
  );
}
