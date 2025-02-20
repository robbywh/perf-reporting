import { currentUser } from "@clerk/nextjs/server";

import { BarChartMultiple } from "@/components/charts/bar-chart-multiple";
import { PieDonutTaskChart } from "@/components/charts/pie-donut-chart/pie-donut-task";
import { CodingHoursForm } from "@/components/coding-hours-form";
import LeavePublicHoliday from "@/components/leave-public-holiday-form";
import { SprintMultiSelect } from "@/components/sprint-multi-select";
import { StatsCards } from "@/components/stats-cards";
import { getWelcomeMessage } from "@/lib/utils/global";
import { findRoleIdByUserId } from "@/services/users";

const WelcomeMessage = async () => {
  const user = await currentUser(); // Fetch the logged-in user
  const firstName = user?.firstName || "Guest";
  const role = await findRoleIdByUserId(user?.id || "");
  const welcomeMessage = getWelcomeMessage(role || "", firstName);

  return <div className="flex-1 text-lg font-bold">{welcomeMessage}</div>;
};

export default function EngineerPage() {
  return (
    <div>
      <div className="mb-6 flex flex-row items-center">
        <WelcomeMessage />
        <SprintMultiSelect sprints={[]} />
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
}
