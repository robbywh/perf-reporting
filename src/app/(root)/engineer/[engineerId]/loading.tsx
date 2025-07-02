import {
  StatsCardsSkeleton,
  BarChartMultipleSkeleton,
  PieDonutChartSkeleton,
  CodingHoursFormSkeleton,
  LeavePublicHolidaySkeleton,
} from "@/components/skeletons";

export default function Loading() {
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
