"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getSprintsForOrganization } from "@/actions/sprints";
import { SprintDateRange } from "@/components/sprint-date-range";
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

export function SprintComponentsClient() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("org");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSprints() {
      console.log('🔍 SprintComponents Debug:', { organizationId, loading });
      
      if (!organizationId) {
        console.log('❌ No organization ID');
        setSprints([]);
        setLoading(false);
        return;
      }

      try {
        // Show loading immediately when organization changes
        setLoading(true);
        console.log('⏳ Fetching sprints for org:', organizationId);
        const result = await getSprintsForOrganization(organizationId);
        console.log('📊 Sprint fetch result:', { success: result.success, dataLength: result.success ? result.data.length : 0 });
        
        if (result.success) {
          setSprints(result.data);
        } else {
          console.error("Failed to fetch sprints:", result.error);
          setSprints([]);
        }
      } catch (error) {
        console.error("Error fetching sprints:", error);
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
    return <Skeleton className="h-6 w-40 rounded-md" />;
  }

  // Show message if no sprint data
  if (sprints.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No sprint data available
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



  return (
    <SprintDateRange allSprints={allSprints} />
  );
}