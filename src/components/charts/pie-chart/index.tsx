"use client";

import { useState, useEffect } from "react";
import { Pie, PieChart as PieRechart, Cell } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  type: string;
  value: number;
  fill: string;
}

interface ChartProps {
  title: string;
  config: ChartConfig;
  data: ChartData[];
}

export function PieChart({ title, config, data }: ChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Ensures it only runs on client
  }, []);

  if (!mounted) return null;
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={config} className="mx-auto max-h-[400px]">
          <PieRechart
            width={500} // Increased chart width
            height={500} // Increased chart height
            margin={{ top: 40, bottom: 40, left: 40, right: 40 }} // Added margin
          >
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              outerRadius={100} // Increased outer radius
              label={({ index, value, percent }) =>
                `${config[data[index].type].label}: ${value} (${(percent * 100).toFixed(2)}%)`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieRechart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function PieChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="mb-10 items-center">
        <CardTitle>{title || "Loading Chart..."}</CardTitle>
      </CardHeader>
      <CardContent className="mb-10 flex flex-1 items-center justify-center">
        <Skeleton className="size-[200px] rounded-full" />
      </CardContent>
    </Card>
  );
}
