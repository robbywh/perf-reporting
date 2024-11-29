import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sprints = ["Sprint 44", "Sprint 45", "Sprint 46", "Sprint 47"];

export function SprintSelect() {
  return (
    <div className="w-64">
      <Select>
        <SelectTrigger id="sprint-select" className="w-full">
          <SelectValue placeholder="Select a sprint" />
        </SelectTrigger>
        <SelectContent>
          {sprints.map((sprint, index) => (
            <SelectItem key={index} value={sprint}>
              {sprint}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
