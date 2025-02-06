import { useState } from "react";
import Select, { MultiValue } from "react-select";

type Option = {
  value: string;
  label: string;
};

const sprints: Option[] = [
  { value: "Sprint 41", label: "Sprint 41" },
  { value: "Sprint 42", label: "Sprint 42" },
  { value: "Sprint 43", label: "Sprint 43" },
  { value: "Sprint 44", label: "Sprint 44" },
  { value: "Sprint 45", label: "Sprint 45" },
  { value: "Sprint 46", label: "Sprint 46" },
];

export function SprintMultiSelect() {
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<Option>>(
    []
  );

  const handleChange = (options: MultiValue<Option>) => {
    setSelectedOptions(options);
  };

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
