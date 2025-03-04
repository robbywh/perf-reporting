"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Function to generate unique colors for engineers dynamically
const generateColor = (index: number) => {
  const predefinedColors = [
    "#8884d8", // Blue
    "#82ca9d", // Green
    "#ffc658", // Yellow
    "#ff7300", // Orange
    "#888888", // Gray
    "#8a2be2", // Purple
  ];

  // If more engineers than predefined colors, generate a unique color
  if (index < predefinedColors.length) return predefinedColors[index];

  // Generate color dynamically based on index
  const hue = (index * 137) % 360; // Spread colors evenly across hue spectrum
  return `hsl(${hue}, 70%, 50%)`;
};

interface SprintTrend {
  sprintId: string;
  sprintName: string;
  engineers: { id: number; name: string; storyPoints: number }[];
}

interface LineChartSPCodingProps {
  sprintData: SprintTrend[];
}

export function LineChartSPCoding({ sprintData }: LineChartSPCodingProps) {
  const [mounted, setMounted] = useState(false);
  // Transform data for Recharts
  const transformedData: Record<string, number | string>[] = [];
  const engineersSet = new Set<string>();

  sprintData.forEach(({ sprintName, engineers }) => {
    const sprintEntry: Record<string, number | string> = {
      sprint: sprintName,
    };

    engineers.forEach(({ name, storyPoints }) => {
      sprintEntry[name] = storyPoints;
      engineersSet.add(name);
    });

    transformedData.push(sprintEntry);
  });

  const engineerNames = Array.from(engineersSet);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engineers&apos; Story Points Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {transformedData.length === 0 ? (
          <div className="text-center text-sm text-gray-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={transformedData}
              margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis
                label={{
                  value: "Story Points",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              {engineerNames.map((engineer, index) => (
                <Line
                  key={engineer}
                  dataKey={engineer}
                  stroke={generateColor(index)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function LineChartSPCodingSkeleton() {
  return (
    <Card className="h-[500px]">
      <CardHeader>
        <CardTitle>Engineers&apos; Story Points Trends</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between">
        {/* Chart Placeholder */}
        <div className="flex h-[400px] w-full flex-col items-center justify-center rounded-lg bg-muted/5">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-2 h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        {/* X-Axis Labels Placeholder */}
        <div className="flex justify-between px-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}
