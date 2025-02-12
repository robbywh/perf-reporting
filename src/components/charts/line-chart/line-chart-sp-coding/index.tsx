import React from "react";
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

const combinedData = [
  {
    sprint: "Sprint 41",
    Adi: 50 + Math.floor(Math.random() * 11) - 5,
    Brian: 45 + Math.floor(Math.random() * 11) - 5,
    Fatur: 60 + Math.floor(Math.random() * 11) - 5,
    Gharis: 55 + Math.floor(Math.random() * 11) - 5,
    Aaron: 40 + Math.floor(Math.random() * 11) - 5,
    Reinaldi: 48 + Math.floor(Math.random() * 11) - 5,
  },
  {
    sprint: "Sprint 42",
    Adi: 60 + Math.floor(Math.random() * 11) - 5,
    Brian: 50 + Math.floor(Math.random() * 11) - 5,
    Fatur: 65 + Math.floor(Math.random() * 11) - 5,
    Gharis: 60 + Math.floor(Math.random() * 11) - 5,
    Aaron: 45 + Math.floor(Math.random() * 11) - 5,
    Reinaldi: 50 + Math.floor(Math.random() * 11) - 5,
  },
  {
    sprint: "Sprint 43",
    Adi: 60 + Math.floor(Math.random() * 11) - 5,
    Brian: 50 + Math.floor(Math.random() * 11) - 5,
    Fatur: 65 + Math.floor(Math.random() * 11) - 5,
    Gharis: 60 + Math.floor(Math.random() * 11) - 5,
    Aaron: 45 + Math.floor(Math.random() * 11) - 5,
    Reinaldi: 50 + Math.floor(Math.random() * 11) - 5,
  },
  {
    sprint: "Sprint 44",
    Adi: 60 + Math.floor(Math.random() * 11) - 5,
    Brian: 50 + Math.floor(Math.random() * 11) - 5,
    Fatur: 65 + Math.floor(Math.random() * 11) - 5,
    Gharis: 60 + Math.floor(Math.random() * 11) - 5,
    Aaron: 45 + Math.floor(Math.random() * 11) - 5,
    Reinaldi: 50 + Math.floor(Math.random() * 11) - 5,
  },
  {
    sprint: "Sprint 45",
    Adi: 60 + Math.floor(Math.random() * 11) - 5,
    Brian: 50 + Math.floor(Math.random() * 11) - 5,
    Fatur: 65 + Math.floor(Math.random() * 11) - 5,
    Gharis: 60 + Math.floor(Math.random() * 11) - 5,
    Aaron: 45 + Math.floor(Math.random() * 11) - 5,
    Reinaldi: 50 + Math.floor(Math.random() * 11) - 5,
  },
  {
    sprint: "Sprint 46",
    Adi: 63 + Math.floor(Math.random() * 11) - 5,
    Brian: 50 + Math.floor(Math.random() * 11) - 5,
    Fatur: 42 + Math.floor(Math.random() * 11) - 5,
    Gharis: 40 + Math.floor(Math.random() * 11) - 5,
    Aaron: 38 + Math.floor(Math.random() * 11) - 5,
    Reinaldi: 30 + Math.floor(Math.random() * 11) - 5,
  },
];

// Dynamic list of engineer names.
const engineerNames = ["Adi", "Brian", "Fatur", "Gharis", "Aaron", "Reinaldi"];

// Optional: Define a color map for each engineer.
const colorMap = {
  Adi: "#8884d8",
  Brian: "#82ca9d",
  Fatur: "#ffc658",
  Gharis: "#ff7300",
  Aaron: "#888888",
  Reinaldi: "#8a2be2",
};

export function LineChartSPCoding() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engineers&apos; Story Points Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={combinedData}
            margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis
              yAxisId="left"
              label={{
                value: "Story Points",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Legend />
            {engineerNames.map((eng) => (
              <Line
                key={eng}
                yAxisId="left"
                dataKey={`${eng}`}
                name={`${eng}`}
                stroke={colorMap[eng as keyof typeof colorMap] || "#000"}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
