"use client";

import { useState, useCallback } from "react";

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

interface Task {
  id: string;
  sprintId?: string;
  name: string;
  storyPoint: number | null;
  totalStoryPoint: number;
  status: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  assignees: Array<{
    engineer: {
      id: number;
      name: string;
    };
  }>;
  reviewers: Array<{
    reviewer: {
      id: number;
      name: string;
    };
  }>;
  taskTags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

interface TaskCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryColors?: Record<string, string>;
  tasks: Task[];
}

export function TaskCategoriesModal({
  isOpen,
  onClose,
  categoryColors: propCategoryColors,
  tasks,
}: TaskCategoriesModalProps) {
  const [filter, setFilter] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique categories including OTHER for tasks without category
  // Only include categories that have story points > 0
  const categoryStoryPoints = tasks.reduce((acc, task) => {
    const categoryName = task.category?.name || "OTHER";
    acc[categoryName] = (acc[categoryName] || 0) + (task.totalStoryPoint || 0);
    return acc;
  }, {} as Record<string, number>);

  const categories = Array.from(
    new Set<string>(
      tasks
        .map((task) => task.category?.name || "OTHER")
        .filter((name): name is string => !!name && categoryStoryPoints[name] > 0),
    ),
  ).sort();

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    const categoryName = task.category?.name || "OTHER";

    // Only show tasks from categories with story points > 0
    if (categoryStoryPoints[categoryName] <= 0) {
      return false;
    }

    if (filter === "all") return true;
    if (filter === "OTHER") return !task.category?.name;
    return task.category?.name === filter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  // Group current page tasks by category for display
  const tasksByCategory = currentTasks.reduce(
    (acc, task) => {
      const categoryName = task.category?.name || "OTHER";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  const getTotalStoryPoints = () => {
    return filteredTasks.reduce((total, task) => {
      return total + (task.totalStoryPoint || 0);
    }, 0);
  };

  const getAllTotalStoryPoints = () => {
    return tasks.reduce((total, task) => {
      return total + (task.totalStoryPoint || 0);
    }, 0);
  };

  const getTaskCountByCategory = (categoryName: string) => {
    if (categoryName === "OTHER") {
      return tasks.filter((task) => !task.category?.name).length;
    }
    return tasks.filter((task) => task.category?.name === categoryName).length;
  };

  // Generate colors matching the pie chart
  const generateColor = (index: number) => {
    const predefinedColors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))",
      "hsl(var(--chart-7))",
      "hsl(var(--chart-8))",
    ];

    if (index < predefinedColors.length) return predefinedColors[index];

    const hue = (index * 137) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Use provided category colors from props, or database colors, or fallback to generated colors
  const categoryColors = propCategoryColors || categories.reduce((acc, categoryName, index) => {
    // Find the first task with this category to get its color from database
    const taskWithCategory = tasks.find(
      (task) => (task.category?.name || "OTHER") === categoryName
    );
    const dbColor = taskWithCategory?.category?.color;
    acc[categoryName] = dbColor || generateColor(index);
    return acc;
  }, {} as Record<string, string>);

  const handleFilterChange = useCallback((newFilter: "all" | string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  }, []);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {filter === "all" ? "All Task Categories" : `${filter} Tasks`} (
            {filteredTasks.length} tasks) - Total SP: {getTotalStoryPoints()}
          </DialogTitle>
        </DialogHeader>

        {tasks.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No tasks available
          </div>
        ) : (
          <>
            {/* Summary Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Task Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div>Total Tasks: {tasks.length}</div>
                    <div>Total Story Points: {getAllTotalStoryPoints()}</div>
                    <div>Total Categories: {categories.length}</div>
                    {filter !== "all" && (
                      <div className="text-blue-600">
                        Filtered - {filter}: {filteredTasks.length} tasks ({getTotalStoryPoints()} SP)
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Category Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.length > 0 ? (
                      categories.map((categoryName) => {
                        const categoryTasks = tasks.filter(
                          (task) => categoryName === "OTHER"
                            ? !task.category?.name
                            : task.category?.name === categoryName,
                        );
                        const categoryStoryPoints = categoryTasks.reduce(
                          (total, task) => total + (task.totalStoryPoint || 0),
                          0,
                        );
                        return (
                          <Badge
                            key={categoryName}
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: categoryColors[categoryName],
                              color: "white",
                              borderColor: categoryColors[categoryName],
                            }}
                          >
                            {categoryName}: {categoryTasks.length}T / {categoryStoryPoints}SP
                          </Badge>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No categories found
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("all")}
                  >
                    All ({tasks.length})
                  </Button>
                  {categories.map((categoryName) => (
                    <Button
                      key={categoryName}
                      variant={filter === categoryName ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange(categoryName)}
                      style={filter === categoryName ? {
                        backgroundColor: categoryColors[categoryName],
                        borderColor: categoryColors[categoryName],
                        color: "white",
                      } : {
                        borderColor: categoryColors[categoryName],
                        color: categoryColors[categoryName],
                      }}
                    >
                      {categoryName} ({getTaskCountByCategory(categoryName)})
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {filter === "all"
                    ? "No tasks found"
                    : `No tasks found in ${filter} category`}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Category</TableHead>
                        <TableHead className="w-[450px]">Task Name</TableHead>
                        <TableHead className="w-[120px]">Total SP</TableHead>
                        <TableHead className="w-[200px]">Assignees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(tasksByCategory)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([categoryName, categoryTasks]) =>
                          categoryTasks.map((task, taskIndex) => (
                            <TableRow key={`${task.id}-${task.sprintId || categoryName}-${taskIndex}`}>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-medium"
                                  style={{
                                    backgroundColor: categoryColors[categoryName],
                                    color: "white",
                                    borderColor: categoryColors[categoryName],
                                  }}
                                >
                                  {categoryName}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="max-w-[450px] truncate" title={task.name}>
                                  {task.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-center font-semibold">
                                  {task.totalStoryPoint || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {task.assignees.length > 0 ? (
                                    task.assignees.map((assignee, idx) => (
                                      <div
                                        key={idx}
                                        className="truncate text-sm text-gray-600"
                                        title={assignee.engineer.name}
                                      >
                                        {assignee.engineer.name}
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-400">
                                      No assignees
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to{" "}
                        {Math.min(endIndex, filteredTasks.length)} of{" "}
                        {filteredTasks.length}
                        {filter === "all"
                          ? " tasks"
                          : ` ${filter} tasks`}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}