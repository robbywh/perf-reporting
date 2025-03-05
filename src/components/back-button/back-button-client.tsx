"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

interface BackButtonClientProps {
  children: ReactNode;
}

export function BackButtonClient({ children }: BackButtonClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleBack = () => {
    // If we're on the engineer page
    if (pathname.startsWith("/engineer/")) {
      // Preserve the sprint IDs when navigating back
      const sprintIds = searchParams.get("sprintIds");
      const query = sprintIds ? `?sprintIds=${sprintIds}` : "";
      router.push(`/${query}`);
    } else if (window.history.length > 2) {
      // If there's history, go back
      router.back();
    } else {
      // If no history, navigate to home
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
