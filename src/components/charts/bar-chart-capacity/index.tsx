"use client";
import { memo, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

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
        {typeof value === "number" ? value.toFixed(2) : value}
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

// Memoize the BarChartCapacity component to prevent unnecessary re-renders
export const BarChartCapacity = memo(function BarChartCapacity({
  sprints,
}: BarChartCapacityProps) {
  const [mounted, setMounted] = useState(false);

  // Memoize chart data to prevent recalculation on each render
  const chartData = useMemo(
    () =>
      sprints.map((sprint) => ({
        name: sprint.sprintName,
        capacity: (sprint.totalBaseline + sprint.totalTarget) / 2,
        reality: sprint.totalStoryPoints,
      })),
    [sprints]
  );

  // Memoize the average velocity calculation
  const averageVelocity = useMemo(() => {
    if (chartData.length === 0) return 0;
    return (
      chartData.reduce((acc, sprint) => acc + sprint.reality, 0) /
      chartData.length
    ).toFixed(2);
  }, [chartData]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity VS Reality</CardTitle>
        <CardDescription>
          Your team&apos;s sprint velocity is {averageVelocity}
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
                key="bar-reality"
                dataKey="reality"
                fill="var(--color-reality)"
                radius={4}
                label={(props) => renderCustomLabel(props, "Reality")}
              />
              <Bar
                key="bar-capacity"
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
});

export function BarChartCapacitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity VS Reality</CardTitle>
        <CardDescription>
          <Skeleton className="h-5 w-1/3" /> {/* Placeholder for velocity */}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full rounded-md" />{" "}
        {/* Placeholder for chart */}
      </CardContent>
    </Card>
  );
}
