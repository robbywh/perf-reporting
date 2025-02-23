import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
