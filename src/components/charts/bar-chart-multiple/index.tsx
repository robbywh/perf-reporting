"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
    color: "hsl(var(--chart-1))",
  },
  baseline: {
    label: "Baseline",
    color: "hsl(var(--chart-4))",
  },
  target: {
    label: "Target",
    color: "hsl(var(--chart-2))",
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

export function BarChartMultiple({ data }: { data: ChartDataProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Ensures it only runs on client
  }, []);

  if (!mounted) return null;

  const chartData = [
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
              className: "text-chart-4",
            },
            {
              condition: (item: ChartItem) => item.done <= item.baseline,
              text: "not yet reached the baseline, but don’t give up—every effort brings us closer to success!",
              className: "text-chart-1",
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
