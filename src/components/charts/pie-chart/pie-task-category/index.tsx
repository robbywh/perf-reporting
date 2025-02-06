import { ChartConfig } from "@/components/ui/chart";

import { PieChart } from "..";

const chartData = [
  { type: "newFeature", value: 275, fill: "var(--color-newFeature)" },
  { type: "issue", value: 200, fill: "var(--color-issue)" },
  { type: "enhance", value: 187, fill: "var(--color-enhance)" },
  { type: "techdebt", value: 173, fill: "var(--color-techdebt)" },
  { type: "support", value: 90, fill: "var(--color-support)" },
];

const chartConfig = {
  value: {
    label: "Task Category",
  },
  newFeature: {
    label: "New Feature",
    color: "hsl(var(--chart-1))",
  },
  issue: {
    label: "Issue",
    color: "hsl(var(--chart-2))",
  },
  enhance: {
    label: "Enhance",
    color: "hsl(var(--chart-3))",
  },
  techdebt: {
    label: "Tech Debt",
    color: "hsl(var(--chart-4))",
  },
  support: {
    label: "Support",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function PieTaskCategoryChart() {
  return <PieChart title="Task" data={chartData} config={chartConfig} />;
}
