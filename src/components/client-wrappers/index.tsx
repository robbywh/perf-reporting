"use client";

import dynamic from "next/dynamic";

import { BarChartCapacitySkeleton } from "@/components/charts/bar-chart-capacity";
import { BarChartMultipleSkeleton } from "@/components/charts/bar-chart-multiple";
import { LineChartSPCodingSkeleton } from "@/components/charts/line-chart-sp-coding";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { PieDonutChartSkeleton } from "@/components/charts/pie-donut-chart";
import { QAPerformancePieChartSkeleton } from "@/components/charts/pie-qa-performance";
import { CodingHoursFormSkeleton } from "@/components/coding-hours-form";
import { LeavePublicHolidaySkeleton } from "@/components/leave-public-holiday-form";
import { StatsCardsSkeleton } from "@/components/stats-cards";
import { TopPerformersSkeleton } from "@/components/top-performers";

// Dynamically import heavy components
export const DynamicBarChartCapacity = dynamic(
  () =>
    import("@/components/charts/bar-chart-capacity").then(
      (mod) => mod.BarChartCapacity,
    ),
  {
    loading: () => <BarChartCapacitySkeleton />,
    ssr: false,
  },
);

export const DynamicLineChartSPCoding = dynamic(
  () =>
    import("@/components/charts/line-chart-sp-coding").then(
      (mod) => mod.LineChartSPCoding,
    ),
  {
    loading: () => <LineChartSPCodingSkeleton />,
    ssr: false,
  },
);

export const DynamicPieTaskCategoryChart = dynamic(
  () =>
    import("@/components/charts/pie-task-category").then(
      (mod) => mod.PieTaskCategoryChart,
    ),
  {
    loading: () => <PieChartSkeleton title="Task Category" />,
    ssr: false,
  },
);

export const DynamicPieDonutTaskChart = dynamic(
  () =>
    import("@/components/charts/pie-donut-task").then(
      (mod) => mod.PieDonutTaskChart,
    ),
  {
    loading: () => <PieDonutChartSkeleton title="Tasks to QA" />,
    ssr: false,
  },
);

export const DynamicTopPerformers = dynamic(
  () => import("@/components/top-performers").then((mod) => mod.TopPerformers),
  {
    loading: () => <TopPerformersSkeleton />,
    ssr: false,
  },
);

export const DynamicBarChart = dynamic(
  () =>
    import("@/components/charts/bar-chart-multiple").then(
      (mod) => mod.BarChartMultiple,
    ),
  {
    loading: () => <BarChartMultipleSkeleton />,
    ssr: false,
  },
);

export const DynamicStatsCards = dynamic(
  () => import("@/components/stats-cards").then((mod) => mod.StatsCards),
  {
    loading: () => <StatsCardsSkeleton />,
    ssr: false,
  },
);

export const DynamicCodingHoursForm = dynamic(
  () =>
    import("@/components/coding-hours-form").then((mod) => mod.CodingHoursForm),
  {
    loading: () => <CodingHoursFormSkeleton />,
    ssr: false,
  },
);

export const DynamicLeavePublicHoliday = dynamic(
  () =>
    import("@/components/leave-public-holiday-form").then(
      (mod) => mod.LeavePublicHoliday,
    ),
  {
    loading: () => <LeavePublicHolidaySkeleton />,
    ssr: false,
  },
);

export const DynamicQAPerformancePieChart = dynamic(
  () =>
    import("@/components/charts/pie-qa-performance").then(
      (mod) => mod.QAPerformancePieChart,
    ),
  {
    loading: () => <QAPerformancePieChartSkeleton />,
    ssr: false,
  },
);
