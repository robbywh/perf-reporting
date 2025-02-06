import { PieDonutChart } from "@/components/charts/pie-donut-chart";

const chartData = [
  { status: "approved", value: 38, fill: "var(--color-approved)" },
  { status: "rejected", value: 1, fill: "var(--color-rejected)" },
]

const chartConfig = {
  value: {
    label: "Task",
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

export function PieDonutTaskChart() {
  return (
    <PieDonutChart
      title="Task"
      totalLabel="Task to QA"
      data={chartData}
      config={chartConfig}
    />
  )
}