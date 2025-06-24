"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DownloadButton({
  onClick,
  disabled = false,
  className = "",
}: DownloadButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={className}
      title="Download Sprint Data"
    >
      <Download className="mr-2 size-4" />
      Download
    </Button>
  );
}
