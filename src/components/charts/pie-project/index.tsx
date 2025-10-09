"use client";

import { useState } from "react";

import { ProjectsModal } from "@/components/projects-modal";
import { ChartConfig } from "@/components/ui/chart";

import { PieChart } from "../pie-chart";

interface TaskProject {
  project: string;
  projectId: string | null;
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
  project: {
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

interface PieProjectChartProps {
  taskData: TaskProject[];
  allTasksData: Task[];
}

// ✅ Function to generate unique colors for each project dynamically
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

  // If more projects than predefined colors, generate dynamically
  if (index < predefinedColors.length) return predefinedColors[index];

  const hue = (index * 137) % 360; // Spread colors evenly across hue spectrum
  return `hsl(${hue}, 70%, 50%)`;
};

export function PieProjectChart({
  taskData,
  allTasksData,
}: PieProjectChartProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleChartClick = () => {
    setModalOpen(true);
  };

  // Create project color mapping - use database color or fallback to generated color
  const projectColors = taskData.reduce((acc, task, index) => {
    const projectName = task.project || "OTHER";
    acc[projectName] = task.color || generateColor(index);
    return acc;
  }, {} as Record<string, string>);

  const chartData = taskData.map((task, index) => ({
    type: (task.project || "").toLowerCase().replace(/\s/g, ""), // Normalize project name
    project: task.project || "OTHER",
    projectId: task.projectId,
    value: task.count,
    fill: task.color || generateColor(index),
  }));

  const chartConfig: ChartConfig = {
    value: {
      label: "Project Percentage By SP",
    },
  };

  taskData.forEach((task, index) => {
    const normalizedProject = (task.project || "").toLowerCase().replace(/\s/g, "");
    if (normalizedProject) {
      chartConfig[normalizedProject] = {
        label: task.project || "OTHER",
        color: task.color || generateColor(index),
      };
    }
  });

  return (
    <>
      <PieChart
        title="Project Percentage By SP"
        data={chartData}
        config={chartConfig}
        onSegmentClick={handleChartClick}
      />

      <ProjectsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectColors={projectColors}
        tasks={allTasksData}
      />
    </>
  );
}
