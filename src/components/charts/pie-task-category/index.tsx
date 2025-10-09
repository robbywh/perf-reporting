"use client";

import { useState } from "react";

import { TaskCategoriesModal } from "@/components/task-categories-modal";
import { ChartConfig } from "@/components/ui/chart";

import { PieChart } from "../pie-chart";

interface TaskCategory {
  category: string;
  categoryId: string | null;
  color: string | null;
  count: number;
}

interface Task {
  id: string;
  name: string;
  storyPoint: number | null;
  totalStoryPoint: number;
  status: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  assignees: Array<{
    engineer: {
      id: number;
      name: string;
    };
  }>;
  reviewers: Array<{
    reviewer: {
      id: number;
      name: string;
    };
  }>;
  taskTags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

interface PieTaskCategoryChartProps {
  taskData: TaskCategory[];
  allTasksData: Task[];
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
  allTasksData,
}: PieTaskCategoryChartProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleChartClick = () => {
    setModalOpen(true);
  };

  // Create category color mapping - use database color or fallback to generated color
  const categoryColors = taskData.reduce((acc, task, index) => {
    const categoryName = task.category || "OTHER";
    acc[categoryName] = task.color || generateColor(index);
    return acc;
  }, {} as Record<string, string>);

  const chartData = taskData
    .filter((task) => task.count > 0) // Only include tasks with story points
    .map((task, index) => {
      const categoryName = task.category || "OTHER";
      const normalizedType = categoryName.toLowerCase().replace(/\s/g, "") || "other";
      return {
        type: normalizedType,
        category: categoryName,
        categoryId: task.categoryId,
        value: task.count,
        fill: task.color || generateColor(index),
      };
    });

  const chartConfig: ChartConfig = {
    value: {
      label: "Task Category Percentage By SP",
    },
  };

  taskData
    .filter((task) => task.count > 0)
    .forEach((task, index) => {
      const categoryName = task.category || "OTHER";
      const normalizedCategory = categoryName.toLowerCase().replace(/\s/g, "") || "other";
      chartConfig[normalizedCategory] = {
        label: categoryName,
        color: task.color || generateColor(index),
      };
    });

  return (
    <>
      <PieChart
        title="Task Category Percentage By SP"
        data={chartData}
        config={chartConfig}
        onSegmentClick={handleChartClick}
      />

      <TaskCategoriesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categoryColors={categoryColors}
        tasks={allTasksData}
      />
    </>
  );
}
