"use client"
import { BarChartMultiple } from "@/components/charts/bar-chart-multiple";
import { StatsCards } from "@/components/stats-cards";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>; // Show loading state while fetching user

  const firstName = user.firstName; // Get the first name
  return (
    <div>
      <div className="mb-4 text-lg font-bold">
        Hi, {firstName}! Focus on the features, we’ll handle the reporting.
      </div>
      <div className="mb-4">
        <StatsCards />
      </div> 
      <BarChartMultiple />
    </div>
  );
}
