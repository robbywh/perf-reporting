"use client";

import { useOrganization } from "@/contexts/organization-context";

interface OrganizationAwareChartProps {
  children: React.ReactNode;
  skeleton: React.ReactNode;
}

export function OrganizationAwareChart({
  children,
  skeleton,
}: OrganizationAwareChartProps) {
  let isChangingOrganization = false;
  let isLoading = true;
  let currentOrganization = null;

  try {
    const organizationContext = useOrganization();
    isChangingOrganization = organizationContext.isChangingOrganization;
    isLoading = organizationContext.isLoading;
    currentOrganization = organizationContext.currentOrganization;
  } catch {
    // Fallback if organization context is not available
    return <>{skeleton}</>;
  }

  // Show skeleton when changing organization, loading, or no organization selected
  if (isChangingOrganization || isLoading || !currentOrganization) {
    return <>{skeleton}</>;
  }

  // Force complete remount when organization changes by using organization ID as key
  return (
    <div key={currentOrganization.id}>
      {children}
    </div>
  );
}