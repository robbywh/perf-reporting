import { auth } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { updateCodingHoursAction } from "@/actions/coding-hours";
import {
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
} from "@/actions/leave-holiday";
import { BackButton } from "@/components/back-button";
import { LazyBarChart, LazyPieDonutChart } from "@/components/client-charts";
import { DynamicStatsCards } from "@/components/client-wrappers";
import {
  BarChartMultipleSkeleton,
  PieDonutChartSkeleton,
  StatsCardsSkeleton,
  CodingHoursFormSkeleton,
  LeavePublicHolidaySkeleton,
} from "@/components/skeletons";
import { findAllEngineers } from "@/services/engineers";
import { findAveragesByEngineerAndSprintIds } from "@/services/sprint-engineers";
import {
  findSprintsBySprintIds,
  findSprintsWithLeavesAndHolidays,
} from "@/services/sprints";
import { getCurrentSprintId } from "@/services/sprints/getCurrentSprintId";
import {
  findAverageSPAndMergedCountBySprintIds,
  findTotalTaskToQACounts,
  findDetailedTaskToQACounts,
} from "@/services/tasks";
import {
  findEngineerById,
  findRoleIdAndEngineerIdByUserId,
} from "@/services/users";
import { PageProps } from "@/types/engineer-page";

// Dynamic imports for better code splitting and faster initial load
const DynamicCodingHoursForm = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicCodingHoursForm,
    })),
  { loading: () => <CodingHoursFormSkeleton /> }
);

const DynamicLeavePublicHoliday = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicLeavePublicHoliday,
    })),
  { loading: () => <LeavePublicHolidaySkeleton /> }
);

// Optimize data fetching with preload and parallel execution
async function fetchCriticalData(
  sprintIds: string[],
  engineerId: number,
  organizationId: string
): Promise<{
  engineer: Awaited<ReturnType<typeof findEngineerById>>;
  roleId: string;
  statsData?: Awaited<
    ReturnType<typeof findAverageSPAndMergedCountBySprintIds>
  >;
}> {
  noStore();

  // Parallel fetch critical data
  const [{ userId }, engineer, statsData] = await Promise.all([
    auth(),
    findEngineerById(engineerId),
    // Preload stats data for faster FCP
    findAverageSPAndMergedCountBySprintIds(sprintIds, engineerId).catch(
      () => undefined
    ),
  ]);

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { roleId } = await findRoleIdAndEngineerIdByUserId(userId);

  if (!roleId) {
    throw new Error("User role not found");
  }

  return {
    engineer,
    roleId,
    statsData,
  };
}

export default async function EngineerPage({
  params,
  searchParams,
}: PageProps) {
  const searchParameters = await searchParams;
  const parameters = await params;
  
  // Extract organization from URL parameters
  const organizationId = searchParameters?.org;
  if (!organizationId) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            Organization Required
          </div>
          <div className="text-sm text-gray-500">
            Please select an organization to view engineer details.
          </div>
        </div>
      </div>
    );
  }

  let sprintIds: string[];
  if (searchParameters?.sprintIds) {
    sprintIds = searchParameters.sprintIds.split(",").filter(Boolean);
  } else {
    const currentSprintId = await getCurrentSprintId(organizationId);
    sprintIds = currentSprintId ? [currentSprintId] : [];
  }

  const engineerId = parseInt(parameters.engineerId || "0");

  // Fetch critical data first (user info and engineer details)
  const { engineer, roleId, statsData } = await fetchCriticalData(
    sprintIds,
    engineerId,
    organizationId
  );

  const isEngineeringManager = roleId === "em";
  const isSoftwareEngineer = roleId === "se";

  // Render header immediately for better FCP
  return (
    <div>
      {!isSoftwareEngineer && (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">
              {engineer?.firstName}&apos;s Performance Report
            </h1>
          </div>
        </div>
      )}

      {/* Critical above-the-fold content - Stats Cards with priority */}
      <div className="mb-6 min-h-[120px]">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <AsyncStatsCards
            sprintIds={sprintIds}
            engineerId={engineerId}
            organizationId={organizationId}
            preloadedData={statsData}
          />
        </Suspense>
      </div>

      {/* Charts Section - Lazy load with intersection observer */}
      <div className="flex min-h-[400px] flex-row items-stretch gap-4">
        <div className="min-h-[400px] flex-[6]">
          <Suspense fallback={<BarChartMultipleSkeleton />}>
            <AsyncBarChart sprintIds={sprintIds} engineerId={engineerId} organizationId={organizationId} />
          </Suspense>
        </div>
        <div className="min-h-[400px] flex-[4]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <AsyncPieDonutChart sprintIds={sprintIds} engineerId={engineerId} organizationId={organizationId} />
          </Suspense>
        </div>
      </div>

      {/* Below-the-fold content - Lower priority */}
      <div className="mb-6 flex min-h-[200px]">
        <Suspense fallback={<CodingHoursFormSkeleton />}>
          <AsyncCodingHoursForm
            sprintIds={sprintIds}
            engineerId={engineerId}
            organizationId={organizationId}
            roleId={roleId}
          />
        </Suspense>
      </div>

      {isSoftwareEngineer && (
        <div className="min-h-[300px]">
          <Suspense fallback={<LeavePublicHolidaySkeleton />}>
            <AsyncLeavePublicHoliday
              sprintIds={sprintIds}
              organizationId={organizationId}
              roleId={roleId}
              isEngineeringManager={isEngineeringManager}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

// Async components for independent loading
async function AsyncStatsCards({
  sprintIds,
  engineerId,
  organizationId,
  preloadedData,
}: {
  sprintIds: string[];
  engineerId: number;
  organizationId: string;
  preloadedData?: Awaited<
    ReturnType<typeof findAverageSPAndMergedCountBySprintIds>
  >;
}) {
  // Use preloaded data if available, otherwise fetch
  const statsData =
    preloadedData ||
    (await findAverageSPAndMergedCountBySprintIds(sprintIds, engineerId));

  // Map taskDetails to the expected TaskDetailsGroup structure
  const mappedStatsData = {
    ...statsData,
    taskDetails: {
      ongoingDev: statsData.taskDetails?.ongoingDev ?? [],
      ongoingSupport: statsData.taskDetails?.ongoingSupport ?? [],
      nonDevelopment: statsData.taskDetails?.nonDevelopment ?? [],
      supportApproved: statsData.taskDetails?.supportApproved ?? [],
      devApproved: statsData.taskDetails?.devApproved ?? [],
    },
  };

  return (
    <DynamicStatsCards data={mappedStatsData} sprintCount={sprintIds.length} />
  );
}

async function AsyncBarChart({
  sprintIds,
  engineerId,
  organizationId,
}: {
  sprintIds: string[];
  engineerId: number;
  organizationId: string;
}) {
  const averagesData = await findAveragesByEngineerAndSprintIds(
    sprintIds,
    engineerId
  );
  return <LazyBarChart data={averagesData} />;
}

async function AsyncPieDonutChart({
  sprintIds,
  engineerId,
  organizationId,
}: {
  sprintIds: string[];
  engineerId: number;
  organizationId: string;
}) {
  const [taskData, detailedTaskData] = await Promise.all([
    findTotalTaskToQACounts(sprintIds, engineerId),
    findDetailedTaskToQACounts(sprintIds, engineerId),
  ]);
  return <LazyPieDonutChart data={taskData} detailedData={detailedTaskData} />;
}

async function AsyncCodingHoursForm({
  sprintIds,
  engineerId,
  organizationId,
  roleId,
}: {
  sprintIds: string[];
  engineerId: number;
  organizationId: string;
  roleId: string;
}) {
  const sprintsForCodingHours = await findSprintsBySprintIds(
    sprintIds,
    engineerId
  );
  return (
    <DynamicCodingHoursForm
      sprints={sprintsForCodingHours}
      engineerId={engineerId}
      roleId={roleId}
      onSave={updateCodingHoursAction}
    />
  );
}

async function AsyncLeavePublicHoliday({
  sprintIds,
  organizationId,
  roleId,
  isEngineeringManager,
}: {
  sprintIds: string[];
  organizationId: string;
  roleId: string;
  isEngineeringManager: boolean;
}) {
  const [sprintsWithLeaves, engineers] = await Promise.all([
    findSprintsWithLeavesAndHolidays(sprintIds),
    findAllEngineers(organizationId),
  ]);
  return (
    <DynamicLeavePublicHoliday
      sprints={sprintsWithLeaves}
      roleId={roleId}
      engineers={engineers}
      addLeaveOrHolidayAction={addLeaveOrHolidayAction}
      deleteLeaveOrHolidayAction={deleteLeaveOrHolidayAction}
      showActionButton={isEngineeringManager}
    />
  );
}
