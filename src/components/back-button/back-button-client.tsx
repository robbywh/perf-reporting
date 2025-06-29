"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

interface BackButtonClientProps {
  children: ReactNode;
}

export function BackButtonClient({ children }: BackButtonClientProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      // Use browser history - this won't reload the page
      router.back();
    } else {
      // Fallback: navigate to home if no history exists
      router.push("/");
    }
  };

  // Using cloneElement to preserve the original button props while adding onClick
  return (
    <div onClick={handleBack} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
}
