interface GitLabMergeRequest {
  id: number;
  title: string;
  assignee: { id: number; username: string } | null;
  merged_at: string;
  state: string;
}

export async function getMergedMRsBySprintPeriod(
  startDate: string,
  endDate: string,
  baseUrl: string,
  accessToken: string,
  groupId: string,
): Promise<GitLabMergeRequest[]> {
  const allMRs: GitLabMergeRequest[] = [];

  // Handle multiple group IDs separated by comma
  const groupIds = groupId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  console.log(
    `🔄 Fetching merged MRs for ${groupIds.length} group(s): ${groupIds.join(", ")}`,
  );

  try {
    // Process each group ID
    for (const currentGroupId of groupIds) {
      console.log(`🔄 Processing group ID: ${currentGroupId}`);
      let page = 1;
      const groupMRs: GitLabMergeRequest[] = [];

      while (true) {
        const url = new URL(
          `${baseUrl}/groups/${currentGroupId}/merge_requests`,
        );
        url.searchParams.append("state", "merged");
        url.searchParams.append("updated_after", startDate);
        url.searchParams.append("updated_before", endDate);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("per_page", "100");

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ GitLab API Error for group ${currentGroupId}: ${response.status} ${response.statusText}. Response: ${errorText}`,
          );
          // Continue with next group instead of throwing
          break;
        }

        const data: GitLabMergeRequest[] = await response.json();

        if (data.length === 0) {
          console.log(
            `✅ No more merged MRs for group ${currentGroupId}. Stopping at page ${page}.`,
          );
          break;
        }

        groupMRs.push(...data);
        console.log(
          `🔄 Group ${currentGroupId}: Fetched page ${page}, group MRs: ${groupMRs.length}`,
        );

        page++;
      }

      console.log(
        `✅ Group ${currentGroupId}: Total merged MRs fetched: ${groupMRs.length}`,
      );
      allMRs.push(...groupMRs);
    }
  } catch (error) {
    console.error(`❌ Error fetching merged MRs:`, error);
  }

  console.log(`✅ Total merged MRs from all groups: ${allMRs.length}`);
  return allMRs;
}
