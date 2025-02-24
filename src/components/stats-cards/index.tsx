import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "../ui/skeleton";

interface StatsData {
  averageOngoingDev: number;
  averageOngoingSupport: number;
  averageNonDevelopment: number;
  averageSupportApproved: number;
  averageDevApproved: number;
  averageMergedCount: number;
}

interface StatsCardsProps {
  data: StatsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const stats = [
    { title: "On Going Dev", value: `${data.averageOngoingDev} SP` },
    { title: "On Going Support", value: `${data.averageOngoingSupport} SP` },
    { title: "Non Dev Approved", value: `${data.averageNonDevelopment} SP` },
    { title: "Support Approved", value: `${data.averageSupportApproved} SP` },
    { title: "Dev Approved", value: `${data.averageDevApproved} SP` },
    { title: "MR Submitted", value: `${data.averageMergedCount}` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-md">
          <CardHeader className="flex items-start justify-between">
            <CardTitle>{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="shadow-md">
          <CardHeader className="flex items-start justify-between">
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
