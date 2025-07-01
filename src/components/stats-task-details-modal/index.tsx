"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

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
  const itemsPerPage = 10;

  // Calculate summary statistics
  const totalTasks = tasks.length;
  const totalStoryPoints = tasks.reduce(
    (sum, task) => sum + task.storyPoint,
    0
  );

  // Calculate average story points per sprint using the provided sprint count
  const averageStoryPointPerSprint = totalStoryPoints / sprintCount;

  // Count tasks by status and collect status colors
  const statusCounts: Record<string, number> = {};
  const statusColors: Record<string, string> = {};

  tasks.forEach((task) => {
    const status = task.statusName;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    statusColors[status] = task.statusColor || "#9CA3AF";
  });

  useEffect(() => {
    if (tasks.length > 0) {
      setTotalPages(Math.ceil(tasks.length / itemsPerPage));
      setPaginatedTasks(
        tasks.slice((page - 1) * itemsPerPage, page * itemsPerPage)
      );
    } else {
      setTotalPages(1);
      setPaginatedTasks([]);
    }
  }, [tasks, page]);

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

  // Reset page when modal is opened
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open]);

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
            <p className="text-xs text-gray-500">Status Breakdown</p>
            <div className="mt-1 flex max-h-[80px] flex-wrap gap-1 overflow-y-auto">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className="my-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{
                    backgroundColor: statusColors[status] || "#9CA3AF",
                  }}
                >
                  <span className="font-bold">{count}</span>
                  <span className="ml-1">{status}</span>
                </span>
              ))}
            </div>
          </div>
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
                    No tasks found
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
            {tasks.length > 0 && (
              <>
                Showing {(page - 1) * itemsPerPage + 1} to{" "}
                {Math.min(page * itemsPerPage, tasks.length)} of {tasks.length}{" "}
                tasks
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
