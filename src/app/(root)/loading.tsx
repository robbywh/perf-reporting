import { BarChartCapacitySkeleton } from "@/components/charts/bar-chart-capacity";
import { LineChartSPCodingSkeleton } from "@/components/charts/line-chart-sp-coding";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
import { LeavePublicHolidaySkeleton } from "@/components/leave-public-holiday-form";
import { TopPerformersSkeleton } from "@/components/top-performers";

export default function Loading() {
  return (
    <main className="animate-pulse">
      {/* Top Section: Capacity Chart + Top Performers */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-h-[400px] lg:col-span-2">
          <BarChartCapacitySkeleton />
        </div>
        <div className="min-h-[400px] lg:col-span-1">
          <TopPerformersSkeleton />
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="mb-6 min-h-[500px]">
        <LineChartSPCodingSkeleton />
      </div>

      {/* Bottom Charts Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-h-[400px] lg:col-span-2">
          <PieChartSkeleton title="Task Category" />
        </div>
        <div className="min-h-[400px]">
          <PieDonutChartSkeleton title="Tasks to QA" />
        </div>
      </div>

      {/* Leave and Holiday Section */}
      <div className="min-h-[300px]">
        <LeavePublicHolidaySkeleton />
      </div>
    </main>
  );
}
