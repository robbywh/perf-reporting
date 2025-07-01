"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { StatsTaskDetailsModal, TaskDetail } from "../stats-task-details-modal";
import { Skeleton } from "../ui/skeleton";

interface TaskDetailsGroup {
  ongoingDev: TaskDetail[];
  ongoingSupport: TaskDetail[];
  nonDevelopment: TaskDetail[];
  supportApproved: TaskDetail[];
  devApproved: TaskDetail[];
}

interface StatsData {
  averageOngoingDev: number;
  averageOngoingSupport: number;
  averageNonDevelopment: number;
  averageSupportApproved: number;
  averageDevApproved: number;
  averageMergedCount: number;
  taskDetails?: TaskDetailsGroup;
}

interface StatsCardsProps {
  data: StatsData;
  sprintCount?: number;
}

export function StatsCards({ data, sprintCount = 1 }: StatsCardsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<TaskDetail[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const handleCardClick = (category: keyof TaskDetailsGroup) => {
    if (data.taskDetails && data.taskDetails[category]?.length > 0) {
      setSelectedTasks(data.taskDetails[category]);
      setModalTitle(`${getCategoryTitle(category)} Tasks`);
      setModalOpen(true);
    }
  };

  const getCategoryTitle = (category: string): string => {
    switch (category) {
      case "ongoingDev":
        return "On Going Dev";
      case "ongoingSupport":
        return "On Going Support";
      case "nonDevelopment":
        return "Non Dev Approved";
      case "supportApproved":
        return "Support Approved";
      case "devApproved":
        return "Dev Approved";
      default:
        return category;
    }
  };

  const stats = [
    {
      title: "On Going Dev",
      value: `${data.averageOngoingDev} SP`,
      category: "ongoingDev",
      clickable: true,
    },
    {
      title: "On Going Support",
      value: `${data.averageOngoingSupport} SP`,
      category: "ongoingSupport",
      clickable: true,
    },
    {
      title: "Non Dev Approved",
      value: `${data.averageNonDevelopment} SP`,
      category: "nonDevelopment",
      clickable: true,
    },
    {
      title: "Support Approved",
      value: `${data.averageSupportApproved} SP`,
      category: "supportApproved",
      clickable: true,
    },
    {
      title: "Dev Approved",
      value: `${data.averageDevApproved} SP`,
      category: "devApproved",
      clickable: true,
    },
    {
      title: "MR Submitted",
      value: `${data.averageMergedCount}`,
      category: "mergedCount",
      clickable: false,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`shadow-md ${stat.clickable ? "cursor-pointer hover:bg-gray-50" : ""}`}
            onClick={() =>
              stat.clickable &&
              handleCardClick(stat.category as keyof TaskDetailsGroup)
            }
          >
            <CardHeader className="flex items-start justify-between">
              <CardTitle>{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.clickable && (
                <p className="mt-1 text-xs text-blue-600">Click for details</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <StatsTaskDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tasks={selectedTasks}
        title={modalTitle}
        sprintCount={sprintCount}
      />
    </>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="shadow-md">
          <CardHeader className="flex items-start justify-between">
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
