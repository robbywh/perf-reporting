export async function getFolderList(
  apiToken: string,
  baseUrl: string,
  folderId: string
) {
  const url = `${baseUrl}/folder/${folderId}/list`;
  console.log("Fetching folder list from ClickUp:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: apiToken,
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
