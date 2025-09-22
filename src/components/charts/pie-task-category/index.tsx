"use client";

import { useState } from "react";

import { TaskCategoriesModal } from "@/components/task-categories-modal";
import { ChartConfig } from "@/components/ui/chart";

import { PieChart } from "../pie-chart";

interface TaskCategory {
  category: string;
  categoryId: string | null;
  count: number;
}

interface PieTaskCategoryChartProps {
  taskData: TaskCategory[];
  sprintIds: string[];
}

// ✅ Function to generate unique colors for each category dynamically
const generateColor = (index: number) => {
  const predefinedColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
  ];

  // If more categories than predefined colors, generate dynamically
  if (index < predefinedColors.length) return predefinedColors[index];

  const hue = (index * 137) % 360; // Spread colors evenly across hue spectrum
  return `hsl(${hue}, 70%, 50%)`;
};

export function PieTaskCategoryChart({
  taskData,
  sprintIds,
}: PieTaskCategoryChartProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleChartClick = () => {
    setModalOpen(true);
  };

  // Create category color mapping based on taskData order
  const categoryColors = taskData.reduce((acc, task, index) => {
    acc[task.category] = generateColor(index);
    return acc;
  }, {} as Record<string, string>);

  const chartData = taskData.map((task, index) => ({
    type: task.category.toLowerCase().replace(/\s/g, ""), // Normalize category name
    category: task.category,
    categoryId: task.categoryId,
    value: task.count,
    fill: generateColor(index),
  }));

  const chartConfig: ChartConfig = {
    value: {
      label: "Task Category",
    },
  };

  taskData.forEach((task, index) => {
    chartConfig[task.category.toLowerCase().replace(/\s/g, "")] = {
      label: task.category,
      color: generateColor(index),
    };
  });

  return (
    <>
      <PieChart
        title="Task Category"
        data={chartData}
        config={chartConfig}
        onSegmentClick={handleChartClick}
      />

      <TaskCategoriesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sprintIds={sprintIds}
        categoryColors={categoryColors}
      />
    </>
  );
}
