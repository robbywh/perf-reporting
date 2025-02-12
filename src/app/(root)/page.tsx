"use client";

import { useUser } from "@clerk/nextjs";
// import { PieChart } from "recharts";

// import { BarChart } from "@/components/charts/bar-chart";
import { BarChartMultiple } from "@/components/charts/bar-chart-multiple";
// import { BarChartCapacity } from "@/components/charts/bar-chart-multiple/bar-chart-capacity";
// import { LineChartSPCoding } from "@/components/charts/line-chart/line-chart-sp-coding";
// import { PieTaskCategoryChart } from "@/components/charts/pie-chart/pie-task-category";
import { CodingHoursForm } from "@/components/coding-hours-form";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import { StatsCards } from "@/components/stats-cards";
// import { Button } from "@/components/ui/button";

// import { PieDonutMrChart } from "../../components/charts/pie-chart/pie-donut-mr";
import { PieDonutTaskChart } from "../../components/charts/pie-donut-chart/pie-donut-task";
import { SprintMultiSelect } from "../../components/sprint-multi-select";
// import { TopPerformers } from "../../components/top-performers";

// import { PieCapacityRealityChart } from "@/components/charts/pie-chart/pie-capacity-reality";
// import { HolidayLeaveConfigModal } from "@/components/sprint-holiday-config/sprint-holiday-modal";

export default function Home() {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>; // Show loading state while fetching user

  const firstName = user.firstName; // Get the first name

  // Sofware Engineer
  return (
    <div>
      <div className="mb-6 flex flex-row items-center">
        <div className="flex-1 text-lg font-bold">
          Hi, {firstName}! Focus on the features, we’ll handle the reporting.
        </div>
        <SprintMultiSelect />
      </div>
      <div className="mb-6">
        <StatsCards />
      </div>
      <div className="flex flex-row items-stretch gap-4">
        <div className="flex-[6] ">
          <BarChartMultiple />
        </div>
        <div className="flex-[4] ">
          <PieDonutTaskChart />
        </div>
      </div>
      <div className="mb-6 flex">
        <CodingHoursForm />
      </div>
      <div>
        <LeavePublicHoliday />
      </div>
    </div>
  );

  // EM
  // return (
  //   <div>
  //     <div className="mb-6 flex flex-row items-center gap-4">
  //       <div className="flex-1 text-lg font-bold">
  //         Hi, Robby! Streamline your team’s workflow, we’ll handle the
  //         reporting.
  //       </div>
  //       <SprintMultiSelect />
  //     </div>
  //     <div className="mb-6 flex flex-row justify-center gap-4">
  //       <div className="flex-[7]">
  //         <BarChartCapacity />
  //       </div>
  //       <div className="flex-[3]">
  //         <TopPerformers />
  //       </div>
  //     </div>
  //     <div className="mb-6">
  //       <LineChartSPCoding />
  //     </div>
  //     <div className="mb-6 flex flex-row justify-center gap-4">
  //       <div className="flex-[2]">
  //         <PieTaskCategoryChart />
  //       </div>
  //       <div className="flex-[1]">
  //         <PieDonutTaskChart />
  //       </div>
  //     </div>
  //     <div>
  //       <LeavePublicHoliday />
  //     </div>
  //   </div>
  // );
  // return (
  //   <div>
  //     <div className="mb-6 flex flex-row items-center">
  //       <div className="flex-1 text-lg font-bold">Brian&apos;s performance</div>
  //       <SprintMultiSelect />
  //     </div>
  //     <div className="mb-4">
  //       <StatsCards />
  //     </div>
  //     <div className="flex flex-row items-stretch gap-4">
  //       <div className="flex-[6] ">
  //         <BarChartMultiple />
  //       </div>
  //       <div className="flex-[4] ">
  //         <PieDonutTaskChart />
  //       </div>
  //     </div>
  //     <div className="flex">
  //       <CodingHoursForm />
  //     </div>
  //   </div>
  // );

  // PM
  // return (
  //   <div>
  //     <div className="mb-6 flex flex-row items-center gap-4">
  //       <div className="flex-1 text-lg font-bold">
  //         Hi, Kiki! Keep driving the vision, we’ll simplify the reporting for
  //         you.
  //       </div>
  //       <SprintMultiSelect />
  //     </div>
  //     <div className="mb-6 flex flex-row justify-center gap-4">
  //       <div className="flex-[7]">
  //         <BarChartCapacity />
  //       </div>
  //       <div className="flex-[3]">
  //         <TopPerformers />
  //       </div>
  //     </div>
  //     <div className="mb-6">
  //       <LineChartSPCoding />
  //     </div>
  //     <div className="mb-6 flex flex-row justify-center gap-4">
  //       <div className="flex-[2]">
  //         <PieTaskCategoryChart />
  //       </div>
  //       <div className="flex-[1]">
  //         <PieDonutTaskChart />
  //       </div>
  //     </div>
  //     <div>
  //       <LeavePublicHoliday />
  //     </div>
  //   </div>
  // );

  // VP of Technology
  // return (
  //   <div>
  //     <div className="flex flex-row mb-2 items-center">
  //       <div className="flex-1 text-lg font-bold">
  //         Hi, Eko! Drive innovation forward, we’ll take care of the reporting.
  //       </div>
  //       <SprintSelect />
  //     </div>
  //     <div className="mb-4 flex gap-4">
  //       <Button onClick={handleExportPDF} variant="outline">
  //         Export to PDF
  //       </Button>
  //     </div>
  //     <div className="flex flex-row gap-4 mb-4">
  //       <div className="flex-1">
  //         <BarChart />
  //       </div>
  //       <div className="flex-1">
  //         <TopPerformers />
  //       </div>
  //     </div>
  //     <div className="flex flex-row gap-4">
  //       <div className="flex-1">
  //         <PieDonutMrChart />
  //       </div>
  //       <div className="flex-1">
  //         <PieDonutTaskChart />
  //       </div>
  //     </div>
  //   </div>
  // );

  // CTO
  // return (
  //   <div>
  //     <div className="mb-2 flex flex-row items-center">
  //       <div className="flex-1 text-lg font-bold">
  //         Hi, Devin! Lead the technology strategy, we’ll handle the reporting
  //         for you.
  //       </div>
  //       <SprintSelect />
  //     </div>
  //     <div className="mb-4 flex gap-4">
  //       <Button onClick={handleExportPDF} variant="outline">
  //         Export to PDF
  //       </Button>
  //     </div>
  //     <div className="mb-4 flex flex-row gap-4">
  //       <div className="flex-1">
  //         <BarChart />
  //       </div>
  //       <div className="flex-1">
  //         <TopPerformers />
  //       </div>
  //     </div>
  //     <div className="flex flex-row gap-4">
  //       <div className="flex-1">
  //         <PieDonutMrChart />
  //       </div>
  //       <div className="flex-1">
  //         <PieDonutTaskChart />
  //       </div>
  //       <div className="flex-1">
  //         <PieChart />
  //       </div>
  //     </div>
  //   </div>
  // );
}
