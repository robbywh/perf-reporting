"use client"

import { Bar, BarChart as BarRechart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"
const chartData = [
  { name: "Sprint 45", value: 186 },
  { name: "Sprint 46", value: 305 },
  { name: "Sprint 47", value: 256 },
  { name: "Sprint 48", value: 234 },
  { name: "Sprint 49", value: 350 },
  { name: "Sprint 50", value: 245 },
]

const chartConfig = {
  name: {
    label: "Story Point",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface CustomBarLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value?: number | string;
};


const renderCustomLabel = (props: CustomBarLabelProps) => {
  const { x, y, width, height, value } = props
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
    </g>
  )
}

export function BarChart() {
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const average = Math.round(total / chartData.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Velocity</CardTitle>
        <CardDescription>Sprint 45 - Sprint 50</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarRechart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Bar dataKey="value" fill="var(--color-name)" radius={8}   label={(props) => renderCustomLabel(props)} />
          </BarRechart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-bold leading-none text-xl">
          Your sprint velocity is {average}
        </div>
      </CardFooter>
    </Card>
  )
}
