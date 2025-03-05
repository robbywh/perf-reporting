"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>
          Your team&apos;s story points total {totalSP.toFixed(2)}.
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

  // Prefetch the engineer page on hover
  const handleMouseEnter = useCallback(() => {
    router.prefetch(
      `/engineer/${performer.id}${sprintIds ? `?sprintIds=${sprintIds}` : ""}`
    );
  }, [router, performer.id, sprintIds]);

  return (
    <Link
      href={{
        pathname: `/engineer/${performer.id}`,
        query: sprintIds ? { sprintIds } : undefined,
      }}
      className="block w-full"
      onMouseEnter={handleMouseEnter}
      prefetch={false} // We'll handle prefetching manually on hover
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
          <p className="text-sm font-semibold">
            {performer.storyPoints.toFixed(2)} SP
          </p>
          <ChevronRight className="size-4 text-gray-400" />
        </div>
      </div>
    </Link>
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
                <Skeleton className="h-4 w-12" />
                <ChevronRight className="size-4 text-gray-400 opacity-50" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
