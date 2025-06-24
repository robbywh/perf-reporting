"use server";

import { prisma } from "@/services/db";

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

  // Fetch all reviewers to match with engineers
  const reviewers = await prisma.reviewer.findMany();

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
      include: {
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

      // Calculate task statistics by category and status directly from task
      const developmentApproved = engineerTasks.filter(
        (task) =>
          task.category?.name?.toLowerCase().includes("development") &&
          task.status?.name?.toLowerCase().includes("approved")
      ).length;

      const supportApproved = engineerTasks.filter(
        (task) =>
          task.category?.name?.toLowerCase().includes("support") &&
          task.status?.name?.toLowerCase().includes("approved")
      ).length;

      const ongoingDevelopment = engineerTasks.filter(
        (task) =>
          task.category?.name?.toLowerCase().includes("development") &&
          task.status?.name?.toLowerCase().includes("ongoing")
      ).length;

      const ongoingSupport = engineerTasks.filter(
        (task) =>
          task.category?.name?.toLowerCase().includes("support") &&
          task.status?.name?.toLowerCase().includes("ongoing")
      ).length;

      const nonDevelopment = engineerTasks.filter(
        (task) =>
          task.category &&
          !task.category.name.toLowerCase().includes("development") &&
          !task.category.name.toLowerCase().includes("support")
      ).length;

      // Get reviewer data for this engineer by matching the reviewer to the engineer
      // First, look up the reviewer ID for this engineer's name
      const reviewerData = sprint.sprintReviewers.find((sr) => {
        // Match by reviewer name, assuming engineer name and reviewer name match
        // We need to look up the reviewer separately
        const reviewer = reviewers.find((r) => r.name === engineerName);
        return reviewer && sr.reviewerId === reviewer.id;
      });

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

      // Calculate QA rejection ratio from sprint reviewer data
      const noTaskToQA = reviewerData?.taskCount || 0;
      const noOfTaskRejected = reviewerData?.rejectedCount || 0;
      const qaRejectionRatio =
        noTaskToQA > 0
          ? ((noOfTaskRejected / noTaskToQA) * 100).toFixed(2) + "%"
          : "0%";

      // Create row for this engineer
      const row: SprintDetailRow = {
        name: engineerName,
        sprint: sprintName,
        totalTaken: target,
        developmentApproved,
        supportApproved,
        ongoingDevelopment,
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
