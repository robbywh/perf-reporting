import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Example arrays for sprints and engineer names (could come from props, API, or state)
const sprints = [
  "Sprint 44",
  "Sprint 45",
  "Sprint 46",
  "Sprint 47",
  "Sprint 48",
];
const engineerNames = ["Alice", "Bob", "Charlie"];

// (Optional) Some default color palette
const defaultColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#888888"];

// 1. Generate a colorMap that assigns a unique color to each engineer
const colorMap: Record<string, string> = engineerNames.reduce(
  (acc, name, index) => {
    acc[name] = defaultColors[index % defaultColors.length];
    return acc;
  },
  {} as Record<string, string>
);

// 2. Generate spData, an array of objects. Each object:
//    - Has a `sprint` property
//    - Has a property for each engineer, e.g., { Alice: 50, Bob: 45, ... }
const spData = sprints.map((sprint) => {
  const row: Record<string, number | string> = { sprint };
  engineerNames.forEach((engineer) => {
    // Replace this random generation with your own logic (e.g., from an API).
    row[engineer] = Math.floor(Math.random() * 30) + 40; // e.g. 40~69
  });
  return row;
});

export function AreaChartSPTrend() {
  // If there is no data or engineerNames are empty, return early
  if (spData.length === 0 || engineerNames.length === 0) {
    return <p>No data available.</p>;
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h2>Story Points per Engineer (Dynamic)</h2>
      <ResponsiveContainer>
        <AreaChart
          data={spData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
          {engineerNames.map((engineer) => {
            const color = colorMap[engineer] || "#000000";
            return (
              <Area
                key={engineer}
                type="monotone"
                dataKey={engineer}
                name={engineer}
                stroke={color}
                fill={color}
                fillOpacity={0.3}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
