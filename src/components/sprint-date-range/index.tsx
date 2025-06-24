"use client";

import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

type SprintOption = {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
};

type SprintDateRangeProps = {
  allSprints: SprintOption[];
};

export function SprintDateRange({ allSprints }: SprintDateRangeProps) {
  const searchParams = useSearchParams();
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    const sprintIdsParam = searchParams.get("sprintIds");
    if (!sprintIdsParam) return;

    const sprintIds = sprintIdsParam.split(",");

    // Filter the sprints that match the selected IDs
    const selectedSprints = allSprints.filter((sprint) =>
      sprintIds.includes(sprint.value)
    );

    if (selectedSprints.length === 0) return;

    // Find the earliest start date and latest end date
    let lowestStartDate = selectedSprints[0].startDate;
    let highestEndDate = selectedSprints[0].endDate;

    selectedSprints.forEach((sprint) => {
      if (new Date(sprint.startDate) < new Date(lowestStartDate)) {
        lowestStartDate = sprint.startDate;
      }

      if (new Date(sprint.endDate) > new Date(highestEndDate)) {
        highestEndDate = sprint.endDate;
      }
    });

    setDateRange({
      startDate: lowestStartDate,
      endDate: highestEndDate,
    });
  }, [searchParams, allSprints]);

  if (!dateRange.startDate || !dateRange.endDate) return null;

  const formatDate = (date: Date) => format(date, "dd MMM yyyy");

  return (
    <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
      Period: {formatDate(dateRange.startDate)} -{" "}
      {formatDate(dateRange.endDate)}
    </Badge>
  );
}
