"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getSprintsForOrganization } from "@/actions/sprints";
import { OrganizationSelector } from "@/components/organization-selector";
import { SprintComponentsClient } from "@/components/sprint-components-client";
import { SprintFilterClient } from "@/components/sprint-filter-client";
import { Skeleton } from "@/components/ui/skeleton";

type Organization = {
  id: string;
  name: string;
};

interface SprintDataWrapperProps {
  children: React.ReactNode;
  organizations: Organization[];
}

export function SprintDataWrapper({ children, organizations }: SprintDataWrapperProps) {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("org");
  const [hasSprintData, setHasSprintData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSprintData() {
      if (!organizationId) {
        setHasSprintData(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getSprintsForOrganization(organizationId);
        setHasSprintData(result.success && result.data.length > 0);
      } catch (error) {
        console.error("Error checking sprint data:", error);
        setHasSprintData(false);
      } finally {
        setLoading(false);
      }
    }

    checkSprintData();
  }, [organizationId]);

  // Show organization selection prompt if no organization is selected
  if (!organizationId) {
    return (
      <>
        <div className="flex items-center justify-between">
          <OrganizationSelector organizations={organizations} />
          <div className="text-sm text-gray-500">
            Please select an organization
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">
              Select Organization
            </div>
            <div className="text-sm text-gray-500">
              Please select an organization from the dropdown above to view data.
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <OrganizationSelector organizations={organizations} />
          <Skeleton className="h-6 w-40 rounded-md" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-60 rounded-md" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        {children}
      </>
    );
  }

  // If no sprint data, show organization selector and centered message
  if (!hasSprintData) {
    return (
      <>
        <div className="flex items-center justify-between">
          <OrganizationSelector organizations={organizations} />
          <div className="text-sm text-gray-500">
            No sprint data available
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">
              No Sprint Data Available
            </div>
            <div className="text-sm text-gray-500">
              This organization doesn&apos;t have any sprint data to display.
            </div>
          </div>
        </div>
      </>
    );
  }

  // If has sprint data, show normal layout with sprint components
  return (
    <>
      <div className="flex items-center justify-between">
        <OrganizationSelector organizations={organizations} />
        <SprintComponentsClient />
      </div>
      <SprintFilterClient />
      {children}
    </>
  );
}