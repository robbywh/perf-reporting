"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getSprintsForOrganization } from "@/actions/sprints";
import { SprintActions } from "@/components/sprint-actions";
import { SprintMultiSelect } from "@/components/sprint-multi-select";
import { Skeleton } from "@/components/ui/skeleton";

type Sprint = {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
};

type SprintOption = {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
};

const getDateMonthsAgo = (months: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
};

export function SprintFilterClient() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("org");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSprints() {
      console.log('🔍 SprintFilter Debug:', { organizationId });
      
      if (!organizationId) {
        console.log('❌ No organization ID for filter');
        setSprints([]);
        setLoading(false);
        return;
      }

      try {
        // Show loading immediately when organization changes
        setLoading(true);
        console.log('⏳ Fetching sprints for filter org:', organizationId);
        const result = await getSprintsForOrganization(organizationId);
        console.log('📊 Filter sprint fetch result:', { success: result.success, dataLength: result.success && result.data ? result.data.length : 0 });
        
        if (result.success && result.data) {
          setSprints(result.data);
        } else {
          console.error("Failed to fetch sprints for filter:", result.error);
          setSprints([]);
        }
      } catch (error) {
        console.error("Error fetching sprints for filter:", error);
        setSprints([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSprints();
  }, [organizationId]);

  // Don't render anything if no organization is selected
  if (!organizationId) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-60 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    );
  }

  // Show message if no sprint data
  if (sprints.length === 0) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex-1 text-sm text-gray-500">
          No sprint data available for filtering
        </div>
      </div>
    );
  }

  // Process sprints data
  const allSprints = sprints.map((sprint: Sprint) => ({
    value: sprint.id,
    label: sprint.name,
    startDate: new Date(sprint.startDate),
    endDate: new Date(sprint.endDate),
  }));

  const currentDate = new Date();
  const oneMonthAgo = getDateMonthsAgo(1);
  const threeMonthsAgo = getDateMonthsAgo(3);
  const sixMonthsAgo = getDateMonthsAgo(6);

  // Find current sprint
  const currentSprint = allSprints.find(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      currentDate <= new Date(sprint.endDate)
  );

  // Today's sprint
  const todaySprint = currentSprint ? [currentSprint] : [];

  // Past sprints should exclude current sprint
  const past1MonthSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.endDate) <= currentDate &&
      new Date(sprint.endDate) >= oneMonthAgo &&
      (currentSprint ? sprint.value !== currentSprint.value : true)
  );

  const past3MonthsSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= threeMonthsAgo &&
      (currentSprint ? sprint.value !== currentSprint.value : true)
  );

  const past6MonthsSprints = allSprints.filter(
    (sprint: SprintOption) =>
      new Date(sprint.startDate) <= currentDate &&
      new Date(sprint.startDate) >= sixMonthsAgo &&
      (currentSprint ? sprint.value !== currentSprint.value : true)
  );

  const defaultSprint = currentSprint || allSprints[allSprints.length - 1];

  const sprintOptions = [
    { label: "Today", sprints: todaySprint },
    { label: "Past 1 Month", sprints: past1MonthSprints },
    { label: "Past 3 Months", sprints: past3MonthsSprints },
    { label: "Past 6 Months", sprints: past6MonthsSprints },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <SprintMultiSelect
          sprints={allSprints}
          defaultSprintId={defaultSprint?.value}
          sprintOptions={sprintOptions}
        />
      </div>
      <SprintActions />
    </div>
  );
}