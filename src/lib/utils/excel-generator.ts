"use client";

import * as XLSX from "xlsx";

import { SprintDetailRow } from "@/actions/downloads";

export async function generateExcel(
  sprintData: { [sprintName: string]: SprintDetailRow[] },
  filename = "sprint-details.xlsx",
  sprintIds?: string[],
): Promise<void> {
  // Check if window is available (client-side only)
  if (typeof window === "undefined") {
    console.warn("Attempted to generate Excel on server side");
    return;
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create a list of sprint names
    let sprintNames = Object.keys(sprintData);

    // If sprintIds is provided, order the sprints according to the filter order
    if (sprintIds && sprintIds.length > 0) {
      // Get the sprint names in the order of sprintIds
      const orderedSprintNames: string[] = [];

      // Iterate through sprintIds and find matching sprint names
      for (const sprintId of sprintIds) {
        const matchingName = Object.keys(sprintData).find(
          (name) => name === sprintId || name.includes(sprintId),
        );
        if (matchingName) {
          orderedSprintNames.push(matchingName);
        }
      }

      // Add any remaining sprint names that weren't matched
      const remainingNames = sprintNames.filter(
        (name) => !orderedSprintNames.includes(name),
      );

      // Use the ordered sprint names if we found matches
      if (orderedSprintNames.length > 0) {
        sprintNames = [...orderedSprintNames, ...remainingNames];
      }
    }

    // Process each sprint sheet in the defined order
    for (let i = 0; i < sprintNames.length; i++) {
      const sprintName = sprintNames[i];
      const rows = sprintData[sprintName];

      // Skip if no rows
      if (!rows || rows.length === 0) {
        console.warn(`No data for sprint: ${sprintName}`);
        continue;
      }

      // Map the data to the requested column names
      const renamedRows = rows.map(async (row) => {
        // Map the data
        return {
          Name: row.name,
          Sprint: row.sprint,
          "Total Taken": row.totalTaken,
          "Development Approved": row.developmentApproved,
          "Support Approved": row.supportApproved,
          "Ongoing Development": row.ongoingDevelopment,
          "Ongoing Support": row.ongoingSupport,
          "Non Development": row.nonDevelopment,
          "Wakatime Hours": row.wakatimeHours,
          "Total Approved": row.totalApproved,
          "SP Completion": row.spCompletion,
          "MR Submitted": row.mrSubmitted,
          "MR Approved": row.mrApproved,
          "MR Rejected": row.mrRejected,
          "MR Rejection Ratio": row.rejectionRatio,
          "Tasks to QA": row.noTaskToQA,
          "Rejected Tasks": row.noOfTaskRejected,
          "QA Rejection Ratio": row.qaRejectionRatio,
        };
      });

      // Resolve all promises for the renamed rows
      const resolvedRenamedRows = await Promise.all(renamedRows);

      // Create worksheet with renamed data
      const worksheet = XLSX.utils.json_to_sheet(resolvedRenamedRows);

      // Set column widths for better readability
      const columnWidths: { [key: string]: number } = {
        A: 20, // Name
        B: 15, // Sprint
        C: 15, // Total Taken
        D: 20, // Development Approved
        E: 20, // Support Approved
        F: 20, // Ongoing Development
        G: 20, // Ongoing Support
        H: 20, // Non Development
        I: 15, // Wakatime Hours
        J: 15, // Total Approved
        K: 15, // SP Completion
        L: 15, // MR Submitted
        M: 15, // MR Approved
        N: 15, // MR Rejected
        O: 15, // MR Rejection Ratio
        P: 15, // Tasks to QA
        Q: 20, // Rejected Tasks
        R: 15, // QA Rejection Ratio
      };

      // Set column widths
      worksheet["!cols"] = Object.entries(columnWidths).map(([, width]) => ({
        wch: width,
      }));

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sprintName);
    }

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error("Error generating Excel:", error);
  }
}

export async function downloadSprintData(
  sprintData: { [sprintName: string]: SprintDetailRow[] },
  sprintIds?: string[],
): Promise<void> {
  try {
    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `sprint-details-${date}.xlsx`;

    // Generate and download Excel
    await generateExcel(sprintData, filename, sprintIds);
  } catch (error) {
    console.error("Error downloading sprint data:", error);
  }
}
