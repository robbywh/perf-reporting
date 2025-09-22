"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getSprintDetailsForDownload } from "@/actions/downloads";
import { DownloadButton } from "@/components/download-button";
import { downloadSprintData } from "@/lib/utils/excel-generator";

interface SprintDownloadButtonProps {
  sprintIds: string[];
  className?: string;
}

export function SprintDownloadButton({
  sprintIds,
  className = "",
}: SprintDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!sprintIds.length || isLoading) return;

    try {
      setIsLoading(true);

      // Fetch data from server
      const sprintData = await getSprintDetailsForDownload(sprintIds);

      // Check if we have data
      const hasData = Object.values(sprintData).some(
        (arr) => arr && arr.length > 0,
      );

      if (!hasData) {
        toast.error("No data available for the selected sprints");
        return;
      }

      // Generate and download Excel - pass the sprintIds to maintain order
      await downloadSprintData(sprintData, sprintIds);
      toast.success("Sprint data downloaded successfully");
    } catch (error) {
      console.error("Error downloading sprint data:", error);
      toast.error("Failed to download sprint data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DownloadButton
      onClick={handleDownload}
      disabled={!sprintIds.length}
      isLoading={isLoading}
      className={className}
    />
  );
}
