import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";

import { updateCodingHoursAction } from "@/actions/coding-hours";
import {
  addLeaveOrHolidayAction,
  deleteLeaveOrHolidayAction,
} from "@/actions/leave-holiday";
import {
  BarChartMultiple,
  BarChartMultipleSkeleton,
} from "@/components/charts/bar-chart-multiple";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-task";
import {
  CodingHoursForm,
  CodingHoursFormSkeleton,
} from "@/components/coding-hours-form";
import {
  LeavePublicHoliday,
  LeavePublicHolidaySkeleton,
} from "@/components/leave-public-holiday-form";
import { StatsCards, StatsCardsSkeleton } from "@/components/stats-cards";
import { Button } from "@/components/ui/button";
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
import { ROLE } from "@/types/roles";

interface PageProps {
  params: Promise<{ engineerId?: string }>;
  searchParams: Promise<{ sprintIds?: string }>;
}

async function StatsCardsContainer({
  sprintIds,
  engineerId,
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const data = await findAverageSPAndMergedCountBySprintIds(
    sprintIds,
    engineerId
  );
  return <StatsCards data={data} />;
}

async function PieDonutTaskChartContainer({
  sprintIds,
  engineerId,
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const data = await findTotalTaskToQACounts(sprintIds, engineerId);
  return <PieDonutTaskChart data={data} />;
}

async function BarChartMultipleContainer({
  sprintIds,
  engineerId,
}: {
  sprintIds: string[];
  engineerId: number;
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const data = await findAveragesByEngineerAndSprintIds(sprintIds, engineerId);
  return <BarChartMultiple data={data} />;
}

async function CodingHoursFormContainer({
  sprintIds,
  engineerId,
  roleId,
}: {
  sprintIds: string[];
  engineerId: number;
  roleId: string | null;
}) {
  noStore(); // Opt out of static rendering for dynamic data
  const data = await findSprintsBySprintIds(sprintIds, engineerId);
  return (
    <CodingHoursForm
      sprints={data}
      engineerId={engineerId}
      roleId={roleId || ""}
      onSave={updateCodingHoursAction}
    />
  );
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

export default async function EngineerPage({
  params,
  searchParams,
}: PageProps) {
  // Opt out of static rendering for this dynamic page
  noStore();
  const searchParameters = await searchParams;
  const parameters = await params;
  const sprintIds = searchParameters?.sprintIds
    ? searchParameters.sprintIds.split(",").filter(Boolean)
    : ["901606315079"];
  const user = await currentUser();
  const { roleId = "" } = await findRoleIdAndEngineerIdByUserId(user?.id ?? "");
  const engineerId = parseInt(parameters.engineerId || "0");
  const engineer = await findEngineerById(engineerId);

  return (
    <div>
      {roleId !== ROLE.SOFTWARE_ENGINEER && (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {engineer?.firstName}&apos;s Performance Report
            </h1>
          </div>
        </div>
      )}
      {/* Stats Cards */}
      <div className="mb-6">
        <Suspense key="stats-cards-suspense" fallback={<StatsCardsSkeleton />}>
          <StatsCardsContainer sprintIds={sprintIds} engineerId={engineerId} />
        </Suspense>
      </div>

      {/* Charts Section */}
      <div className="flex flex-row items-stretch gap-4">
        <div className="flex-[6]">
          <Suspense
            key="bar-chart-suspense"
            fallback={<BarChartMultipleSkeleton />}
          >
            <BarChartMultipleContainer
              sprintIds={sprintIds}
              engineerId={engineerId}
            />
          </Suspense>
        </div>
        <div className="flex-[4]">
          <Suspense
            key="pie-donut-chart-suspense"
            fallback={<PieDonutChartSkeleton title="Tasks to QA" />}
          >
            <PieDonutTaskChartContainer
              sprintIds={sprintIds}
              engineerId={engineerId}
            />
          </Suspense>
        </div>
      </div>

      {/* Coding Hours Form */}
      <div className="mb-6 flex">
        <Suspense
          key="coding-hours-suspense"
          fallback={<CodingHoursFormSkeleton />}
        >
          <CodingHoursFormContainer
            sprintIds={sprintIds}
            engineerId={engineerId}
            roleId={roleId}
          />
        </Suspense>
      </div>

      {/* Leave & Public Holiday Form */}
      {roleId === ROLE.SOFTWARE_ENGINEER && (
        <div>
          <Suspense
            key="leave-holiday-suspense"
            fallback={<LeavePublicHolidaySkeleton />}
          >
            <LeavePublicHolidayContainer sprintIds={sprintIds} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
