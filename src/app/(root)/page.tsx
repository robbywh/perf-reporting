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
  { loading: () => <LeavePublicHolidaySkeleton /> },
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
    authData.userId || "",
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

async function AsyncBarChartCapacity({
  sprintIds,
  organizationId
}: {
  sprintIds: string[];
  organizationId?: string;
}) {
  // Clear function to prevent stale data
  if (!organizationId || sprintIds.length === 0) {
    return <LazyBarChartCapacity sprints={[]} />;
  }

  const sprintsCapacity = await findCapacityVsRealityBySprintIds(sprintIds);
  return <LazyBarChartCapacity sprints={sprintsCapacity} />;
}

async function AsyncLineChartSPCoding({
  sprintIds,
  organizationId
}: {
  sprintIds: string[];
  organizationId?: string;
}) {
  if (!organizationId || sprintIds.length === 0) {
    return <LazyLineChartSPCoding sprintData={[]} />;
  }

  const sprintData = await findEngineerTrendBySprintIds(sprintIds);
  return <LazyLineChartSPCoding sprintData={sprintData} />;
}

async function AsyncPieTaskCategoryChart({
  sprintIds,
  organizationId,
}: {
  sprintIds: string[];
  organizationId?: string;
}) {
  if (!organizationId || sprintIds.length === 0) {
    return (
      <LazyPieTaskCategoryChart
        taskData={[]}
        sprintIds={sprintIds}
      />
    );
  }

  const taskCategoryData = await findCountTasksByCategory(sprintIds);
  return (
    <LazyPieTaskCategoryChart
      taskData={taskCategoryData}
      sprintIds={sprintIds}
    />
  );
}

async function AsyncPieDonutTaskChart({
  sprintIds,
  organizationId
}: {
  sprintIds: string[];
  organizationId?: string;
}) {
  if (!organizationId || sprintIds.length === 0) {
    return (
      <LazyDashboardPieDonutChart
        data={{ approvedTasks: 0, rejectedTasks: 0 }}
        detailedData={{ approvedTasks: [], rejectedTasks: [] }}
      />
    );
  }

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
  organizationId,
}: {
  sprintIds: string[];
  organizationId?: string;
}) {
  if (!organizationId || sprintIds.length === 0) {
    return <LazyQAPerformancePieChart qaData={[]} />;
  }

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
    <main className="space-y-6" key={organizationId || 'no-org'}>
      {/* First Section: Capacity vs Reality + Top Performers */}
      <section className="grid gap-6 lg:grid-cols-3" key={`section-1-${organizationId || 'no-org'}`}>
        <div className="lg:col-span-2">
          <Suspense fallback={<BarChartCapacitySkeleton />}>
            <AsyncBarChartCapacity
              sprintIds={sprintIds}
              organizationId={organizationId}
              key={`bar-chart-${organizationId || 'no-org'}`}
            />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<TopPerformersSkeleton />}>
            <AsyncTopPerformers
              sprintIds={sprintIds}
              preloadedData={topPerformersData}
              key={`top-performers-${organizationId || 'no-org'}`}
            />
          </Suspense>
        </div>
      </section>

      {/* Second Section: Task Category + Tasks to QA + QA Performances */}
      <section className="grid gap-6 lg:grid-cols-5" key={`section-2-${organizationId || 'no-org'}`}>
        <div className="lg:col-span-2">
          <Suspense fallback={<PieChartSkeleton title="Task Category Percentage By SP" />}>
            <AsyncPieTaskCategoryChart
              sprintIds={sprintIds}
              organizationId={organizationId}
              key={`pie-category-${organizationId || 'no-org'}`}
            />
          </Suspense>
        </div>
        <div className="flex justify-center lg:col-span-1">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <AsyncPieDonutTaskChart
              sprintIds={sprintIds}
              organizationId={organizationId}
              key={`pie-donut-${organizationId || 'no-org'}`}
            />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<QAPerformancePieChartSkeleton />}>
            <AsyncQAPerformancePieChart
              sprintIds={sprintIds}
              organizationId={organizationId}
              key={`qa-performance-${organizationId || 'no-org'}`}
            />
          </Suspense>
        </div>
      </section>

      {/* Third Section: Engineer Trends - Full Width */}
      <section className="w-full" key={`section-3-${organizationId || 'no-org'}`}>
        <Suspense fallback={<LineChartSPCodingSkeleton />}>
          <AsyncLineChartSPCoding
            sprintIds={sprintIds}
            organizationId={organizationId}
            key={`line-chart-${organizationId || 'no-org'}`}
          />
        </Suspense>
      </section>

      {/* Fourth Section: Leave & Holiday Management */}
      <section className="w-full" key={`section-4-${organizationId || 'no-org'}`}>
        <Suspense fallback={<LeavePublicHolidaySkeleton />}>
          <AsyncLeavePublicHoliday
            sprintIds={sprintIds}
            roleId={roleId}
            showActionButton={roleId === ROLE.ENGINEERING_MANAGER}
            organizationId={organizationId}
            key={`leave-holiday-${organizationId || 'no-org'}`}
          />
        </Suspense>
      </section>
    </main>
  );
}
