"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
  category: {
    id: string;
    name: string;
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

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryId: string | null;
  sprintIds: string[];
}

export function TaskDetailModal({
  isOpen,
  onClose,
  categoryName,
  categoryId,
  sprintIds,
}: TaskDetailModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!categoryId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/tasks/category?sprintIds=${sprintIds.join(",")}&categoryId=${categoryId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && categoryId && sprintIds.length > 0) {
      fetchTasks();
    }
  }, [isOpen, categoryId, sprintIds]);

  const getTotalStoryPoints = () => {
    return tasks.reduce((total, task) => {
      return total + (task.totalStoryPoint || 0);
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {categoryName || "OTHER"} Tasks ({tasks.length}) - Total SP: {getTotalStoryPoints()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No tasks found in this category
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[450px]">Task Name</TableHead>
                  <TableHead className="w-[120px]">Total SP</TableHead>
                  <TableHead className="w-[200px]">Assignees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
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
                          task.assignees.map((assignee, index) => (
                            <div
                              key={index}
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
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
