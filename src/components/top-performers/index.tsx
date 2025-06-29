"use client";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useMemo, useCallback } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Skeleton } from "../ui/skeleton";

interface Performer {
  id: number;
  name: string | undefined;
  email: string | null | undefined;
  storyPoints: number;
  target: number;
  completionPercentage: number;
}

interface TopPerformersProps {
  performers: Performer[];
  sprintIds?: string;
}

// Memoize the component to prevent unnecessary re-renders
export const TopPerformers = memo(function TopPerformers({
  performers,
  sprintIds,
}: TopPerformersProps) {
  // Memoize the total story points calculation
  const totalSP = useMemo(
    () => performers.reduce((sum, p) => sum + p.storyPoints, 0),
    [performers]
  );

  // Memoize the total target calculation
  const totalTarget = useMemo(
    () => performers.reduce((sum, p) => sum + p.target, 0),
    [performers]
  );

  // Calculate overall percentage
  const overallPercentage =
    totalTarget > 0 ? ((totalSP / totalTarget) * 100).toFixed(0) : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>
          Your team&apos;s story points total {totalSP.toFixed(2)}.
          {overallPercentage && (
            <> Overall achievement: {overallPercentage}% of target.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {performers.map((performer) => (
            <PerformerItem
              key={performer.id}
              performer={performer}
              sprintIds={sprintIds}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Extract performer item to its own memoized component
const PerformerItem = memo(function PerformerItem({
  performer,
  sprintIds,
}: {
  performer: Performer;
  sprintIds?: string;
}) {
  const router = useRouter();

  // Memoize the avatar fallback text
  const avatarFallback = useMemo(() => {
    return (
      performer?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || ""
    );
  }, [performer?.name]);

  // Prefetch the engineer page on hover with debounce
  const handleMouseEnter = useCallback(() => {
    // Prefetch critical data only, not the full page
    router.prefetch(
      `/engineer/${performer.id}${sprintIds ? `?sprintIds=${sprintIds}` : ""}`
    );
  }, [router, performer.id, sprintIds]);

  // Add optimistic navigation to make the click feel more responsive
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Show immediate loading state while navigating
      router.push(
        `/engineer/${performer.id}${sprintIds ? `?sprintIds=${sprintIds}` : ""}`
      );
    },
    [router, performer.id, sprintIds]
  );

  return (
    <div
      className="block w-full cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      <div className="flex cursor-pointer items-center justify-between rounded-md p-3 transition hover:bg-gray-100">
        <div className="flex min-w-0 items-center space-x-3">
          <Avatar className="shrink-0">
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{performer.name}</p>
            <p className="truncate text-xs text-gray-500">{performer.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center space-x-2">
          <div className="flex flex-col items-end">
            {performer.target > 0 && (
              <p className="text-sm font-semibold">
                {performer.completionPercentage.toFixed(0)}%
              </p>
            )}
            <p className="text-xs text-gray-500">
              {performer.storyPoints.toFixed(1)} / {performer.target.toFixed(1)}{" "}
              SP
            </p>
          </div>
          <ChevronRight className="size-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
});

export function TopPerformersSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>
          <Skeleton className="h-5 w-1/2" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md p-3"
            >
              <div className="flex min-w-0 items-center space-x-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </div>
              </div>
              <div className="flex shrink-0 items-center space-x-2">
                <div className="flex flex-col items-end">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
                <ChevronRight className="size-4 text-gray-400 opacity-50" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
