"use client";

import { useState, useEffect } from "react";
import { Pie, PieChart as PieRechart, Cell } from "recharts";

import { QAPerformanceModal } from "@/components/qa-performance-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

export interface QATaskBreakdown {
  count: number;
  data: string[];
}

export interface QAPerformanceData {
  reviewerId: number;
  reviewerName: string;
  rejectedTasks: QATaskBreakdown;
  scenarioTasks: QATaskBreakdown;
  approvedTasks: QATaskBreakdown;
  supportedTasks: QATaskBreakdown;
  totalCount: number;
}

interface QAPerformancePieChartProps {
  qaData: QAPerformanceData[];
}

// Color mapping for different activity types - consistent with Tasks to QA
const COLORS = {
  scenario: "#2196F3", // Blue for scenarios
  rejected: "#E53935", // Red for rejected (same as Tasks to QA)
  approved: "#4CAF50", // Green for approved (same as Tasks to QA)
  supported: "#FF9800", // Orange/Yellow for supported
};

export function QAPerformancePieChart({
  qaData,
}: QAPerformancePieChartProps) {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aggregate totals across all reviewers
  const aggregatedData = qaData.reduce(
    (acc, reviewer) => {
      acc.scenarioCount += reviewer.scenarioTasks.count;
      acc.rejectedCount += reviewer.rejectedTasks.count;
      acc.approvedCount += reviewer.approvedTasks.count;
      acc.supportedCount += reviewer.supportedTasks.count;
      return acc;
    },
    { scenarioCount: 0, rejectedCount: 0, approvedCount: 0, supportedCount: 0 }
  );

  const chartData = [
    {
      type: "scenario",
      value: aggregatedData.scenarioCount,
      fill: COLORS.scenario,
    },
    {
      type: "rejected",
      value: aggregatedData.rejectedCount,
      fill: COLORS.rejected,
    },
    {
      type: "approved",
      value: aggregatedData.approvedCount,
      fill: COLORS.approved,
    },
    {
      type: "supported",
      value: aggregatedData.supportedCount,
      fill: COLORS.supported,
    },
  ].filter(item => item.value > 0); // Only show segments with data

  const chartConfig: ChartConfig = {
    value: {
      label: "QA Activity",
    },
    scenario: {
      label: "Scenarios",
      color: COLORS.scenario,
    },
    rejected: {
      label: "Rejected",
      color: COLORS.rejected,
    },
    approved: {
      label: "Approved",
      color: COLORS.approved,
    },
    supported: {
      label: "Supported",
      color: COLORS.supported,
    },
  };

  const handlePieClick = () => {
    setIsModalOpen(true);
  };

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>QA Performances</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No QA performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>QA Performances</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {!mounted ? (
            <div className="mx-auto h-[400px] w-full animate-pulse rounded-lg bg-gray-200" />
          ) : (
            <ChartContainer config={chartConfig} className="mx-auto max-h-[400px]">
              <PieRechart
                width={500}
                height={500}
                margin={{ top: 40, bottom: 40, left: 40, right: 40 }}
              >
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="type"
                  outerRadius={100}
                  onClick={handlePieClick}
                  className="cursor-pointer"
                  label={({ index, value, percent }) =>
                    `${chartConfig[chartData[index].type].label}: ${value} (${(percent * 100).toFixed(2)}%)`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      className="cursor-pointer hover:opacity-80"
                    />
                  ))}
                </Pie>
              </PieRechart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <QAPerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        qaData={qaData}
      />
    </>
  );
}

export function QAPerformancePieChartSkeleton() {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>QA Performances</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="size-[300px] rounded-full" />
      </CardContent>
    </Card>
  );
}