import { findAllEngineers } from "@/services/engineers";
import { findAveragesByEngineerAndSprintIds } from "@/services/sprint-engineers";
import {
  findSprintsBySprintIds,
  findSprintsWithLeavesAndHolidays,
} from "@/services/sprints";
import {
  findAverageSPAndMergedCountBySprintIds,
  findTotalTaskToQACounts,
  findDetailedTaskToQACounts,
} from "@/services/tasks";

export interface PageProps {
  params: Promise<{ engineerId?: string }>;
  searchParams: Promise<{ sprintIds?: string; org?: string }>;
}

export interface StatsCardsProps {
  data: Awaited<ReturnType<typeof findAverageSPAndMergedCountBySprintIds>>;
}

export interface PieDonutTaskChartProps {
  data: Awaited<ReturnType<typeof findTotalTaskToQACounts>>;
}

export interface BarChartMultipleProps {
  data: Awaited<ReturnType<typeof findAveragesByEngineerAndSprintIds>>;
}

export interface CodingHoursFormProps {
  sprints: Awaited<ReturnType<typeof findSprintsBySprintIds>>;
  engineerId: number;
  roleId: string;
}

export interface LeavePublicHolidayProps {
  sprints: Awaited<ReturnType<typeof findSprintsWithLeavesAndHolidays>>;
  engineers: Awaited<ReturnType<typeof findAllEngineers>>;
  roleId: string;
}

export interface PageData {
  statsData: Awaited<ReturnType<typeof findAverageSPAndMergedCountBySprintIds>>;
  taskData: Awaited<ReturnType<typeof findTotalTaskToQACounts>>;
  detailedTaskData: Awaited<ReturnType<typeof findDetailedTaskToQACounts>>;
  averagesData: Awaited<ReturnType<typeof findAveragesByEngineerAndSprintIds>>;
  sprintsForCodingHours: Awaited<ReturnType<typeof findSprintsBySprintIds>>;
  sprintsWithLeaves: Awaited<
    ReturnType<typeof findSprintsWithLeavesAndHolidays>
  >;
  engineers: Awaited<ReturnType<typeof findAllEngineers>>;
  roleId: string;
}
