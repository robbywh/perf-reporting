"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select, { MultiValue } from "react-select";

type Option = {
  value: string;
  label: string;
};

type SprintOption = {
  label: string;
  sprints: Option[];
};

type SprintMultiSelectProps = {
  sprints: Option[];
  defaultSprintId: string; // Latest sprint ID
  sprintOptions: SprintOption[];
};

export function SprintMultiSelect({
  sprints,
  defaultSprintId,
  sprintOptions,
}: SprintMultiSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<Option>>(
    []
  );

  // Create filter options with useMemo
  const filterOptions = useMemo(
    () => [
      { value: "today", label: "Today" },
      { value: "past-1-month", label: "Past 1 Month" },
      { value: "past-3-months", label: "Past 3 Months" },
      { value: "past-6-months", label: "Past 6 Months" },
    ],
    []
  );

  // Get sprints based on filter with useCallback
  const getFilteredSprints = useCallback(
    (filterValue: string): Option[] => {
      const option = sprintOptions.find((opt) => {
        switch (filterValue) {
          case "today":
            return opt.label === "Today";
          case "past-1-month":
            return opt.label === "Past 1 Month";
          case "past-3-months":
            return opt.label === "Past 3 Months";
          case "past-6-months":
            return opt.label === "Past 6 Months";
          default:
            return false;
        }
      });
      return option?.sprints || [];
    },
    [sprintOptions]
  );

  // Find current sprint with useCallback
  const getCurrentSprint = useCallback((): Option | undefined => {
    return sprints.find((sprint) => sprint.value === defaultSprintId);
  }, [sprints, defaultSprintId]);

  // Combine filter options with sprint options
  const getAllOptions = useCallback(() => {
    return [
      { label: "Filters", options: filterOptions },
      { label: "Sprints", options: sprints },
    ];
  }, [filterOptions, sprints]);

  useEffect(() => {
    if (!mounted) {
      // Set current sprint as default
      const currentSprint = getCurrentSprint();
      if (currentSprint) {
        setSelectedOptions([currentSprint]);
      }
      setMounted(true);
      return;
    }

    const sprintIdsFromUrl = searchParams.get("sprintIds")?.split(",");
    if (!sprintIdsFromUrl) return;

    if (filterOptions.some((opt) => sprintIdsFromUrl.includes(opt.value))) {
      const filterValue = sprintIdsFromUrl[0];
      const filteredSprints = getFilteredSprints(filterValue);
      setSelectedOptions(filteredSprints);
    } else {
      setSelectedOptions(
        sprints.filter((sprint) => sprintIdsFromUrl.includes(sprint.value))
      );
    }
  }, [
    searchParams,
    sprints,
    mounted,
    filterOptions,
    getCurrentSprint,
    getFilteredSprints,
  ]);

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);

    if (selectedOptions.length > 0) {
      params.set("sprintIds", selectedOptions.map((s) => s.value).join(","));
    } else {
      // If no selection, default to current sprint
      const currentSprint = getCurrentSprint();
      if (currentSprint) {
        params.set("sprintIds", currentSprint.value);
        setSelectedOptions([currentSprint]);
      }
    }

    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [selectedOptions, router, mounted, getCurrentSprint]);

  const handleChange = (options: MultiValue<Option>) => {
    const lastSelected = options[options.length - 1];

    // Handle filter options
    if (
      lastSelected &&
      filterOptions.some((opt) => opt.value === lastSelected.value)
    ) {
      const filteredSprints = getFilteredSprints(lastSelected.value);
      setSelectedOptions(filteredSprints);
      return;
    }

    setSelectedOptions(options);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1">
      <Select<Option, true>
        isMulti
        options={getAllOptions()}
        value={selectedOptions}
        onChange={handleChange}
        placeholder="Select sprints..."
        aria-label="Select sprints"
      />
    </div>
  );
}
