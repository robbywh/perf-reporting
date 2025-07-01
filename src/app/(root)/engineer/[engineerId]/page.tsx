import { auth } from "@clerk/nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import { updateCodingHoursAction } from "@/actions/coding-hours";
import {
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
} from "@/actions/leave-holiday";
import { BackButton } from "@/components/back-button";
import {
  DynamicBarChart,
  DynamicPieDonutTaskChart,
  DynamicStatsCards,
  DynamicCodingHoursForm,
  DynamicLeavePublicHoliday,
} from "@/components/client-wrappers";
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

// Centralize data fetching to reduce waterfall requests
async function fetchCriticalData(
  sprintIds: string[],
  engineerId: number
): Promise<{
  engineer: Awaited<ReturnType<typeof findEngineerById>>;
  roleId: string;
}> {
  noStore();

  const [{ userId }, engineer] = await Promise.all([
    auth(),
    findEngineerById(engineerId),
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
  };
}

export default async function EngineerPage({
  params,
  searchParams,
}: PageProps) {
  const searchParameters = await searchParams;
  const parameters = await params;
  let sprintIds: string[];
  if (searchParameters?.sprintIds) {
    sprintIds = searchParameters.sprintIds.split(",").filter(Boolean);
  } else {
    const currentSprintId = await getCurrentSprintId();
    sprintIds = currentSprintId ? [currentSprintId] : [];
  }

  const engineerId = parseInt(parameters.engineerId || "0");

  // Fetch critical data first (user info and engineer details)
  const { engineer, roleId } = await fetchCriticalData(sprintIds, engineerId);

  const isEngineeringManager = roleId === "em";
  const isSoftwareEngineer = roleId === "se";

  // Add loading boundary at the page level
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

      {/* Stats Cards - Load independently */}
      <div className="mb-6 min-h-[120px]">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <AsyncStatsCards sprintIds={sprintIds} engineerId={engineerId} />
        </Suspense>
      </div>

      {/* Charts Section - Load independently */}
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

      {/* Coding Hours Form - Load independently */}
      <div className="mb-6 flex min-h-[200px]">
        <Suspense fallback={<CodingHoursFormSkeleton />}>
          <AsyncCodingHoursForm
            sprintIds={sprintIds}
            engineerId={engineerId}
            roleId={roleId}
          />
        </Suspense>
      </div>

      {/* Leave & Public Holiday Form - Load independently */}
      {isSoftwareEngineer && (
        <div className="min-h-[300px]">
          <Suspense fallback={<LeavePublicHolidaySkeleton />}>
            <AsyncLeavePublicHoliday
              sprintIds={sprintIds}
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
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  const statsData = await findAverageSPAndMergedCountBySprintIds(
    sprintIds,
    engineerId
  );

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
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  const averagesData = await findAveragesByEngineerAndSprintIds(
    sprintIds,
    engineerId
  );
  return <DynamicBarChart data={averagesData} />;
}

async function AsyncPieDonutChart({
  sprintIds,
  engineerId,
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  const [taskData, detailedTaskData] = await Promise.all([
    findTotalTaskToQACounts(sprintIds, engineerId),
    findDetailedTaskToQACounts(sprintIds, engineerId),
  ]);
  return (
    <DynamicPieDonutTaskChart data={taskData} detailedData={detailedTaskData} />
  );
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
  roleId,
  isEngineeringManager,
}: {
  sprintIds: string[];
  roleId: string;
  isEngineeringManager: boolean;
}) {
  const [sprintsWithLeaves, engineers] = await Promise.all([
    findSprintsWithLeavesAndHolidays(sprintIds),
    findAllEngineers(),
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
