import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BackButtonClient } from "./back-button-client";

// Server Component
export function BackButton() {
  return (
    <BackButtonClient>
      <Button variant="outline" size="icon" asChild>
        <span>
          <ArrowLeft className="size-4" />
        </span>
      </Button>
    </BackButtonClient>
  );
}
