"use client";

import { useState, useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaskDetail {
  id: string;
  name: string;
  status: {
    name: string;
  } | null;
  assignees: Array<{
    engineer: {
      id: number;
      name: string;
    };
  }>;
  parentTaskAssignees: Array<{
    engineer: {
      id: number;
      name: string;
    };
  }>;
  parentTask: {
    id: string;
    name: string;
  } | null;
  reviewers: Array<{
    reviewer: {
      id: number;
      name: string;
    };
  }>;
}

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskDetail[];
  title?: string;
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  tasks,
  title,
}: TaskDetailsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "approved" | "rejected">("all");
  const itemsPerPage = 10;

  const getStatusDisplay = useCallback((task: TaskDetail) => {
    const statusName = task.status?.name?.toLowerCase() || "";

    // Check if parent task contains [Rejected] or [rejected]
    if (
      task.parentTask &&
      task.parentTask.name &&
      (task.parentTask.name.includes("[Rejected]") ||
        task.parentTask.name.includes("[rejected]"))
    ) {
      return { text: "Rejected", variant: "destructive" as const };
    }

    // Check if task name contains [Rejected] or [rejected]
    if (task.name && (task.name.includes("[Rejected]") || task.name.includes("[rejected]"))) {
      return { text: "Rejected", variant: "destructive" as const };
    }

    // Check if status is product_review or product_approved - show as green "Approved"
    if (
      statusName.includes("product approved") ||
      statusName.includes("product review") ||
      statusName.includes("product approval")
    ) {
      return { text: "Approved", variant: "default" as const };
    }

    return { text: statusName || "Unknown", variant: "secondary" as const };
  }, []);

  const getAssigneeName = useCallback((task: TaskDetail) => {
    // Get assignee name from parent task assignee (as per requirement)
    if (task.parentTaskAssignees.length > 0) {
      return task.parentTaskAssignees
        .map((assignee) => assignee.engineer.name)
        .join(", ");
    }

    // Fallback to direct assignees if no parent task assignees
    if (task.assignees.length > 0) {
      return task.assignees
        .map((assignee) => assignee.engineer.name)
        .join(", ");
    }

    return "No assignee";
  }, []);

  const getReviewerName = useCallback((task: TaskDetail) => {
    if (task.reviewers.length > 0) {
      return task.reviewers
        .map((reviewer) => reviewer.reviewer.name)
        .join(", ");
    }
    return "No reviewer";
  }, []);

  // Memoize task status calculations to avoid recalculation
  const tasksWithStatus = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      statusDisplay: getStatusDisplay(task),
    }));
  }, [tasks, getStatusDisplay]);

  // Calculate statistics and filtering efficiently in one pass
  const { rejectedTasks, approvedTasks, filteredTasks, reviewerStats } =
    useMemo(() => {
      const approved: typeof tasksWithStatus = [];
      const rejected: typeof tasksWithStatus = [];
      const stats: Record<string, { approved: number; rejected: number }> = {};

      tasksWithStatus.forEach((task) => {
        const { statusDisplay } = task;
        const reviewerName = getReviewerName(task);

        // Categorize tasks
        if (statusDisplay.text === "Approved") {
          approved.push(task);
        } else if (statusDisplay.text === "Rejected") {
          rejected.push(task);
        }

        // Calculate reviewer stats
        if (reviewerName !== "No reviewer") {
          const reviewers = reviewerName.split(", ");
          reviewers.forEach((reviewer) => {
            if (!stats[reviewer]) {
              stats[reviewer] = { approved: 0, rejected: 0 };
            }

            if (statusDisplay.text === "Approved") {
              stats[reviewer].approved++;
            } else if (statusDisplay.text === "Rejected") {
              stats[reviewer].rejected++;
            }
          });
        }
      });

      // Filter tasks based on selected filter
      let filtered: typeof tasksWithStatus;
      switch (filter) {
        case "approved":
          filtered = approved;
          break;
        case "rejected":
          filtered = rejected;
          break;
        default:
          filtered = tasksWithStatus;
      }

      return {
        rejectedTasks: rejected,
        approvedTasks: approved,
        filteredTasks: filtered,
        reviewerStats: stats,
      };
    }, [tasksWithStatus, filter, getReviewerName]);

  // Reset to page 1 when filter changes
  const handleFilterChange = useCallback(
    (newFilter: "all" | "approved" | "rejected") => {
      setFilter(newFilter);
      setCurrentPage(1);
    },
    []
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || "Task"} Details ({tasks.length} total,{" "}
            {approvedTasks.length} approved, {rejectedTasks.length} rejected)
          </DialogTitle>
        </DialogHeader>

        {/* Summary Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Task Summary</h3>
              <div className="space-y-1 text-sm">
                <div>Total Tasks: {tasks.length}</div>
                <div className="text-green-600">
                  Approved: {approvedTasks.length}
                </div>
                <div className="text-red-600">
                  Rejected: {rejectedTasks.length}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Reviewer Summary</h3>
              <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
                {Object.keys(reviewerStats).length > 0 ? (
                  Object.entries(reviewerStats).map(([reviewer, stats]) => (
                    <div key={reviewer} className="flex justify-between">
                      <span className="truncate pr-2">{reviewer}:</span>
                      <span className="mr-1 text-green-600">
                        ✓{stats.approved}
                      </span>
                      <span className="text-red-600">✗{stats.rejected}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">
                    No reviewers found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex gap-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All ({tasks.length})
            </Button>
            <Button
              variant={filter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("approved")}
              className={
                filter === "approved" ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              Approved ({approvedTasks.length})
            </Button>
            <Button
              variant={filter === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("rejected")}
              className={
                filter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              Rejected ({rejectedTasks.length})
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {filter === "all"
                ? "No tasks found."
                : `No ${filter} tasks found.`}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/5">Task Name</TableHead>
                    <TableHead className="w-1/5">Reviewer</TableHead>
                    <TableHead className="w-1/5">Assignee</TableHead>
                    <TableHead className="w-1/5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTasks.map((task) => {
                    const { statusDisplay } = task;
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <div className="break-words">{task.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="break-words">
                            {getReviewerName(task)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="break-words">
                            {getAssigneeName(task)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusDisplay.variant}
                            className={
                              statusDisplay.text === "Approved"
                                ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-200"
                                : statusDisplay.text === "Rejected"
                                  ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-200"
                                  : ""
                            }
                          >
                            {statusDisplay.text}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredTasks.length)} of{" "}
                    {filteredTasks.length}
                    {filter === "all" ? " tasks" : ` ${filter} tasks`}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={
                                currentPage === pageNumber
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(pageNumber)}
                              className="size-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
