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
  engineerId: number
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

  const userRole = await findRoleIdAndEngineerIdByUserId(userId);

  if (!userRole?.roleId) {
    throw new Error("User role not found");
  }

  if (!engineer) {
    throw new Error("Engineer not found");
  }

  return {
    engineer,
    roleId: userRole.roleId,
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
    // Show skeleton loading while organization is being determined
    return (
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="size-8 rounded bg-gray-200"></div>
            <div className="h-8 w-64 rounded bg-gray-200"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="mb-6 min-h-[120px]">
          <StatsCardsSkeleton />
        </div>

        {/* Charts Section Skeleton */}
        <div className="mb-6 flex min-h-[400px] flex-row items-stretch gap-4">
          <div className="min-h-[400px] flex-[6]">
            <BarChartMultipleSkeleton />
          </div>
          <div className="min-h-[400px] flex-[4]">
            <PieDonutChartSkeleton title="Tasks to QA" />
          </div>
        </div>

        {/* Coding Hours Form Skeleton */}
        <div className="mb-6 min-h-[200px]">
          <CodingHoursFormSkeleton />
        </div>

        {/* Leave Public Holiday Form Skeleton */}
        <div className="min-h-[300px]">
          <LeavePublicHolidaySkeleton />
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

  // Validate engineerId
  if (!engineerId || isNaN(engineerId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Engineer ID</h1>
          <p className="mt-2 text-gray-600">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  // Fetch critical data first (user info and engineer details)
  let engineer, roleId, statsData;
  try {
    const result = await fetchCriticalData(sprintIds, engineerId);
    engineer = result.engineer;
    roleId = result.roleId;
    statsData = result.statsData;
  } catch (error) {
    console.error("Error loading engineer page:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error Loading Engineer Data</h1>
          <p className="mt-2 text-gray-600">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <p className="mt-1 text-sm text-gray-500">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

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
            preloadedData={statsData}
          />
        </Suspense>
      </div>

      {/* Charts Section - Lazy load with intersection observer */}
      <div className="flex min-h-[400px] flex-row items-stretch gap-4">
        <div className="min-h-[400px] flex-[6]">
          <Suspense fallback={<BarChartMultipleSkeleton />}>
            <AsyncBarChart sprintIds={sprintIds} engineerId={engineerId} />
          </Suspense>
        </div>
        <div className="min-h-[400px] flex-[4]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <AsyncPieDonutChart sprintIds={sprintIds} engineerId={engineerId} />
          </Suspense>
        </div>
      </div>

      {/* Below-the-fold content - Lower priority */}
      <div className="mb-6 flex min-h-[200px]">
        <Suspense fallback={<CodingHoursFormSkeleton />}>
          <AsyncCodingHoursForm
            sprintIds={sprintIds}
            engineerId={engineerId}
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
  preloadedData,
}: {
  sprintIds: string[];
  engineerId: number;
  preloadedData?: Awaited<
    ReturnType<typeof findAverageSPAndMergedCountBySprintIds>
  >;
}) {
  try {
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
  } catch (error) {
    console.error("Error loading stats cards:", error);
    return <StatsCardsSkeleton />;
  }
}

async function AsyncBarChart({
  sprintIds,
  engineerId,
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  try {
    const averagesData = await findAveragesByEngineerAndSprintIds(
      sprintIds,
      engineerId
    );
    return <LazyBarChart data={averagesData} />;
  } catch (error) {
    console.error("Error loading bar chart:", error);
    return <BarChartMultipleSkeleton />;
  }
}

async function AsyncPieDonutChart({
  sprintIds,
  engineerId,
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  try {
    const [taskData, detailedTaskData] = await Promise.all([
      findTotalTaskToQACounts(sprintIds, engineerId),
      findDetailedTaskToQACounts(sprintIds, engineerId),
    ]);
    return <LazyPieDonutChart data={taskData} detailedData={detailedTaskData} />;
  } catch (error) {
    console.error("Error loading pie donut chart:", error);
    return <PieDonutChartSkeleton title="Tasks to QA" />;
  }
}

async function AsyncCodingHoursForm({
  sprintIds,
  engineerId,
  roleId,
}: {
  sprintIds: string[];
  engineerId: number;
  roleId: string;
}) {
  try {
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
  } catch (error) {
    console.error("Error loading coding hours form:", error);
    return <CodingHoursFormSkeleton />;
  }
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
  try {
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
  } catch (error) {
    console.error("Error loading leave public holiday:", error);
    return <LeavePublicHolidaySkeleton />;
  }
}
