"use client";

import { BarChartMultiple } from "@/components/charts/bar-chart-multiple";
import { StatsCards } from "@/components/stats-cards";
import { useUser } from "@clerk/nextjs";
import { PieDonutMrChart } from "./components/charts/pie-donut-chart/pie-donut-mr";
import { PieDonutTaskChart } from "./components/charts/pie-donut-chart/pie-donut-task";
import { SprintSelect } from "./components/sprint-select";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";

export default function Home() {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>; // Show loading state while fetching user

  const firstName = user.firstName; // Get the first name

  const handleExportPDF = () => {
    console.log("Export to PDF triggered");
    // Implement your PDF export logic here
  };

  return (
    <div>
      <div className="flex flex-row mb-2 items-center">
        <div className="flex-1 text-lg font-bold">
          Hi, {firstName}! Focus on the features, we’ll handle the reporting.
        </div>
        <SprintSelect />
      </div>
      <div className="mb-4 flex gap-4">
        <Button onClick={handleExportPDF} variant="outline">
          Export to PDF
        </Button>
      </div>
      <div className="mb-4">
        <StatsCards />
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex-1">
          <BarChartMultiple />
        </div>
        <div className="flex-1">
          <div className="mb-4">
            <PieDonutMrChart />
          </div>
          <PieDonutTaskChart />
        </div>
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex-1">
          <BarChart />
        </div>
        <div className="flex-1">
          <PieChart />
        </div>
      </div>
    
    </div>
  );
}
