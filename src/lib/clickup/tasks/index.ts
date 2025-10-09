export interface ClickUpTask {
  id: string;
  name: string;
  list: { id: string };
  status: { status: string };
  parent?: string | null;
  time_estimate?: number | null;
  custom_fields?: {
    name: string;
    value?: string[] | null;
    type_config?: {
      options?: Array<{
        id: string;
        name?: string;
        label?: string;
        color?: string;
        orderindex?: number;
      }>;
    };
  }[];
  tags?: { name: string }[];
  assignees?: { id: number; username: string }[];
}

export async function getListTasks(
  sprintId: string,
  apiToken: string,
  baseUrl: string,
  page: number = 0
) {
  const url = `${baseUrl}/list/${sprintId}/task?page=${page}&subtasks=true&include_closed=true`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ClickUp API Error: ${response.status} ${response.statusText}. Response: ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
