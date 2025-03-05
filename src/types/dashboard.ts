export interface SprintData {
  sprintId: string;
  sprintName: string;
  totalStoryPoints: number;
  totalBaseline: number;
  totalTarget: number;
}

export interface SprintTrend {
  sprintId: string;
  sprintName: string;
  engineers: { id: number; name: string; storyPoints: number }[];
}

export interface TaskCategory {
  category: string;
  count: number;
}

export interface TaskQAData {
  approvedTasks: number;
  rejectedTasks: number;
}

export interface Engineer {
  id: number;
  name: string;
  email?: string | null;
}

export interface Performer {
  id: number;
  name: string | undefined;
  email: string | null | undefined;
  storyPoints: number;
}

export interface LeaveData {
  id?: number;
  engineerId?: number;
  description: string;
  date: string;
  type: "half_day_before_break" | "half_day_after_break" | "full_day";
}

export interface HolidayData {
  id?: number;
  description: string;
  date: string;
}

export interface SprintLeaveData {
  sprintName: string;
  startDate: string;
  endDate: string;
  leaves: LeaveData[];
  holidays: HolidayData[];
}

export interface DashboardData {
  topPerformersData: Performer[];
  sprintsCapacity: SprintData[];
  sprintData: SprintTrend[];
  taskCategoryData: TaskCategory[];
  taskQAData: TaskQAData;
  leavesAndHolidays: SprintLeaveData[];
  engineers: Engineer[];
  roleId: string;
}
