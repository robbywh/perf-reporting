"use client";

import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartDataProps {
  averageStoryPoint: number;
  averageTarget: number;
  averageBaseline: number;
  averageCodingHours: number;
  averageTargetCh: number;
  averageBaselineCh: number;
}

const chartConfig = {
  done: {
    label: "Done",
    color: "#3498DB",
  },
  baseline: {
    label: "Baseline",
    color: "#FFA726",
  },
  target: {
    label: "Target",
    color: "#43A047",
  },
} satisfies ChartConfig;

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

// Custom tooltip component for showing percentages
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
    payload: {
      done: number;
      baseline: number;
      target: number;
      name: string;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const { done, baseline, target } = data;

  // Calculate percentages
  const targetPercentage =
    target > 0 ? ((done / target) * 100).toFixed(1) : "0.0";
  const baselinePercentage =
    baseline > 0 ? ((done / baseline) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold text-gray-800">{label}</p>
      <div className="space-y-1 text-sm">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="size-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span>{entry.value.toFixed(1)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t pt-2">
          <p className="font-medium text-green-600">
            Achievement vs Target: {targetPercentage}%
          </p>
          <p className="font-medium text-orange-600">
            Achievement vs Baseline: {baselinePercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};

export function BarChartMultiple({ data }: { data: ChartDataProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const chartData = useMemo(() => {
    if (!mounted) return [];
    return [
      {
        name: "Story Points",
        done: data.averageStoryPoint,
        baseline: data.averageBaseline,
        target: data.averageTarget,
      },
      {
        name: "Coding Hours",
        done: data.averageCodingHours,
        baseline: data.averageBaselineCh,
        target: data.averageTargetCh,
      },
    ];
  }, [data, mounted]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Points & Coding Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine tickMargin={10} axisLine />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="done"
              fill="var(--color-done)"
              radius={4}
              label={(props) => renderCustomLabel(props, "Done")}
            />
            <Bar
              dataKey="baseline"
              fill="var(--color-baseline)"
              radius={4}
              label={(props) => renderCustomLabel(props, "Baseline")}
            />
            <Bar
              dataKey="target"
              fill="var(--color-target)"
              radius={4}
              label={(props) => renderCustomLabel(props, "Target")}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col gap-1 text-sm font-bold">
        {(() => {
          const belowTarget = chartData.filter(
            ({ done, target }) => done < target
          );
          if (!belowTarget.length) return null;

          type ChartItem = {
            name: string;
            done: number;
            baseline: number;
            target: number;
          };

          const messages = [
            {
              condition: (item: ChartItem) => item.done > item.baseline,
              text: "exceeded the baseline but have not yet reached the target. Keep going!",
              className: "text-[#A84300]",
            },
            {
              condition: (item: ChartItem) => item.done <= item.baseline,
              text: "not yet reached the baseline, but don’t give up—every effort brings us closer to success!",
              className: "text-[#721C24]",
            },
          ]
            .map(({ condition, text, className }) => {
              const filteredItems = belowTarget.filter(condition);
              return filteredItems.length
                ? { items: filteredItems, text, className }
                : null;
            })
            .filter((msg) => msg !== null);

          return messages.map(({ items, text, className }, index) => (
            <div key={index} className={className}>
              {`Your ${items.map(({ name }) => name).join(" and ")} ${
                items.length > 1 ? "have" : "has"
              } ${text}`}
            </div>
          ));
        })()}
      </CardFooter>
    </Card>
  );
}

export function BarChartMultipleSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Points & Coding Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-1 text-sm font-bold">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
      </CardFooter>
    </Card>
  );
}
