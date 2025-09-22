"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

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

export interface QATaskBreakdown {
  count: number;
  data: string[];
}

export interface QAPerformanceData {
  reviewerId: number;
  reviewerName: string;
  rejectedTasks: QATaskBreakdown;
  scenarioTasks: QATaskBreakdown;
  approvedTasks: QATaskBreakdown;
  supportedTasks: QATaskBreakdown;
  totalCount: number;
}

interface QAPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  qaData: QAPerformanceData[];
}

interface QATaskItem {
  taskName: string;
  reviewerName: string;
  category: "scenario" | "rejected" | "approved" | "supported";
}

export function QAPerformanceModal({
  isOpen,
  onClose,
  qaData,
}: QAPerformanceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "scenario" | "rejected" | "approved" | "supported"
  >("all");
  const [reviewerFilter, setReviewerFilter] = useState<"all" | string>("all");
  const itemsPerPage = 10;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert QAPerformanceData to flat list of tasks
  const allTasks = useMemo(() => {
    const tasks: QATaskItem[] = [];

    qaData.forEach((reviewer) => {
      // Add scenario tasks
      reviewer.scenarioTasks.data.forEach((taskName) => {
        tasks.push({
          taskName,
          reviewerName: reviewer.reviewerName,
          category: "scenario",
        });
      });

      // Add rejected tasks
      reviewer.rejectedTasks.data.forEach((taskName) => {
        tasks.push({
          taskName,
          reviewerName: reviewer.reviewerName,
          category: "rejected",
        });
      });

      // Add approved tasks
      reviewer.approvedTasks.data.forEach((taskName) => {
        tasks.push({
          taskName,
          reviewerName: reviewer.reviewerName,
          category: "approved",
        });
      });

      // Add supported tasks
      reviewer.supportedTasks.data.forEach((taskName) => {
        tasks.push({
          taskName,
          reviewerName: reviewer.reviewerName,
          category: "supported",
        });
      });
    });

    return tasks;
  }, [qaData]);

  // Calculate statistics and filtering
  const {
    scenarioTasks,
    rejectedTasks,
    approvedTasks,
    supportedTasks,
    filteredTasks,
    reviewerStats,
    uniqueReviewers,
  } = useMemo(() => {
    const scenario: QATaskItem[] = [];
    const rejected: QATaskItem[] = [];
    const approved: QATaskItem[] = [];
    const supported: QATaskItem[] = [];
    const stats: Record<
      string,
      {
        scenario: number;
        rejected: number;
        approved: number;
        supported: number;
      }
    > = {};
    const reviewerSet = new Set<string>();

    allTasks.forEach((task) => {
      // Track unique reviewers
      reviewerSet.add(task.reviewerName);

      // Categorize tasks
      switch (task.category) {
        case "scenario":
          scenario.push(task);
          break;
        case "rejected":
          rejected.push(task);
          break;
        case "approved":
          approved.push(task);
          break;
        case "supported":
          supported.push(task);
          break;
      }

      // Calculate reviewer stats
      if (!stats[task.reviewerName]) {
        stats[task.reviewerName] = {
          scenario: 0,
          rejected: 0,
          approved: 0,
          supported: 0,
        };
      }
      stats[task.reviewerName][task.category]++;
    });

    // Filter tasks based on selected filter
    let filtered: QATaskItem[];
    switch (filter) {
      case "scenario":
        filtered = scenario;
        break;
      case "rejected":
        filtered = rejected;
        break;
      case "approved":
        filtered = approved;
        break;
      case "supported":
        filtered = supported;
        break;
      default:
        filtered = allTasks;
    }

    // Apply reviewer filter
    if (reviewerFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.reviewerName === reviewerFilter,
      );
    }

    return {
      scenarioTasks: scenario,
      rejectedTasks: rejected,
      approvedTasks: approved,
      supportedTasks: supported,
      filteredTasks: filtered,
      reviewerStats: stats,
      uniqueReviewers: Array.from(reviewerSet).sort(),
    };
  }, [allTasks, filter, reviewerFilter]);

  // Reset to page 1 when filter changes
  const handleFilterChange = useCallback(
    (newFilter: "all" | "scenario" | "rejected" | "approved" | "supported") => {
      setFilter(newFilter);
      setCurrentPage(1);
    },
    [],
  );

  // Reset to page 1 when reviewer filter changes
  const handleReviewerFilterChange = useCallback(
    (newReviewerFilter: "all" | string) => {
      setReviewerFilter(newReviewerFilter);
      setCurrentPage(1);
    },
    [],
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "scenario":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Scenario
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Rejected
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Approved
          </Badge>
        );
      case "supported":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
            Supported
          </Badge>
        );
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            QA Performance Details ({allTasks.length} total tasks,{" "}
            {scenarioTasks.length} scenarios, {rejectedTasks.length} rejected,{" "}
            {approvedTasks.length} approved, {supportedTasks.length} supported)
          </DialogTitle>
        </DialogHeader>

        {/* Summary Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Task Summary</h3>
              <div className="space-y-1 text-sm">
                <div>Total Tasks: {allTasks.length}</div>
                <div className="text-blue-600">
                  Scenarios: {scenarioTasks.length}
                </div>
                <div className="text-red-600">
                  Rejected: {rejectedTasks.length}
                </div>
                <div className="text-green-600">
                  Approved: {approvedTasks.length}
                </div>
                <div className="text-orange-600">
                  Supported: {supportedTasks.length}
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
                      <div className="flex gap-1 text-xs">
                        <span className="text-blue-600">S{stats.scenario}</span>
                        <span className="text-red-600">R{stats.rejected}</span>
                        <span className="text-green-600">
                          A{stats.approved}
                        </span>
                        <span className="text-orange-600">
                          U{stats.supported}
                        </span>
                      </div>
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <div className="flex gap-1">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("all")}
              >
                All ({allTasks.length})
              </Button>
              <Button
                variant={filter === "scenario" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("scenario")}
                className={
                  filter === "scenario" ? "bg-blue-600 hover:bg-blue-700" : ""
                }
              >
                Scenarios ({scenarioTasks.length})
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
                variant={filter === "supported" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("supported")}
                className={
                  filter === "supported"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : ""
                }
              >
                Supported ({supportedTasks.length})
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Reviewer:</span>
            <div className="flex gap-1">
              <Button
                variant={reviewerFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleReviewerFilterChange("all")}
              >
                All ({allTasks.length})
              </Button>
              {uniqueReviewers.map((reviewer) => (
                <Button
                  key={reviewer}
                  variant={reviewerFilter === reviewer ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleReviewerFilterChange(reviewer)}
                >
                  {reviewer} (
                  {
                    allTasks.filter((task) => task.reviewerName === reviewer)
                      .length
                  }
                  )
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {filter === "all" && reviewerFilter === "all"
                ? "No tasks found."
                : `No ${filter !== "all" ? filter : ""} ${reviewerFilter !== "all" ? `tasks for ${reviewerFilter}` : "tasks"} found.`.trim()}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/5">Task Name</TableHead>
                    <TableHead className="w-1/5">Reviewer</TableHead>
                    <TableHead className="w-1/5">Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTasks.map((task, index) => (
                    <TableRow
                      key={`${task.reviewerName}-${task.category}-${index}`}
                    >
                      <TableCell className="font-medium">
                        <div className="break-words">{task.taskName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="break-words">{task.reviewerName}</div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(task.category)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredTasks.length)} of{" "}
                    {filteredTasks.length}
                    {filter === "all" && reviewerFilter === "all"
                      ? " tasks"
                      : ` ${filter !== "all" ? filter : ""} ${reviewerFilter !== "all" ? `tasks for ${reviewerFilter}` : "tasks"}`.trim()}
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
                        },
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
