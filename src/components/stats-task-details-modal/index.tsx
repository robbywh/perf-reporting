"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TaskDetail {
  id: string;
  name: string;
  storyPoint: number;
  statusId: string;
  statusName: string;
  statusColor: string;
  parentTaskId?: string; // Optional field for parent task ID
}

interface StatsTaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskDetail[];
  title: string;
  sprintCount?: number;
}

export function StatsTaskDetailsModal({
  open,
  onOpenChange,
  tasks,
  title,
  sprintCount = 1, // Default to 1 if not provided
}: StatsTaskDetailsModalProps) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedTasks, setPaginatedTasks] = useState<TaskDetail[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDetail[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalStoryPoints, setTotalStoryPoints] = useState(0);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(
    null
  );
  const itemsPerPage = 10;

  // Filter tasks and calculate statistics
  useEffect(() => {
    // Only show tasks that have a parent task ID (subtasks)
    const filtered = tasks.filter(
      (task) =>
        task.parentTaskId !== undefined &&
        task.parentTaskId !== null &&
        task.parentTaskId !== ""
    );

    // Apply status filter if active
    const statusFiltered = activeStatusFilter
      ? filtered.filter((task) => task.statusName === activeStatusFilter)
      : filtered;

    setFilteredTasks(statusFiltered);

    // Calculate summary statistics based on filtered tasks
    setTotalTasks(statusFiltered.length);
    setTotalStoryPoints(
      statusFiltered.reduce((sum, task) => sum + task.storyPoint, 0)
    );
  }, [tasks, activeStatusFilter]);

  // Calculate average story points per sprint using the provided sprint count
  const averageStoryPointPerSprint = totalStoryPoints / sprintCount;

  // Count tasks by status and collect status colors
  const [statusColors, setStatusColors] = useState<Record<string, string>>({});
  const [allTasksStatusCounts, setAllTasksStatusCounts] = useState<
    Record<string, number>
  >({});

  // Get counts for all tasks regardless of current filter
  useEffect(() => {
    const allCounts: Record<string, number> = {};
    const colors: Record<string, string> = {};

    // Process all valid tasks (with parentTaskId)
    const validTasks = tasks.filter(
      (task) =>
        task.parentTaskId !== undefined &&
        task.parentTaskId !== null &&
        task.parentTaskId !== ""
    );

    validTasks.forEach((task) => {
      const status = task.statusName;
      allCounts[status] = (allCounts[status] || 0) + 1;
      colors[status] = task.statusColor || "#9CA3AF";
    });

    setAllTasksStatusCounts(allCounts);
    setStatusColors(colors);
  }, [tasks]);

  // Update status counts when filtered tasks change
  useEffect(() => {
    // Status counts are already tracked in allTasksStatusCounts
    // We don't need to update separate status counts here
  }, [filteredTasks]);

  // Update pagination when filtered tasks or page changes
  useEffect(() => {
    if (filteredTasks.length > 0) {
      setTotalPages(Math.ceil(filteredTasks.length / itemsPerPage));
      setPaginatedTasks(
        filteredTasks.slice((page - 1) * itemsPerPage, page * itemsPerPage)
      );
    } else {
      setTotalPages(1);
      setPaginatedTasks([]);
    }
  }, [filteredTasks, page, itemsPerPage]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Reset page and filter when modal is opened
  useEffect(() => {
    if (open) {
      setPage(1);
      setActiveStatusFilter(null);
    }
  }, [open]);

  // Handle status filter click
  const handleStatusFilter = (status: string) => {
    if (activeStatusFilter === status) {
      // If clicking the active filter, clear it
      setActiveStatusFilter(null);
    } else {
      // Set new filter
      setActiveStatusFilter(status);
      // Reset to first page
      setPage(1);
    }
  };

  // Clear active filter
  const clearFilter = () => {
    setActiveStatusFilter(null);
    setPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Summary section */}
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-semibold text-gray-700">Summary</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-white p-2 shadow-sm">
              <p className="text-xs text-gray-500">Total Tasks</p>
              <p className="font-semibold">{totalTasks}</p>
            </div>
            <div className="rounded-md bg-white p-2 shadow-sm">
              <p className="text-xs text-gray-500">Total Story Points</p>
              <p className="font-semibold">{totalStoryPoints.toFixed(2)} SP</p>
            </div>
            <div className="rounded-md bg-white p-2 shadow-sm">
              <p className="text-xs text-gray-500">Average SP/Sprint</p>
              <p className="font-semibold">
                {averageStoryPointPerSprint.toFixed(2)} SP
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-md bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Status Breakdown (click to filter)
              </p>
              {activeStatusFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="h-6 px-2 py-1 text-xs"
                >
                  Clear filter <X className="ml-1 size-3" />
                </Button>
              )}
            </div>
            <div className="mt-1 flex max-h-[80px] flex-wrap gap-1 overflow-y-auto">
              {Object.entries(allTasksStatusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`my-1 inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium text-white transition-all ${activeStatusFilter === status ? "ring-2 ring-offset-1" : "hover:opacity-90"}`}
                  style={{
                    backgroundColor: statusColors[status] || "#9CA3AF",
                  }}
                  onClick={() => handleStatusFilter(status)}
                  title={`Filter by ${status}`}
                >
                  <span className="font-bold">{count}</span>
                  <span className="ml-1">{status}</span>
                </span>
              ))}
            </div>
          </div>

          {activeStatusFilter && (
            <div className="mt-2 flex items-center">
              <Badge
                className="flex items-center gap-1"
                style={{
                  backgroundColor:
                    statusColors[activeStatusFilter] || "#9CA3AF",
                }}
              >
                Filtering by: {activeStatusFilter}
                <X
                  className="ml-1 size-3 cursor-pointer"
                  onClick={clearFilter}
                />
              </Badge>
            </div>
          )}
        </div>

        <div className="max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Task Name</TableHead>
                <TableHead className="w-[100px] text-center">
                  Story Points
                </TableHead>
                <TableHead className="w-[150px] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {activeStatusFilter
                      ? `No tasks found with status "${activeStatusFilter}"`
                      : "No tasks found"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell className="text-center">
                      {task.storyPoint.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-block rounded-full px-2 py-1 text-xs font-medium text-white"
                        style={{
                          backgroundColor: task.statusColor || "#9CA3AF",
                        }}
                      >
                        {task.statusName}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {filteredTasks.length > 0 && (
              <>
                Showing {(page - 1) * itemsPerPage + 1} to{" "}
                {Math.min(page * itemsPerPage, filteredTasks.length)} of{" "}
                {filteredTasks.length} tasks
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
