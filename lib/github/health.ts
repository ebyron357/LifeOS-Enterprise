import "server-only";

export type GitHubHealthData = {
  connected: boolean;
  openPullRequests: number;
  failedWorkflows: number;
  defaultBranch: string;
  lastWorkflow: string;
  updatedAt: string;
};

const repository = "ebyron357/LifeOS-Enterprise";
const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };

async function github<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers,
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getGitHubHealth(): Promise<GitHubHealthData> {
  try {
    const [repo, pulls, runs] = await Promise.all([
      github<{ default_branch: string; updated_at: string }>(""),
      github<Array<{ number: number }>>("/pulls?state=open&per_page=100"),
      github<{ workflow_runs: Array<{ conclusion: string | null; status: string }> }>("/actions/runs?per_page=20"),
    ]);
    const completed = runs.workflow_runs.filter((run) => run.status === "completed");
    return {
      connected: true,
      openPullRequests: pulls.length,
      failedWorkflows: completed.filter((run) => run.conclusion === "failure").length,
      defaultBranch: repo.default_branch,
      lastWorkflow: completed[0]?.conclusion ?? "pending",
      updatedAt: repo.updated_at,
    };
  } catch {
    return { connected: false, openPullRequests: 0, failedWorkflows: 0, defaultBranch: "main", lastWorkflow: "unavailable", updatedAt: "" };
  }
}
