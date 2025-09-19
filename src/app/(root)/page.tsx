import { auth } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import {
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
} from "@/actions/leave-holiday";
import { BarChartCapacitySkeleton } from "@/components/charts/bar-chart-capacity";
import { LineChartSPCodingSkeleton } from "@/components/charts/line-chart-sp-coding";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
import { QAPerformancePieChartSkeleton } from "@/components/charts/pie-qa-performance";
import {
  LazyBarChartCapacity,
  LazyLineChartSPCoding,
  LazyPieTaskCategoryChart,
  LazyDashboardPieDonutChart,
  LazyQAPerformancePieChart,
} from "@/components/client-charts";
import { DynamicTopPerformers } from "@/components/client-wrappers";
import { LeavePublicHolidaySkeleton } from "@/components/leave-public-holiday-form";
import { TopPerformersSkeleton } from "@/components/top-performers";
import { authenticateAndRedirect } from "@/lib/utils/auth";
import { findAllEngineers } from "@/services/engineers";
import {
  findCapacityVsRealityBySprintIds,
  findEngineerTrendBySprintIds,
  findTopPerformersBySprintIds,
} from "@/services/sprint-engineers";
import { findQAPerformanceBySprintIds } from "@/services/sprint-reviewers";
import { findSprintsWithLeavesAndHolidays } from "@/services/sprints";
import { getCurrentSprintId } from "@/services/sprints/getCurrentSprintId";
import {
  findCountTasksByCategory,
  findDetailedTaskToQACounts,
  findTotalTaskToQACounts,
} from "@/services/tasks";
import { findRoleIdAndEngineerIdByUserId } from "@/services/users";
import { ROLE } from "@/types/roles";

// Dynamic imports for better code splitting and faster initial load
const DynamicLeavePublicHoliday = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicLeavePublicHoliday,
    })),
  { loading: () => <LeavePublicHolidaySkeleton /> }
);

// Optimize data fetching with preload and parallel execution for dashboard
async function fetchCriticalData(sprintIds: string[]): Promise<{
  roleId: string;
  topPerformersData?: Awaited<ReturnType<typeof findTopPerformersBySprintIds>>;
}> {
  noStore();

  // Parallel fetch critical data
  const [authData, topPerformersData] = await Promise.all([
    auth(),
    // Preload top performers data for faster FCP (most visible above-the-fold content)
    findTopPerformersBySprintIds(sprintIds).catch(() => undefined),
  ]);

  const { roleId } = await findRoleIdAndEngineerIdByUserId(
    authData.userId || ""
  );

  return {
    roleId: roleId || "",
    topPerformersData,
  };
}

// Individual async components for progressive loading
async function AsyncTopPerformers({
  sprintIds,
  preloadedData,
}: {
  sprintIds: string[];
  preloadedData?: Awaited<ReturnType<typeof findTopPerformersBySprintIds>>;
}) {
  // Use preloaded data if available, otherwise fetch
  const topPerformersData =
    preloadedData || (await findTopPerformersBySprintIds(sprintIds));
  return (
    <DynamicTopPerformers
      performers={topPerformersData}
      sprintIds={sprintIds.join(",")}
    />
  );
}

async function AsyncBarChartCapacity({ sprintIds }: { sprintIds: string[] }) {
  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  return <LazyBarChartCapacity sprints={sprintsCapacity} />;
}

async function AsyncLineChartSPCoding({ sprintIds }: { sprintIds: string[] }) {
  const sprintData = await findEngineerTrendBySprintIds(sprintIds);
  return <LazyLineChartSPCoding sprintData={sprintData} />;
}

async function AsyncPieTaskCategoryChart({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const taskCategoryData = await findCountTasksByCategory(sprintIds);
  return <LazyPieTaskCategoryChart taskData={taskCategoryData} />;
}

async function AsyncPieDonutTaskChart({ sprintIds }: { sprintIds: string[] }) {
  const [taskQAData, detailedTaskQAData] = await Promise.all([
    findTotalTaskToQACounts(sprintIds),
    findDetailedTaskToQACounts(sprintIds),
  ]);
  return (
    <LazyDashboardPieDonutChart
      data={taskQAData}
      detailedData={detailedTaskQAData}
    />
  );
}

async function AsyncQAPerformancePieChart({
  sprintIds,
}: {
  sprintIds: string[];
}) {
  const qaPerformanceData = await findQAPerformanceBySprintIds(sprintIds);
  return <LazyQAPerformancePieChart qaData={qaPerformanceData} />;
}

async function AsyncLeavePublicHoliday({
  sprintIds,
  roleId,
  showActionButton,
  organizationId,
}: {
  sprintIds: string[];
  roleId: string;
  showActionButton: boolean;
  organizationId?: string;
}) {
  const [leavesAndHolidays, engineers] = await Promise.all([
    findSprintsWithLeavesAndHolidays(sprintIds),
    findAllEngineers(organizationId),
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
  searchParams: Promise<{ sprintIds?: string; org?: string }>;
}) {
  noStore();
  await authenticateAndRedirect();
  const parameters = await searchParams;

  // Get organizationId from URL parameters
  const organizationId = parameters?.org;

  let sprintIds: string[];
  if (parameters?.sprintIds) {
    sprintIds = parameters.sprintIds.split(",").filter(Boolean);
  } else {
    const currentSprintId = await getCurrentSprintId(organizationId);
    sprintIds = currentSprintId ? [currentSprintId] : [];
  }

  // Fetch critical data with preloading for better performance
  const { roleId, topPerformersData } = await fetchCriticalData(sprintIds);

  return (
    <main className="space-y-6">
      {/* First Section: Capacity vs Reality + Top Performers */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<BarChartCapacitySkeleton />}>
            <AsyncBarChartCapacity sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<TopPerformersSkeleton />}>
            <AsyncTopPerformers
              sprintIds={sprintIds}
              preloadedData={topPerformersData}
            />
          </Suspense>
        </div>
      </section>

      {/* Second Section: Task Category + Tasks to QA + QA Performances */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Suspense fallback={<PieChartSkeleton title="Task Category" />}>
            <AsyncPieTaskCategoryChart sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="flex justify-center lg:col-span-1">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <AsyncPieDonutTaskChart sprintIds={sprintIds} />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<QAPerformancePieChartSkeleton />}>
            <AsyncQAPerformancePieChart sprintIds={sprintIds} />
          </Suspense>
        </div>
      </section>

      {/* Third Section: Engineer Trends - Full Width */}
      <section className="w-full">
        <Suspense fallback={<LineChartSPCodingSkeleton />}>
          <AsyncLineChartSPCoding sprintIds={sprintIds} />
        </Suspense>
      </section>

      {/* Fourth Section: Leave & Holiday Management */}
      <section className="w-full">
        <Suspense fallback={<LeavePublicHolidaySkeleton />}>
          <AsyncLeavePublicHoliday
            sprintIds={sprintIds}
            roleId={roleId}
            showActionButton={roleId === ROLE.ENGINEERING_MANAGER}
            organizationId={organizationId}
          />
        </Suspense>
      </section>
    </main>
  );
}
