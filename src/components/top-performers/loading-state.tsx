"use client";
import { useState } from "react";

// Loading state provider for engineer navigation
export function useEngineerNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return { isLoading, startLoading, stopLoading };
}

// Loading indicator component
export function LoadingIndicator({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-4 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-sm text-gray-600">
            Loading engineer data...
          </span>
        </div>
      </div>
    </div>
  );
}
