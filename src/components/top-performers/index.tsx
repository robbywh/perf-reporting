import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Performer {
  id: number;
  name: string | undefined;
  email: string | null | undefined;
  storyPoints: number;
}

interface TopPerformersProps {
  performers: Performer[];
}

export function TopPerformers({ performers }: TopPerformersProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>
          Your team&apos;s story points total{" "}
          {performers.reduce((sum, p) => sum + p.storyPoints, 0)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performers.map((performer) => (
            <Link
              key={performer.id}
              href={`/engineer/${performer.id}`}
              className="block"
            >
              <div className="flex cursor-pointer items-center justify-between rounded-md p-3 transition hover:bg-gray-100">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {performer?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{performer.name}</p>
                    <p className="text-xs text-gray-500">{performer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold">
                    {performer.storyPoints} SP
                  </p>
                  <ChevronRight className="size-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
