"use client";

import { useState } from "react";

import { PieDonutChart } from "@/components/charts/pie-donut-chart";
import { TaskDetailsModal } from "@/components/task-details-modal";
import type { DetailedTask } from "@/services/tasks";

interface TaskChartProps {
  data: {
    approvedTasks: number;
    rejectedTasks: number;
  };
  detailedData?: {
    approvedTasks: DetailedTask[];
    rejectedTasks: DetailedTask[];
  };
}

export function PieDonutTaskChart({ data, detailedData }: TaskChartProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTasks, setModalTasks] = useState<DetailedTask[]>([]);

  const handleSegmentClick = () => {
    if (!detailedData) return;

    // Always show ALL tasks (approved + rejected merged) regardless of which segment is clicked
    const allTasks = [
      ...detailedData.approvedTasks,
      ...detailedData.rejectedTasks,
    ];
    setModalTasks(allTasks);
    setModalOpen(true);
  };

  // Dynamically map data to chart format
  const chartData = [
    {
      status: "approved",
      value: data.approvedTasks,
      fill: "#4CAF50",
    },
    {
      status: "rejected",
      value: data.rejectedTasks,
      fill: "#E53935",
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
    <>
      <PieDonutChart
        title="Tasks to QA"
        totalLabel="Total QA Tasks"
        data={chartData}
        config={chartConfig}
        onSegmentClick={detailedData ? handleSegmentClick : undefined}
      />

      <TaskDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tasks={modalTasks}
      />
    </>
  );
}
