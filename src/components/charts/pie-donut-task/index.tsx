"use client";

import { PieDonutChart } from "@/components/charts/pie-donut-chart";

interface TaskChartProps {
  data: {
    averageApprovedTasks: number;
    averageRejectedTasks: number;
  };
}

export function PieDonutTaskChart({ data }: TaskChartProps) {
  // Dynamically map data to chart format
  const chartData = [
    {
      status: "approved",
      value: data.averageApprovedTasks,
      fill: "hsl(var(--chart-2))",
    },
    {
      status: "rejected",
      value: data.averageRejectedTasks,
      fill: "hsl(var(--chart-1))",
    },
  ];

  const chartConfig = {
    value: {
      label: "Task",
    },
    approved: {
      label: "Approved",
      color: "hsl(var(--chart-2))",
    },
    rejected: {
      label: "Rejected",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <PieDonutChart
      title="Tasks to QA"
      totalLabel="Total QA Tasks"
      data={chartData}
      config={chartConfig}
    />
  );
}
