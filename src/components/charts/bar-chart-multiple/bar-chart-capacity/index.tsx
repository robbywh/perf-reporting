"use client";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  capacity: {
    label: "Capacity",
    color: "hsl(var(--chart-1))",
  },
  reality: {
    label: "Reality",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface SprintData {
  sprintId: string;
  sprintName: string;
  totalStoryPoints: number;
  totalBaseline: number;
  totalTarget: number;
}

interface BarChartCapacityProps {
  sprints: SprintData[]; // Receiving sprint data as a prop
}

interface CustomBarLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value?: number | string;
}

const renderCustomLabel = (props: CustomBarLabelProps, key: string) => {
  const { x, y, width, height, value } = props;
  return (
    <g>
      <text
        x={x + width / 2}
        y={y + height / 2}
        dy={5}
        fill="white"
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 16}
        fill="white"
        fontSize={10}
        textAnchor="middle"
      >
        {key}
      </text>
    </g>
  );
};

export function BarChartCapacity({ sprints }: BarChartCapacityProps) {
  const [mounted, setMounted] = useState(false);

  // Format sprint data for the chart
  const chartData = sprints.map((sprint) => ({
    name: sprint.sprintName.substring(0, 10),
    capacity: (sprint.totalBaseline + sprint.totalTarget) / 2,
    reality: sprint.totalStoryPoints,
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity VS Reality</CardTitle>
        <CardDescription>
          Your team&apos;s sprint velocity is{" "}
          {chartData.length > 0
            ? (
                chartData.reduce((acc, sprint) => acc + sprint.reality, 0) /
                chartData.length
              ).toFixed(2)
            : 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center text-sm text-gray-500">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine tickMargin={10} axisLine />
              <YAxis />
              <Bar
                dataKey="reality"
                fill="var(--color-reality)"
                radius={4}
                label={(props) => renderCustomLabel(props, "Reality")}
              />
              <Bar
                dataKey="capacity"
                fill="var(--color-capacity)"
                radius={4}
                label={(props) => renderCustomLabel(props, "Capacity")}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
