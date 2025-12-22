"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export const OrganizationSelector = memo(function OrganizationSelector({
  organizations,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const hasInitializedRef = useRef(false);

  // Memoize organizations to prevent unnecessary effect runs
  const memoizedOrganizations = useMemo(() => organizations, [organizations]);

  // Sync state with URL params (when URL changes externally)
  useEffect(() => {
    const orgFromUrl = searchParams.get("org");

    if (
      orgFromUrl &&
      memoizedOrganizations.some((org) => org.id === orgFromUrl) &&
      selectedOrganization !== orgFromUrl
    ) {
      setSelectedOrganization(orgFromUrl);
      hasInitializedRef.current = true;
    }
  }, [searchParams, memoizedOrganizations, selectedOrganization]);

  // Initialize with first org if URL has no org (only once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (memoizedOrganizations.length === 0) return;

    const orgFromUrl = searchParams.get("org");
    if (orgFromUrl) {
      hasInitializedRef.current = true;
      return;
    }

    // Set first organization if URL has no org
    const firstOrgId = memoizedOrganizations[0].id;
    setSelectedOrganization(firstOrgId);
    hasInitializedRef.current = true;

    // Update URL to include the first organization
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("org", firstOrgId);
    router.replace(`?${newParams.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedOrganizations]);

  const handleOrganizationChange = useCallback(
    (organizationId: string) => {
      setSelectedOrganization(organizationId);

      // Update URL params
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("org", organizationId);
      router.push(`?${newParams.toString()}`);
    },
    [searchParams, router]
  );

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
    return <div className="hidden" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Organization:</span>
      <Select
        value={selectedOrganization}
        onValueChange={handleOrganizationChange}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select organization..." />
        </SelectTrigger>
        <SelectContent>{organizationOptions}</SelectContent>
      </Select>
    </div>
  );
});
