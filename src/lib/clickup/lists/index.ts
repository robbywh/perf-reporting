import {
  CLICKUP_API_TOKEN,
  CLICKUP_BASE_URL,
  CLICKUP_FOLDER_ID,
} from "@/constants/server";

export async function getFolderList() {
  const url = `${CLICKUP_BASE_URL}/folder/${CLICKUP_FOLDER_ID}/list`;
  console.log("Fetching folder list from ClickUp:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN || "",
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
