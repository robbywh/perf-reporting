"use client";

import { Download, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

export function DownloadButton({
  onClick,
  disabled = false,
  className = "",
  isLoading = false,
}: DownloadButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      title="Download Sprint Data"
    >
      {isLoading ? (
        <Loader className="mr-2 size-4 animate-spin" />
      ) : (
        <Download className="mr-2 size-4" />
      )}
      Download
    </Button>
  );
}
