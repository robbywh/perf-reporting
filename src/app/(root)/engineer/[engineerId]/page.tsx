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
import {
  findAverageSPAndMergedCountBySprintIds,
  findTotalTaskToQACounts,
} from "@/services/tasks";
import {
  findEngineerById,
  findRoleIdAndEngineerIdByUserId,
} from "@/services/users";
import { PageProps, PageData } from "@/types/engineer-page";

// Centralize data fetching to reduce waterfall requests
async function fetchPageData(
  sprintIds: string[],
  engineerId: number
): Promise<PageData> {
  const [
    statsData,
    taskData,
    averagesData,
    sprintsForCodingHours,
    sprintsWithLeaves,
    engineers,
    { userId },
  ] = await Promise.all([
    findAverageSPAndMergedCountBySprintIds(sprintIds, engineerId),
    findTotalTaskToQACounts(sprintIds, engineerId),
    findAveragesByEngineerAndSprintIds(sprintIds, engineerId),
    findSprintsBySprintIds(sprintIds, engineerId),
    findSprintsWithLeavesAndHolidays(sprintIds),
    findAllEngineers(),
    auth(),
  ]);

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { roleId } = await findRoleIdAndEngineerIdByUserId(userId);

  if (!roleId) {
    throw new Error("User role not found");
  }

  return {
    statsData,
    taskData,
    averagesData,
    sprintsForCodingHours,
    sprintsWithLeaves,
    engineers,
    roleId,
  };
}

export default async function EngineerPage({
  params,
  searchParams,
}: PageProps) {
  noStore();
  const searchParameters = await searchParams;
  const parameters = await params;
  const sprintIds = searchParameters?.sprintIds
    ? searchParameters.sprintIds.split(",").filter(Boolean)
    : ["901606315079"];

  const engineerId = parseInt(parameters.engineerId || "0");
  const engineer = await findEngineerById(engineerId);

  // Fetch all data in parallel
  const {
    statsData,
    taskData,
    averagesData,
    sprintsForCodingHours,
    sprintsWithLeaves,
    engineers,
    roleId,
  } = await fetchPageData(sprintIds, engineerId);

  const isEngineeringManager = roleId === "em";
  const isSoftwareEngineer = roleId === "se";

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

      {/* Stats Cards */}
      <div className="mb-6 min-h-[120px]">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <DynamicStatsCards data={statsData} />
        </Suspense>
      </div>

      {/* Charts Section */}
      <div className="flex min-h-[400px] flex-row items-stretch gap-4">
        <div className="min-h-[400px] flex-[6]">
          <Suspense fallback={<BarChartMultipleSkeleton />}>
            <DynamicBarChart data={averagesData} />
          </Suspense>
        </div>
        <div className="min-h-[400px] flex-[4]">
          <Suspense fallback={<PieDonutChartSkeleton title="Tasks to QA" />}>
            <DynamicPieDonutTaskChart data={taskData} />
          </Suspense>
        </div>
      </div>

      {/* Coding Hours Form */}
      <div className="mb-6 flex min-h-[200px]">
        <Suspense fallback={<CodingHoursFormSkeleton />}>
          <DynamicCodingHoursForm
            sprints={sprintsForCodingHours}
            engineerId={engineerId}
            roleId={roleId}
            onSave={updateCodingHoursAction}
          />
        </Suspense>
      </div>

      {/* Leave & Public Holiday Form */}
      {isSoftwareEngineer && (
        <div className="min-h-[300px]">
          <Suspense fallback={<LeavePublicHolidaySkeleton />}>
            <DynamicLeavePublicHoliday
              sprints={sprintsWithLeaves}
              roleId={roleId}
              engineers={engineers}
              addLeaveOrHolidayAction={addLeaveOrHolidayAction}
              deleteLeaveOrHolidayAction={deleteLeaveOrHolidayAction}
              showActionButton={isEngineeringManager}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
