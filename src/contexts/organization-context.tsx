"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type Organization = {
  id: string;
  name: string;
};

type OrganizationContextType = {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

interface OrganizationProviderProps {
  children: React.ReactNode;
  defaultOrganization?: Organization;
}

export function OrganizationProvider({
  children,
  defaultOrganization,
}: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(defaultOrganization || null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const orgId = searchParams.get("org");
    if (orgId && orgId !== currentOrganization?.id) {
      // In a real app, you might fetch the organization details here
      // For now, we'll assume the organization selector handles this
      setCurrentOrganization((prev) =>
        prev?.id === orgId ? prev : { id: orgId, name: orgId },
      );
    } else if (!currentOrganization && defaultOrganization) {
      setCurrentOrganization(defaultOrganization);
    }
    setIsLoading(false);
  }, [searchParams, currentOrganization, defaultOrganization]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        setCurrentOrganization,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}

export function useCurrentOrganizationId() {
  const { currentOrganization } = useOrganization();
  return currentOrganization?.id || "ksi"; // fallback to default organization
}
