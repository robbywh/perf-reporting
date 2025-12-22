"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type Organization = {
  id: string;
  name: string;
};

type OrganizationContextType = {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
  isChangingOrganization: boolean;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
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
  const [isChangingOrganization, setIsChangingOrganization] = useState(false);
  const searchParams = useSearchParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    // Get orgId from searchParams to avoid dependency on the object itself
    const orgId = searchParams.get("org");

    // Handle organization change - only update if different to prevent infinite loops
    if (orgId && orgId !== currentOrganization?.id) {
      setIsChangingOrganization(true);
      setCurrentOrganization({ id: orgId, name: orgId });

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Clear the changing state after a brief delay to allow UI updates
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setIsChangingOrganization(false);
        }
      }, 2000);
    }
    // Use searchParams.toString() to get a stable string representation
    // This prevents infinite loops from object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Separate effect for initial setup
  useEffect(() => {
    if (!mountedRef.current) return;

    if (!currentOrganization && defaultOrganization) {
      setCurrentOrganization(defaultOrganization);
    }
    setIsLoading(false);
  }, [currentOrganization, defaultOrganization]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        setCurrentOrganization,
        isLoading,
        isChangingOrganization,
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
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}

export function useCurrentOrganizationId() {
  const { currentOrganization } = useOrganization();
  return currentOrganization?.id || "ksi"; // fallback to default organization
}
