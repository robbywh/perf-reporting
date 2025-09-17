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
    // Get current organization parameter to preserve it
    const currentOrg = searchParams.get("org");

    // Always navigate to home with organization parameter preserved
    // This ensures the organization context is maintained regardless of browser history
    if (currentOrg) {
      router.push(`/?org=${currentOrg}`);
    } else {
      // Check if we're in browser environment and there's browser history to go back to
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
