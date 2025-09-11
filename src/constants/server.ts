import "server-only";
import { getApiTokens } from "@/services/organizations";

export const CLICKUP_BASE_URL = process.env.CLICKUP_BASE_URL;
export const GITLAB_BASE_URL = process.env.GITLAB_BASE_URL;
export const CRON_SECRET = process.env.CRON_SECRET;
export const NODE_ENV = process.env.NODE_ENV;

export async function getApiConfig(organizationId: string) {
  const tokens = await getApiTokens(organizationId);
  
  return {
    CLICKUP_API_TOKEN: tokens.CLICKUP_API_TOKEN,
    CLICKUP_FOLDER_ID: tokens.CLICKUP_FOLDER_ID,
    GITLAB_GROUP_ID: tokens.GITLAB_GROUP_ID,
    GITLAB_PERSONAL_ACCESS_TOKEN: tokens.GITLAB_PERSONAL_ACCESS_TOKEN,
    CLICKUP_BASE_URL,
    GITLAB_BASE_URL,
  };
}
