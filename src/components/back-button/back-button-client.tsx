"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

interface BackButtonClientProps {
  children: ReactNode;
}

export function BackButtonClient({ children }: BackButtonClientProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
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
