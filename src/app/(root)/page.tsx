import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { BarChartCapacity } from "@/components/charts/bar-chart-multiple/bar-chart-capacity";
import { LineChartSPCoding } from "@/components/charts/line-chart/line-chart-sp-coding";
import { PieTaskCategoryChart } from "@/components/charts/pie-chart/pie-task-category";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-chart/pie-donut-task";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import { SprintMultiSelect } from "@/components/sprint-multi-select";
import { TopPerformers } from "@/components/top-performers";
import { getWelcomeMessage } from "@/lib/utils/global";
import { findRoleIdByUserId } from "@/services/users";

// eslint-disable-next-line camelcase
export const experimental_ppr = true;

const WelcomeMessage = async () => {
  const user = await currentUser(); // Fetch the logged-in user
  const firstName = user?.firstName || "Guest";
  const role = await findRoleIdByUserId(user?.id || "");
  const welcomeMessage = getWelcomeMessage(role || "", firstName);

  return <div className="flex-1 text-lg font-bold">{welcomeMessage}</div>;
};

export default function Home() {
  return (
    <div>
      <div className="mb-6 flex flex-row items-center gap-4">
        <Suspense fallback={<div>Loading ...</div>}>
          <WelcomeMessage />
        </Suspense>
        <SprintMultiSelect />
      </div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[7]">
          <BarChartCapacity />
        </div>
        <div className="flex-[3]">
          <TopPerformers />
        </div>
      </div>
      <div className="mb-6">
        <LineChartSPCoding />
      </div>
      <div className="mb-6 flex flex-row justify-center gap-4">
        <div className="flex-[2]">
          <PieTaskCategoryChart />
        </div>
        <div className="flex-[1]">
          <PieDonutTaskChart />
        </div>
      </div>
      <div>
        <LeavePublicHoliday />
      </div>
    </div>
  );
}
