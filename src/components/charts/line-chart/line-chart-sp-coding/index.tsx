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

// Combined data for five sprints with both metrics per engineer.
const combinedData = [
  {
    sprint: "Sprint 44",
    Engineer1SP: 50,
    Engineer1CH: 25,
    Engineer2SP: 45,
    Engineer2CH: 20,
    Engineer3SP: 60,
    Engineer3CH: 20,
    Engineer4SP: 55,
    Engineer4CH: 25,
    Engineer5SP: 40,
    Engineer5CH: 20,
  },
  {
    sprint: "Sprint 45",
    Engineer1SP: 60,
    Engineer1CH: 20,
    Engineer2SP: 50,
    Engineer2CH: 22,
    Engineer3SP: 65,
    Engineer3CH: 25,
    Engineer4SP: 60,
    Engineer4CH: 27,
    Engineer5SP: 45,
    Engineer5CH: 25,
  },
  {
    sprint: "Sprint 46",
    Engineer1SP: 55,
    Engineer1CH: 28,
    Engineer2SP: 48,
    Engineer2CH: 29,
    Engineer3SP: 62,
    Engineer3CH: 23,
    Engineer4SP: 58,
    Engineer4CH: 24,
    Engineer5SP: 42,
    Engineer5CH: 22,
  },
  {
    sprint: "Sprint 47",
    Engineer1SP: 65,
    Engineer1CH: 22,
    Engineer2SP: 52,
    Engineer2CH: 25,
    Engineer3SP: 70,
    Engineer3CH: 27,
    Engineer4SP: 63,
    Engineer4CH: 28,
    Engineer5SP: 50,
    Engineer5CH: 27,
  },
  {
    sprint: "Sprint 48",
    Engineer1SP: 70,
    Engineer1CH: 25,
    Engineer2SP: 55,
    Engineer2CH: 26,
    Engineer3SP: 75,
    Engineer3CH: 29,
    Engineer4SP: 65,
    Engineer4CH: 20,
    Engineer5SP: 52,
    Engineer5CH: 20,
  },
];

export function LineChartSPCoding() {
  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart
        data={combinedData}
        margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="sprint" />
        {/* Left Y-axis for Story Points */}
        <YAxis
          yAxisId="left"
          label={{ value: "Story Points", angle: -90, position: "insideLeft" }}
        />
        {/* Right Y-axis for Coding Hours */}
        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: "Coding Hours", angle: 90, position: "insideRight" }}
        />
        <Tooltip />
        <Legend />
        {/* Engineer 1 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Engineer1SP"
          name="Eng1 SP"
          stroke="#8884d8"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Engineer1CH"
          name="Eng1 CH"
          stroke="#8884d8"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        {/* Engineer 2 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Engineer2SP"
          name="Eng2 SP"
          stroke="#82ca9d"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Engineer2CH"
          name="Eng2 CH"
          stroke="#82ca9d"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        {/* Engineer 3 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Engineer3SP"
          name="Eng3 SP"
          stroke="#ffc658"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Engineer3CH"
          name="Eng3 CH"
          stroke="#ffc658"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        {/* Engineer 4 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Engineer4SP"
          name="Eng4 SP"
          stroke="#ff7300"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Engineer4CH"
          name="Eng4 CH"
          stroke="#ff7300"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        {/* Engineer 5 */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Engineer5SP"
          name="Eng5 SP"
          stroke="#888888"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Engineer5CH"
          name="Eng5 CH"
          stroke="#888888"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
