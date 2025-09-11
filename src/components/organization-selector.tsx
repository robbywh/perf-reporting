"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Organization = {
  id: string;
  name: string;
};

interface OrganizationSelectorProps {
  organizations: Organization[];
}

export const OrganizationSelector = memo(function OrganizationSelector({ organizations }: OrganizationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");

  // Memoize organizations to prevent unnecessary effect runs
  const memoizedOrganizations = useMemo(() => organizations, [organizations.length]);

  useEffect(() => {
    // Only proceed if we have organizations
    if (memoizedOrganizations.length === 0) return;
    
    // Get organization from URL params
    const orgFromUrl = searchParams.get("org");
    
    // If URL has valid org, use it
    if (orgFromUrl && memoizedOrganizations.some(org => org.id === orgFromUrl)) {
      setSelectedOrganization(orgFromUrl);
      return;
    }
    
    // If no valid org in URL, set the first one and update URL
    if (memoizedOrganizations.length > 0) {
      const firstOrgId = memoizedOrganizations[0].id;
      setSelectedOrganization(firstOrgId);
      
      // Update URL to include the first organization
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("org", firstOrgId);
      router.push(`?${newParams.toString()}`);
    }
  }, [memoizedOrganizations, searchParams, router]);

  const handleOrganizationChange = useCallback((organizationId: string) => {
    setSelectedOrganization(organizationId);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("org", organizationId);
    router.push(`?${newParams.toString()}`);
  }, [searchParams, router]);

  // Memoize the organization options to prevent rerendering
  const organizationOptions = useMemo(() => {
    return memoizedOrganizations.map((org) => (
      <SelectItem key={org.id} value={org.id}>
        {org.name}
      </SelectItem>
    ));
  }, [memoizedOrganizations]);

  // Only show selector if user has access to at least one organization
  if (organizations.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Organization:</span>
      <Select value={selectedOrganization} onValueChange={handleOrganizationChange}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select organization..." />
        </SelectTrigger>
        <SelectContent>
          {organizationOptions}
        </SelectContent>
      </Select>
    </div>
  );
});