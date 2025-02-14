import {
  CLICKUP_API_TOKEN,
  CLICKUP_BASE_URL,
} from "@/constants/server.constant";

export interface ClickUpTask {
  id: string;
  name: string;
  list: { id: string };
  status: { id: string };
  parent?: string | null;
  time_estimate?: number | null;
  custom_fields?: { name: string; value?: string[] | null }[];
}

export async function getListTasks(sprintId: string, page: number = 0) {
  const url = `${CLICKUP_BASE_URL}/list/${sprintId}/task?page=${page}&subtasks=true&include_closed=true`;
  console.log("Fetching tasks from ClickUp list:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
