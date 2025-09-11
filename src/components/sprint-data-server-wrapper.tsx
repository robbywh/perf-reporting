import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { SprintDataWrapper } from "@/components/sprint-data-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { findUserOrganizations } from "@/services/organizations";

interface SprintDataServerWrapperProps {
  children: React.ReactNode;
}

const SprintDataContent = async ({ children }: SprintDataServerWrapperProps) => {
  const user = await currentUser();
  
  if (!user?.id) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            Authentication Required
          </div>
          <div className="text-sm text-gray-500">
            Please sign in to access the system.
          </div>
        </div>
      </div>
    );
  }

  try {
    const organizations = await findUserOrganizations(user.id);
    
    if (organizations.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">
              No Organization Access
            </div>
            <div className="text-sm text-gray-500">
              You need to be assigned to an organization to access the system.
            </div>
          </div>
        </div>
      );
    }

    return (
      <SprintDataWrapper organizations={organizations}>
        {children}
      </SprintDataWrapper>
    );
  } catch (error) {
    console.error("Error loading organizations:", error);
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Organizations
          </div>
          <div className="text-sm text-gray-500">
            Unable to load organizations.
          </div>
        </div>
      </div>
    );
  }
};

export function SprintDataServerWrapper({ children }: SprintDataServerWrapperProps) {
  return (
    <Suspense
      fallback={
        <>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-[300px] rounded-md" />
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
      }
    >
      <SprintDataContent>{children}</SprintDataContent>
    </Suspense>
  );
}