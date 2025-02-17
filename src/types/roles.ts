export const ROLE = {
  SOFTWARE_ENGINEER: "se",
  ENGINEERING_MANAGER: "em",
  CTO: "cto",
  VP: "vp",
  PM: "pm",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];
