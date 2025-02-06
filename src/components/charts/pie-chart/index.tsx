"use client";

import { Pie, PieChart as PieRechart, Cell } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

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
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[400px]"
        >
          <PieRechart
            width={500} // Increased chart width
            height={500} // Increased chart height
            margin={{ top: 40, bottom: 40, left: 40, right: 40 }} // Added margin
          >
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              outerRadius={70} // Increased outer radius
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
