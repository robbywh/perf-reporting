/**
 * Common types shared across components in the application
 */

// Sprint data structure
export interface SprintData {
  id: string;
  name: string;
  startDate?: Date | string;
  endDate?: Date | string;
  sprintEngineers?: {
    codingHours: number | null;
    codingHoursUrl: string | null;
  }[];
}

// Sprint option for dropdowns and selectors
export interface SprintOption {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

// Sprint group for preset options
export interface SprintOptionGroup {
  label: string;
  sprints: SprintOption[];
}

// Task details for charts and tables
export interface TaskDetails {
  id: string;
  name: string;
  status: string;
  storyPoint: number;
  engineer?: string;
  engineerId?: number;
  category?: string;
  url?: string;
}

// Task details grouped by category
export interface TaskDetailsGroup {
  ongoingDev: TaskDetails[];
  ongoingSupport: TaskDetails[];
  nonDevelopment: TaskDetails[];
  supportApproved: TaskDetails[];
  devApproved: TaskDetails[];
}

// Common file upload structure
export interface FileUpload {
  file: File;
  fileName: string;
  filePath: string;
}

/**
 * Constants for common values
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
