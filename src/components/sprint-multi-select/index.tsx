"use client";

import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";

type Option = {
  value: string; // Stores `id` for filtering
  label: string; // Displays `name`
};

type SprintMultiSelectProps = {
  sprints: Option[];
};

export function SprintMultiSelect({ sprints }: SprintMultiSelectProps) {
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<Option>>(
    []
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (options: MultiValue<Option>) => {
    setSelectedOptions(options);
  };

  if (!mounted) return null; // Prevents hydration mismatch

  return (
    <div className="flex-1">
      <Select<Option, true>
        isMulti
        options={sprints}
        value={selectedOptions}
        onChange={handleChange}
        placeholder="Select sprints..."
      />
    </div>
  );
}
