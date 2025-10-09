"use client";

import dynamic from "next/dynamic";

import { BarChartCapacitySkeleton } from "@/components/charts/bar-chart-capacity";
import { LineChartSPCodingSkeleton } from "@/components/charts/line-chart-sp-coding";
import { OrganizationAwareChart } from "@/components/charts/organization-aware-chart";
import { PieChartSkeleton } from "@/components/charts/pie-chart";
import { QAPerformancePieChartSkeleton } from "@/components/charts/pie-qa-performance";
import {
  BarChartMultipleSkeleton,
  PieDonutChartSkeleton,
} from "@/components/skeletons";

// Base dynamic imports without organization awareness
const BaseLazyBarChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicBarChart,
    })),
  {
    loading: () => <BarChartMultipleSkeleton />,
    ssr: false,
  },
);

const BaseLazyBarChartCapacity = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicBarChartCapacity,
    })),
  {
    loading: () => <BarChartCapacitySkeleton />,
    ssr: false,
  },
);

const BaseLazyLineChartSPCoding = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicLineChartSPCoding,
    })),
  {
    loading: () => <LineChartSPCodingSkeleton />,
    ssr: false,
  },
);

const BaseLazyPieTaskCategoryChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicPieTaskCategoryChart,
    })),
  {
    loading: () => <PieChartSkeleton title="Task Category Percentage By SP" />,
    ssr: false,
  },
);

const BaseLazyPieProjectChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicPieProjectChart,
    })),
  {
    loading: () => <PieChartSkeleton title="Project Percentage By SP" />,
    ssr: false,
  },
);

const BaseLazyDashboardPieDonutChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicPieDonutTaskChart,
    })),
  {
    loading: () => <PieDonutChartSkeleton title="Tasks to QA" />,
    ssr: false,
  },
);

const BaseLazyQAPerformancePieChart = dynamic(
  () =>
    import("@/components/client-wrappers").then((mod) => ({
      default: mod.DynamicQAPerformancePieChart,
    })),
  {
    loading: () => <QAPerformancePieChartSkeleton />,
    ssr: false,
  },
);

// Organization-aware chart components that show skeleton during org changes
export const LazyBarChart = (props: React.ComponentProps<typeof BaseLazyBarChart>) => (
  <OrganizationAwareChart skeleton={<BarChartMultipleSkeleton />}>
    <BaseLazyBarChart {...props} />
  </OrganizationAwareChart>
);

export const LazyPieDonutChart = (props: React.ComponentProps<typeof BaseLazyDashboardPieDonutChart>) => (
  <OrganizationAwareChart skeleton={<PieDonutChartSkeleton title="Tasks to QA" />}>
    <BaseLazyDashboardPieDonutChart {...props} />
  </OrganizationAwareChart>
);

export const LazyBarChartCapacity = (props: React.ComponentProps<typeof BaseLazyBarChartCapacity>) => (
  <OrganizationAwareChart skeleton={<BarChartCapacitySkeleton />}>
    <BaseLazyBarChartCapacity {...props} />
  </OrganizationAwareChart>
);

export const LazyLineChartSPCoding = (props: React.ComponentProps<typeof BaseLazyLineChartSPCoding>) => (
  <OrganizationAwareChart skeleton={<LineChartSPCodingSkeleton />}>
    <BaseLazyLineChartSPCoding {...props} />
  </OrganizationAwareChart>
);

export const LazyPieTaskCategoryChart = (props: React.ComponentProps<typeof BaseLazyPieTaskCategoryChart>) => (
  <OrganizationAwareChart skeleton={<PieChartSkeleton title="Task Category Percentage By SP" />}>
    <BaseLazyPieTaskCategoryChart {...props} />
  </OrganizationAwareChart>
);

export const LazyDashboardPieDonutChart = (props: React.ComponentProps<typeof BaseLazyDashboardPieDonutChart>) => (
  <OrganizationAwareChart skeleton={<PieDonutChartSkeleton title="Tasks to QA" />}>
    <BaseLazyDashboardPieDonutChart {...props} />
  </OrganizationAwareChart>
);

export const LazyQAPerformancePieChart = (props: React.ComponentProps<typeof BaseLazyQAPerformancePieChart>) => (
  <OrganizationAwareChart skeleton={<QAPerformancePieChartSkeleton />}>
    <BaseLazyQAPerformancePieChart {...props} />
  </OrganizationAwareChart>
);

export const LazyPieProjectChart = (props: React.ComponentProps<typeof BaseLazyPieProjectChart>) => (
  <OrganizationAwareChart skeleton={<PieChartSkeleton title="Project Percentage By SP" />}>
    <BaseLazyPieProjectChart {...props} />
  </OrganizationAwareChart>
);
