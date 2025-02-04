"use client";

import { ChevronRight } from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const topPerformers = [
  {
    name: "Brian",
    email: "brian@email.com",
    points: "63 SP",
    avatar: "",
    fallback: "BA",
  },
  {
    name: "Aaron",
    email: "aaron@email.com",
    points: "50 SP",
    avatar: "",
    fallback: "AC",
  },
  {
    name: "Fatur",
    email: "fatur@email.com",
    points: "42 SP",
    avatar: "",
    fallback: "FY",
  },
  {
    name: "Gharis",
    email: "gharis@email.com",
    points: "40 SP",
    avatar: "",
    fallback: "GM",
  },
  {
    name: "Reinaldi",
    email: "reinaldi@email.com",
    points: "38 SP",
    avatar: "",
    fallback: "RM",
  },
  {
    name: "Adi",
    email: "adi@email.com",
    points: "30 SP",
    avatar: "",
    fallback: "AW",
  },
];

export function TopPerformers() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>Your sprint velocity 263</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPerformers.map((performer, index) => (
            <div
              key={index}
              className="flex cursor-pointer items-center justify-between rounded-md p-3 transition hover:bg-gray-100"
              onClick={() => alert(`Clicked on ${performer.name}`)}
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  {performer.avatar ? (
                    <AvatarImage src={performer.avatar} alt={performer.name} />
                  ) : (
                    <AvatarFallback>{performer.fallback}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{performer.name}</p>
                  <p className="text-xs text-gray-500">{performer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold">{performer.points}</p>
                <ChevronRight className="size-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
