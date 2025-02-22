import { Suspense } from "react";

import { BarChartMultiple } from "@/components/charts/bar-chart-multiple";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-task";
import { CodingHoursForm } from "@/components/coding-hours-form";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import { StatsCards } from "@/components/stats-cards";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ Import ShadCN Skeleton

export default function EngineerPage() {
  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-28 w-full rounded-lg" />}>
          <StatsCards />
        </Suspense>
      </div>

      {/* Charts Section */}
      <div className="flex flex-row items-stretch gap-4">
        <div className="flex-[6]">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <BarChartMultiple />
          </Suspense>
        </div>
        <div className="flex-[4]">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <PieDonutTaskChart />
          </Suspense>
        </div>
      </div>

      {/* Coding Hours Form */}
      <div className="mb-6 flex">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
          <CodingHoursForm />
        </Suspense>
      </div>

      {/* Leave & Public Holiday Form */}
      <div>
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
          <LeavePublicHoliday />
        </Suspense>
      </div>
    </div>
  );
}
