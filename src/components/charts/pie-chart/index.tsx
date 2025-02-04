"use client";

import { Pie, PieChart as PieRechart, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

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

export function PieChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{chartConfig.value.label}</CardTitle>
        <CardDescription>Sprint 46 - Sprint 50</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[400px]"
        >
          <PieRechart
            width={500} // Increased chart width
            height={500} // Increased chart height
            margin={{ top: 40, bottom: 40, left: 40, right: 40 }} // Added margin
          >
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="type"
              outerRadius={70} // Increased outer radius
              label={({ index, value, percent }) =>
                `${chartConfig[chartData[index].type].label}: ${value} (${(percent * 100).toFixed(2)}%)`
              } // Uses `chartConfig` for dynamic labels
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieRechart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
