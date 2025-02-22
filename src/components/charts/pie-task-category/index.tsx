import { ChartConfig } from "@/components/ui/chart";

import { PieChart } from "../pie-chart";

const chartData = [
  { type: "newFeature", value: 275, fill: "var(--color-newFeature)" },
  { type: "issue", value: 200, fill: "var(--color-issue)" },
  { type: "enhance", value: 187, fill: "var(--color-enhance)" },
  { type: "techdebt", value: 173, fill: "var(--color-techdebt)" },
  { type: "support", value: 90, fill: "var(--color-support)" },
  { type: "doc", value: 90, fill: "var(--color-doc)" },
  {
    type: "digitalMarketing",
    value: 90,
    fill: "var(--color-digitalMarketing)",
  },
  { type: "other", value: 90, fill: "var(--color-other)" },
];

const chartConfig = {
  value: {
    label: "Task Category",
  },
  newFeature: {
    label: "NEW FEATURE",
    color: "hsl(var(--chart-1))",
  },
  issue: {
    label: "ISSUE",
    color: "hsl(var(--chart-2))",
  },
  enhance: {
    label: "ENHANCE",
    color: "hsl(var(--chart-3))",
  },
  techdebt: {
    label: "TECH DEBT",
    color: "hsl(var(--chart-4))",
  },
  support: {
    label: "SUPPORT",
    color: "hsl(var(--chart-5))",
  },
  doc: {
    label: "DOC",
    color: "hsl(var(--chart-6))",
  },
  digitalMarketing: {
    label: "DIGITAL MARKETING",
    color: "hsl(var(--chart-7))",
  },
  other: {
    label: "OTHER",
    color: "hsl(var(--chart-8))",
  },
} satisfies ChartConfig;

export function PieTaskCategoryChart() {
  return (
    <PieChart title="Task Category" data={chartData} config={chartConfig} />
  );
}
