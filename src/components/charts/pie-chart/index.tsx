"use client";

import { useState, useEffect } from "react";
import { Pie, PieChart as PieRechart, Cell } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  type: string;
  category?: string;
  categoryId?: string | null;
  value: number;
  fill: string;
}

interface ChartProps {
  title: string;
  config: ChartConfig;
  data: ChartData[];
  onSegmentClick?: (categoryName?: string, categoryId?: string | null) => void;
}

export function PieChart({ title, config, data, onSegmentClick }: ChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Ensures it only runs on client
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {!mounted || data.length === 0 ? (
          <div className="mx-auto h-[400px] w-full animate-pulse rounded-lg bg-gray-200" />
        ) : (
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
                label={({ index, value, percent }) => {
                  const entry = data[index];
                  if (!entry || !entry.type) return "";
                  const configEntry = config[entry.type];
                  const label = configEntry?.label || entry.type || "Unknown";
                  return `${label}: ${value} SP (${(percent * 100).toFixed(2)}%)`;
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    onClick={() => {
                      if (onSegmentClick) {
                        onSegmentClick();
                      }
                    }}
                    style={{ cursor: onSegmentClick ? "pointer" : "default" }}
                  />
                ))}
              </Pie>
            </PieRechart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PieChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="size-[300px] rounded-full" />
      </CardContent>
    </Card>
  );
}
