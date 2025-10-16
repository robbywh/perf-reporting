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
  name: string;
  storyPoint: number | null;
  totalStoryPoint: number;
  status: {
    id: string;
    name: string;
  } | null;
  project: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  sprint: {
    id: string;
    name: string;
  };
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

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectColors?: Record<string, string>;
  tasks: Task[];
}

export function ProjectsModal({
  isOpen,
  onClose,
  projectColors: propProjectColors,
  tasks,
}: ProjectsModalProps) {
  const [filter, setFilter] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique projects including OTHER for tasks without project
  // Only include projects that have story points > 0
  const projectStoryPoints = tasks.reduce((acc, task) => {
    const projectName = task.project?.name || "OTHER";
    acc[projectName] = (acc[projectName] || 0) + (task.totalStoryPoint || 0);
    return acc;
  }, {} as Record<string, number>);

  const projects = Array.from(
    new Set<string>(
      tasks
        .map((task) => task.project?.name || "OTHER")
        .filter((name): name is string => !!name && projectStoryPoints[name] > 0),
    ),
  ).sort();

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    const projectName = task.project?.name || "OTHER";

    // Only show tasks from projects with story points > 0
    if (projectStoryPoints[projectName] <= 0) {
      return false;
    }

    if (filter === "all") return true;
    if (filter === "OTHER") return !task.project?.name;
    return task.project?.name === filter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  // Group current page tasks by project for display
  const tasksByProject = currentTasks.reduce(
    (acc, task) => {
      const projectName = task.project?.name || "OTHER";
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(task);
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

  const getTaskCountByProject = (projectName: string) => {
    if (projectName === "OTHER") {
      return tasks.filter((task) => !task.project?.name).length;
    }
    return tasks.filter((task) => task.project?.name === projectName).length;
  };

  // Calculate total SP per sprint
  const sprintStoryPoints = tasks.reduce((acc, task) => {
    const sprintName = task.sprint?.name || "Unknown Sprint";
    acc[sprintName] = (acc[sprintName] || 0) + (task.totalStoryPoint || 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate SP per project within each sprint
  const sprintProjectStoryPoints = tasks.reduce((acc, task) => {
    const sprintName = task.sprint?.name || "Unknown Sprint";
    const projectName = task.project?.name || "OTHER";

    if (!acc[sprintName]) {
      acc[sprintName] = {};
    }

    acc[sprintName][projectName] = (acc[sprintName][projectName] || 0) + (task.totalStoryPoint || 0);
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Get unique sprints sorted by name
  const sprints = Object.keys(sprintStoryPoints).sort();

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

  // Use provided project colors from props, or database colors, or fallback to generated colors
  const projectColors = propProjectColors || projects.reduce((acc, projectName, index) => {
    // Find the first task with this project to get its color from database
    const taskWithProject = tasks.find(
      (task) => (task.project?.name || "OTHER") === projectName
    );
    const dbColor = taskWithProject?.project?.color;
    acc[projectName] = dbColor || generateColor(index);
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
            {filter === "all" ? "All Projects" : `${filter} Tasks`} (
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
                    <div>Total Projects: {projects.length}</div>
                    {filter !== "all" && (
                      <div className="text-blue-600">
                        Filtered - {filter}: {filteredTasks.length} tasks ({getTotalStoryPoints()} SP)
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Project Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    {projects.length > 0 ? (
                      projects.map((projectName) => {
                        const projectTasks = tasks.filter(
                          (task) => projectName === "OTHER"
                            ? !task.project?.name
                            : task.project?.name === projectName,
                        );
                        const projectStoryPoints = projectTasks.reduce(
                          (total, task) => total + (task.totalStoryPoint || 0),
                          0,
                        );
                        return (
                          <Badge
                            key={projectName}
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: projectColors[projectName],
                              color: "white",
                              borderColor: projectColors[projectName],
                            }}
                          >
                            {projectName}: {projectTasks.length}T / {projectStoryPoints}SP
                          </Badge>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No projects found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sprint Summary - Horizontal Layout */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold">Sprint Summary</h3>
                <div className="flex flex-wrap gap-4">
                  {sprints.length > 0 ? (
                    sprints.map((sprintName) => (
                      <div key={sprintName} className="min-w-[200px] flex-1 space-y-1 rounded border border-gray-200 bg-white p-3">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>{sprintName}:</span>
                          <span className="text-blue-600">{sprintStoryPoints[sprintName]} SP</span>
                        </div>
                        <div className="space-y-1 border-t border-gray-100 pt-2">
                          {Object.entries(sprintProjectStoryPoints[sprintName])
                            .sort(([, a], [, b]) => b - a)
                            .map(([projectName, sp]) => (
                              <div key={projectName} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: projectColors[projectName] }}
                                  />
                                  <span className="text-gray-600">{projectName}:</span>
                                </div>
                                <span className="font-medium text-gray-700">{sp} SP</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No sprints found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Project:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("all")}
                  >
                    All ({tasks.length})
                  </Button>
                  {projects.map((projectName) => (
                    <Button
                      key={projectName}
                      variant={filter === projectName ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange(projectName)}
                      style={filter === projectName ? {
                        backgroundColor: projectColors[projectName],
                        borderColor: projectColors[projectName],
                        color: "white",
                      } : {
                        borderColor: projectColors[projectName],
                        color: projectColors[projectName],
                      }}
                    >
                      {projectName} ({getTaskCountByProject(projectName)})
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
                    : `No tasks found in ${filter} project`}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Sprint</TableHead>
                        <TableHead className="w-[150px]">Project</TableHead>
                        <TableHead className="w-[350px]">Task Name</TableHead>
                        <TableHead className="w-[100px]">Total SP</TableHead>
                        <TableHead className="w-[200px]">Assignees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(tasksByProject)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([projectName, projectTasks]) =>
                          projectTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <div className="text-xs font-medium text-gray-700">
                                  {task.sprint?.name || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-medium"
                                  style={{
                                    backgroundColor: projectColors[projectName],
                                    color: "white",
                                    borderColor: projectColors[projectName],
                                  }}
                                >
                                  {projectName}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="max-w-[350px] truncate" title={task.name}>
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
