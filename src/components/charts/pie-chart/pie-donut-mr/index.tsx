import { PieDonutChart } from "@/components/charts/pie-donut-chart";

const chartData = [
  { status: "approved", value: 14, fill: "var(--color-approved)" },
  { status: "rejected", value: 2, fill: "var(--color-rejected)" },
]

const chartConfig = {
  value: {
    label: "Merge Request",
  },
  approved: {
    label: "Approved",
    color: "hsl(var(--chart-2))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--chart-1))",
  }
}

export function PieDonutMrChart() {
  return (
    <PieDonutChart 
      title="Merge Request"
      totalLabel="MR Submitted"
      data={chartData}
      config={chartConfig}
    />
  )
}