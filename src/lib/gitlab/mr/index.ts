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
  groupId: string
): Promise<GitLabMergeRequest[]> {
  let page = 1;
  const allMRs: GitLabMergeRequest[] = [];

  try {
    while (true) {
      const url = new URL(
        `${baseUrl}/groups/${groupId}/merge_requests`
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
        throw new Error(`GitLab API error: ${response.statusText}`);
      }

      const data: GitLabMergeRequest[] = await response.json();

      if (data.length === 0) {
        console.log(`✅ No more merged MRs. Stopping at page ${page}.`);
        break;
      }

      allMRs.push(...data);
      console.log(
        `🔄 Fetched page ${page}, total merged MRs: ${allMRs.length}`
      );

      page++;
    }
  } catch (error) {
    console.error(`❌ Error fetching merged MRs:`, error);
  }

  return allMRs;
}
