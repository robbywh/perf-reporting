"use client";
import { memo, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

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
    color: "#0073E6",
  },
  reality: {
    label: "Reality",
    color: "#F57C00",
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
  index?: number;
  payload?: {
    percentage?: number;
  };
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

// Custom tooltip component
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      capacity: number;
      reality: number;
      percentage: number;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const capacity = data.capacity;
    const reality = data.reality;
    const percentage = data.percentage;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 font-semibold text-gray-800">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-orange-600">
            <span className="font-medium">Reality:</span> {reality.toFixed(2)}{" "}
            SP
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Capacity:</span> {capacity.toFixed(2)}{" "}
            SP
          </p>
          <p className="font-medium text-gray-700">
            Reality is {percentage.toFixed(2)}% from {capacity.toFixed(2)} SP
            capacity
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Memoize the BarChartCapacity component to prevent unnecessary re-renders
export const BarChartCapacity = memo(function BarChartCapacity({
  sprints,
}: BarChartCapacityProps) {
  const [mounted, setMounted] = useState(false);

  // Memoize chart data to prevent recalculation on each render
  const chartData = useMemo(
    () =>
      sprints.map((sprint) => {
        const capacity = (sprint.totalBaseline + sprint.totalTarget) / 2;
        const reality = sprint.totalStoryPoints;
        const percentage = capacity > 0 ? (reality / capacity) * 100 : 0;

        return {
          name: sprint.sprintName,
          capacity,
          reality,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        };
      }),
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

  // Memoize the overall percentage calculation
  const overallPercentage = useMemo(() => {
    if (chartData.length === 0) return 0;
    const totalReality = chartData.reduce(
      (acc, sprint) => acc + sprint.reality,
      0
    );
    const totalCapacity = chartData.reduce(
      (acc, sprint) => acc + sprint.capacity,
      0
    );
    return totalCapacity > 0
      ? Math.round((totalReality / totalCapacity) * 100 * 100) / 100
      : 0;
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
          <div className="relative">
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 20 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine tickMargin={10} axisLine />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
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
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export function BarChartCapacitySkeleton() {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Capacity VS Reality</CardTitle>
        <CardDescription>
          <Skeleton className="h-5 w-1/3" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="h-[300px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
