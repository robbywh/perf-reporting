"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";

type Option = {
  value: string;
  label: string;
};

type SprintMultiSelectProps = {
  sprints: Option[];
  defaultSprintId: string; // Latest sprint ID
};

export function SprintMultiSelect({
  sprints,
  defaultSprintId,
}: SprintMultiSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<Option>>(
    []
  );

  // Add a special option for selecting all sprints
  const selectAllOption: Option = { value: "all", label: "Select All" };

  // Include the 'Select All' option in the options list
  const optionsWithSelectAll = [selectAllOption, ...sprints];

  useEffect(() => {
    if (!searchParams) return;
    const sprintIdsFromUrl = searchParams.get("sprintIds")?.split(",") || [
      defaultSprintId,
    ];
    if (sprintIdsFromUrl.includes("all")) {
      setSelectedOptions(sprints); // Select all sprints
    } else {
      setSelectedOptions(
        sprints.filter((sprint) => sprintIdsFromUrl.includes(sprint.value))
      );
    }
    setMounted(true);
  }, [searchParams, defaultSprintId, sprints]);

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);

    if (selectedOptions.length > 0) {
      params.set("sprintIds", selectedOptions.map((s) => s.value).join(","));
    } else {
      params.set("sprintIds", defaultSprintId);
    }

    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [selectedOptions, router, defaultSprintId, mounted]);

  // Update the onChange handler to toggle 'Select All'
  const handleChange = (options: MultiValue<Option>) => {
    if (options.some((option) => option.value === "all")) {
      setSelectedOptions(sprints); // Select all sprints
    } else {
      setSelectedOptions(options);
    }
  };

  if (!mounted) return null; // Prevents hydration mismatch

  return (
    <div className="flex-1">
      <Select<Option, true>
        isMulti
        options={optionsWithSelectAll}
        value={selectedOptions}
        onChange={handleChange}
        placeholder="Select sprints..."
        aria-label="Select sprints"
      />
    </div>
  );
}
