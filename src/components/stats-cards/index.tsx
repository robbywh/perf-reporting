import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  {
    title: "On Going Dev",
    value: "8 SP",
  },
  {
    title: "On Going Support",
    value: "2 SP",
  },
  {
    title: "Non Development",
    value: "4 SP",
  },
  {
    title: "Support Approved",
    value: "2 SP",
  },
  {
    title: "Dev Approved",
    value: "54 SP",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
