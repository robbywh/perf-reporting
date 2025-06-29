"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  status: string;
  value: number;
  fill: string;
}

interface PieDonutChartProps {
  title: string;
  totalLabel: string;
  config: ChartConfig;
  data: ChartData[];
  onSegmentClick?: (segmentType: string) => void;
}

export function PieDonutChart({
  title,
  totalLabel,
  config,
  data,
  onSegmentClick,
}: PieDonutChartProps) {
  // Calculate using the formula: Tasks to QA = approvedTasks + rejectedTasks
  const rejected = data.find((item) => item.status === "rejected")?.value || 0;
  const approved = data.find((item) => item.status === "approved")?.value || 0;
  const tasksToQA = approved + rejected; // Tasks to QA = approvedTasks + rejectedTasks

  // QA Rejection Ratio = rejectedTasks > 0 ? (rejectedTasks / Tasks to QA) * 100 : 0
  const rejectionRatio = rejected > 0 ? (rejected / tasksToQA) * 100 : 0;

  const formattedRejectionRatio =
    rejectionRatio % 1 !== 0 ? rejectionRatio.toFixed(2) : rejectionRatio;

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true); // Ensures it only runs on client
  }, []);

  if (!mounted) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
              onClick={
                onSegmentClick
                  ? (entry) => onSegmentClick(entry.status)
                  : undefined
              }
              style={onSegmentClick ? { cursor: "pointer" } : undefined}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {tasksToQA.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {totalLabel}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {title} Rejection Ratio {formattedRejectionRatio} %
        </div>
      </CardFooter>
    </Card>
  );
}

export function PieDonutChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="h-[350px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="size-[200px] rounded-full" />
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <Skeleton className="h-4 w-40" />
      </CardFooter>
    </Card>
  );
}
