"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

interface BackButtonClientProps {
  children: ReactNode;
}

export function BackButtonClient({ children }: BackButtonClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    // Preserve all current query parameters
    const currentParams = searchParams.toString();

    // Always preserve query parameters when navigating back
    // Navigate to home with all query parameters preserved
    if (currentParams) {
      router.push(`/?${currentParams}`);
    } else {
      // If no query params, check if we can go back in browser history
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  // Using cloneElement to preserve the original button props while adding onClick
  return (
    <div onClick={handleBack} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
