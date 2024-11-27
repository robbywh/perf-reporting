"use client"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
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
  { name: "Story Points", done: 60, baseline: 58.5, target: 78 },
  { name: "Coding Hours", done: 20, baseline: 25, target: 50 },
]

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
} satisfies ChartConfig

interface CustomBarLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value?: number | string;
};


const renderCustomLabel = (props: CustomBarLabelProps, key: string) => {
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
  )
}

export function BarChartMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Points & Coding Hours</CardTitle>
        <CardDescription>Sprint 46</CardDescription>
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
              label={(props) => renderCustomLabel(props, "Done")} // Attach custom label with "Done"
            />
            <Bar
              dataKey="baseline"
              fill="var(--color-baseline)"
              radius={4}
              label={(props) => renderCustomLabel(props, "Baseline")} // Attach custom label with "Baseline"
            />
            <Bar
              dataKey="target"
              fill="var(--color-target)"
              radius={4}
              label={(props) => renderCustomLabel(props, "Target")} // Attach custom label with "Target"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-bold leading-none text-chart-4">
          Your story points have exceeded the baseline. Let’s aim to hit the target!
        </div>
        <div className="flex gap-2 font-bold leading-none text-chart-1">
          Your working hours have not yet reached the baseline, but don’t give up—every effort brings us closer to success!
        </div>
      </CardFooter>
    </Card>
  )
}
