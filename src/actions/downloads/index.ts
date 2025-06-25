"use server";

import { APPROVED_STATUS_IDS } from "@/constants/client";
import { prisma } from "@/services/db";
import { findTotalTaskToQACounts } from "@/services/tasks";

export interface SprintDetailRow {
  name: string;
  sprint: string;
  totalTaken: number;
  developmentApproved: number;
  supportApproved: number;
  ongoingDevelopment: number;
  ongoingSupport: number;
  nonDevelopment: number;
  wakatimeHours: number;
  totalApproved: number;
  spCompletion: number | string;
  mrSubmitted: number;
  mrApproved: number;
  mrRejected: number;
  rejectionRatio: string;
  noTaskToQA: number;
  noOfTaskRejected: number;
  qaRejectionRatio: string;
}

export async function getSprintDetailsForDownload(
  sprintIds: string[]
): Promise<{
  [sprintName: string]: SprintDetailRow[];
}> {
  if (!sprintIds.length) return {};

  // Fetch sprints with engineers and reviewers
  const sprints = await prisma.sprint.findMany({
    where: {
      id: { in: sprintIds },
    },
    select: {
      id: true,
      name: true,
      sprintEngineers: {
        include: {
          engineer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      sprintReviewers: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!sprints.length) return {};

  // Create a map to organize data by sprint
  const sprintDataMap: { [sprintName: string]: SprintDetailRow[] } = {};

  // Order sprints based on the input sprintIds to preserve the filter order
  const orderedSprints = sprintIds
    .map((id) => sprints.find((sprint) => sprint.id === id))
    .filter(Boolean) as typeof sprints;

  // Process each sprint in the specified order
  for (const sprint of orderedSprints) {
    const sprintName = sprint.name;
    sprintDataMap[sprintName] = [];

    // Fetch tasks for this sprint with their details
    const tasks = await prisma.task.findMany({
      where: {
        sprintId: sprint.id,
      },
      select: {
        id: true,
        name: true,
        statusId: true,
        storyPoint: true,
        category: true,
        status: true,
        assignees: {
          include: {
            engineer: true,
          },
        },
      },
    });

    // Process each engineer in the sprint
    for (const sprintEngineer of sprint.sprintEngineers) {
      const engineerId = sprintEngineer.engineer.id;
      const engineerName = sprintEngineer.engineer.name;

      // Filter tasks for this engineer
      const engineerTasks = tasks.filter((task) =>
        task.assignees.some((ta) => ta.engineerId === engineerId)
      );

      // Calculate task statistics using the exact same logic as findAverageSPAndMergedCountBySprintIds
      // Define category mappings for story point sum per category
      const categoryCounts: Record<string, number> = {
        ongoingDev: 0,
        ongoingSupport: 0,
        nonDevelopment: 0,
        supportApproved: 0,
        devApproved: 0,
        ongoingNonDev: 0,
      };

      // Fetch task tags
      const taskTags = await prisma.taskTag.findMany({
        where: {
          taskId: { in: engineerTasks.map((task) => task.id) },
          sprintId: sprint.id,
        },
        include: {
          tag: {
            select: { id: true },
          },
        },
      });

      // Create a map of task IDs to their tags for efficient lookup
      const taskTagsMap: Record<string, string[]> = {};
      taskTags.forEach((tt) => {
        if (!taskTagsMap[tt.taskId]) {
          taskTagsMap[tt.taskId] = [];
        }
        taskTagsMap[tt.taskId].push(tt.tag.id);
      });

      // Process each task exactly like in findAverageSPAndMergedCountBySprintIds
      engineerTasks.forEach((task) => {
        const sp = Number(task.storyPoint) || 0;
        const tags = taskTagsMap[task.id] || [];
        const isSupport = tags.includes("support");
        const isNonDev = tags.includes("nodev");
        const isApproved = APPROVED_STATUS_IDS.includes(task.statusId || "");

        const category = isApproved
          ? isSupport
            ? "supportApproved"
            : isNonDev
              ? "nonDevelopment"
              : "devApproved"
          : isSupport
            ? "ongoingSupport"
            : isNonDev
              ? "ongoingNonDev"
              : "ongoingDev";

        categoryCounts[category] += sp; // Sum story points instead of counting tasks
      });

      // Map the category counts to individual variables
      const devApproved = categoryCounts.devApproved;
      const supportApproved = categoryCounts.supportApproved;
      const ongoingDev = categoryCounts.ongoingDev;
      const ongoingSupport = categoryCounts.ongoingSupport;
      const nonDevelopment =
        categoryCounts.nonDevelopment + categoryCounts.ongoingNonDev;

      // Calculate SP Completion
      const target = Number(sprintEngineer.target || 0);
      const storyPoints = Number(sprintEngineer.storyPoints || 0);

      const spCompletion = target > 0 ? (storyPoints / target) * 100 : 0;
      // Format as percentage string with % symbol
      const formattedSpCompletion =
        spCompletion % 1 !== 0
          ? spCompletion.toFixed(2) + "%"
          : Math.round(spCompletion) + "%";

      // Calculate MR rejection ratio
      const mrSubmitted = Number(sprintEngineer.mergedCount || 0);
      const mrApproved = mrSubmitted; // Same as submitted per requirement
      const mrRejected = 0; // Assuming 0 as per requirement
      const mrRejectionRatio = "0%"; // Assuming 0% as per requirement

      // Calculate QA rejection ratio using findTotalTaskToQACounts function
      // For each engineer, get their reviewer tasks for QA calculation

      let approvedQATasks = 0;
      let rejectedQATasks = 0;

      if (engineerId) {
        // Use the findTotalTaskToQACounts function to get QA task counts
        const qaTaskCounts = await findTotalTaskToQACounts(
          [sprint.id],
          engineerId
        );
        approvedQATasks = qaTaskCounts.approvedTasks;
        rejectedQATasks = qaTaskCounts.rejectedTasks;
      }

      const noTaskToQA = approvedQATasks + rejectedQATasks;
      const noOfTaskRejected = rejectedQATasks;

      const qaRejectionRatio =
        noOfTaskRejected > 0
          ? ((noOfTaskRejected / noTaskToQA) * 100).toFixed(2) + "%"
          : "0%";

      // Create row for this engineer
      const row: SprintDetailRow = {
        name: engineerName,
        sprint: sprintName,
        totalTaken: target,
        developmentApproved: devApproved,
        supportApproved,
        ongoingDevelopment: ongoingDev,
        ongoingSupport,
        nonDevelopment,
        wakatimeHours: Number(sprintEngineer.codingHours || 0),
        totalApproved: storyPoints,
        spCompletion: formattedSpCompletion,
        mrSubmitted,
        mrApproved,
        mrRejected,
        rejectionRatio: mrRejectionRatio,
        noTaskToQA,
        noOfTaskRejected,
        qaRejectionRatio,
      };

      sprintDataMap[sprintName].push(row);
    }
  }

  return sprintDataMap;
}
