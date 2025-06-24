"use client";

import { useSearchParams } from "next/navigation";

import { SprintDownloadButton } from "@/components/sprint-download-button";

export function SprintActions() {
  const searchParams = useSearchParams();
  const sprintIdsParam = searchParams.get("sprintIds");
  const sprintIds = sprintIdsParam ? sprintIdsParam.split(",") : [];

  return (
    <div className="flex items-center gap-2">
      <SprintDownloadButton sprintIds={sprintIds} />
    </div>
  );
}
