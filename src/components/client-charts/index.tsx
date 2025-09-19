"use client";

import dynamic from "next/dynamic";

import { BarChartCapacitySkeleton } from "@/components/charts/bar-chart-capacity";
import { LineChartSPCodingSkeleton } from "@/components/charts/line-chart-sp-coding";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { QAPerformancePieChartSkeleton } from "@/components/charts/pie-qa-performance";
import {
  BarChartMultipleSkeleton,
  PieDonutChartSkeleton,
} from "@/components/skeletons";

// Client-side only chart components for better performance
export const LazyBarChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicBarChart,
    })),
  {
    loading: () => <BarChartMultipleSkeleton />,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyPieDonutChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicPieDonutTaskChart,
    })),
  {
    loading: () => <PieDonutChartSkeleton title="Tasks to QA" />,
    ssr: false, // Client-side only for better performance
  }
);

// Client-side only chart components for better performance (Dashboard Page)
export const LazyBarChartCapacity = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicBarChartCapacity,
    })),
  {
    loading: () => <BarChartCapacitySkeleton />,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyLineChartSPCoding = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicLineChartSPCoding,
    })),
  {
    loading: () => <LineChartSPCodingSkeleton />,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyPieTaskCategoryChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicPieTaskCategoryChart,
    })),
  {
    loading: () => <PieChartSkeleton title="Task Category" />,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyDashboardPieDonutChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicPieDonutTaskChart,
    })),
  {
    loading: () => <PieDonutChartSkeleton title="Tasks to QA" />,
    ssr: false, // Client-side only for better performance
  }
);

export const LazyQAPerformancePieChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicQAPerformancePieChart,
    })),
  {
    loading: () => <QAPerformancePieChartSkeleton />,
    ssr: false, // Client-side only for better performance
  }
);
