import { ChartConfig } from "@/components/ui/chart";

import { PieChart } from "../pie-chart";

interface TaskCategory {
  category: string;
  count: number;
}

interface PieTaskCategoryChartProps {
  taskData: TaskCategory[];
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

export function PieTaskCategoryChart({ taskData }: PieTaskCategoryChartProps) {
  const chartData = taskData.map((task, index) => ({
    type: task.category.toLowerCase().replace(/\s/g, ""), // Normalize category name
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
    <PieChart title="Task Category" data={chartData} config={chartConfig} />
  );
}
