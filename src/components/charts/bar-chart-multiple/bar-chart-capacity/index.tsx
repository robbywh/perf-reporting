"use client";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartData = [
  { name: "Sprint 41", capacity: 60, reality: 58.5 },
  { name: "Sprint 42", capacity: 60, reality: 58.5 },
  { name: "Sprint 43", capacity: 60, reality: 58.5 },
  { name: "Sprint 44", capacity: 60, reality: 58.5 },
  { name: "Sprint 45", capacity: 60, reality: 58.5 },
  { name: "Sprint 46", capacity: 60, reality: 58.5 },
];

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
        x={x + width / 2} // Center horizontally
        y={y + height / 2} // Center vertically
        dy={5} // Adjust vertical alignment
        fill="white"
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
      <text
        x={x + width / 2} // Center horizontally
        y={y + height / 2 + 16} // Slightly below the value
        fill="white"
        fontSize={10}
        textAnchor="middle"
      >
        {key}
      </text>
    </g>
  );
};

export function BarChartCapacity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity VS Reality</CardTitle>
        <CardDescription>
          Your team&apos;s sprint velocity is 263
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine tickMargin={10} axisLine />
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
      </CardContent>
    </Card>
  );
}
