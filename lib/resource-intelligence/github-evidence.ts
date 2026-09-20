import { Buffer } from "node:buffer";
import { normalizeResource } from "./model";

export type GitHubEvidenceItem = {
  source: "repository" | "README.md" | "root" | "commits";
  claim: string;
  value: string;
};

export type GitHubRepositoryEvidence = {
  repository: string;
  canonicalSource: string;
  description: string | null;
  defaultBranch: string;
  archived: boolean;
  visibility: string;
  license: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string | null;
  pushedAt: string | null;
  latestCommitAt: string | null;
  latestCommitSha: string | null;
  rootFiles: string[];
  hasSecurityPolicy: boolean;
  hasArchitectureDocs: boolean;
  packageManifests: string[];
  readmeSignals: {
    explicitlyTemplate: boolean;
    mentionsFileBasedKnowledge: boolean;
    mentionsSandbox: boolean;
    mentionsSourceSync: boolean;
  };
  architectureSuggestion: "TEMPLATE" | null;
  dispositionSuggestion: "PENDING";
  evidence: GitHubEvidenceItem[];
};

type FetchLike = typeof fetch;

type RepoPayload = {
  full_name?: string;
  description?: string | null;
  default_branch?: string;
  archived?: boolean;
  visibility?: string;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  updated_at?: string;
  pushed_at?: string;
  license?: { spdx_id?: string | null; name?: string | null } | null;
};

type ReadmePayload = {
  content?: string;
  encoding?: string;
  path?: string;
};

type ContentItem = {
  name?: string;
  path?: string;
  type?: string;
};

type CommitPayload = {
  sha?: string;
  commit?: { committer?: { date?: string | null }; author?: { date?: string | null } };
};

function headers(token?: string) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function getJson<T>(fetcher: FetchLike, url: string, token?: string): Promise<T> {
  const response = await fetcher(url, { headers: headers(token), cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub evidence request failed (${response.status}) for ${url}.`);
  return response.json() as Promise<T>;
}

function readmeText(payload: ReadmePayload): string {
  if (!payload.content) return "";
  if (payload.encoding === "base64" || !payload.encoding) {
    try {
      return Buffer.from(payload.content.replace(/\s/g, ""), "base64").toString("utf8").slice(0, 40_000);
    } catch {
      return "";
    }
  }
  return payload.content.slice(0, 40_000);
}

function explicitTemplate(readme: string): boolean {
  const normalized = readme.slice(0, 12_000).toLowerCase();
  return (
    /\b(reusable\s+)?template\b/.test(normalized)
    || /\bstarter\s+(kit|template|project)\b/.test(normalized)
    || /\bboilerplate\b/.test(normalized)
  ) && (
    normalized.includes("fork")
    || normalized.includes("customize")
    || normalized.includes("clone")
    || normalized.includes("template")
  );
}

function rootNames(items: ContentItem[]): string[] {
  return items
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));
}

export async function inspectGitHubRepository(
  source: string,
  options: { fetcher?: FetchLike; token?: string } = {},
): Promise<GitHubRepositoryEvidence> {
  const resource = normalizeResource({ source });
  if (resource.sourceType !== "github" || !resource.sourceIdentity.startsWith("github:")) {
    throw new Error("GitHub repository inspection requires a GitHub repository URL.");
  }

  const repository = resource.sourceIdentity.slice("github:".length);
  const apiBase = `https://api.github.com/repos/${repository}`;
  const fetcher = options.fetcher ?? fetch;

  const repo = await getJson<RepoPayload>(fetcher, apiBase, options.token);
  const defaultBranch = repo.default_branch || "main";

  const [readmeResult, rootResult, commitsResult] = await Promise.allSettled([
    getJson<ReadmePayload>(fetcher, `${apiBase}/readme?ref=${encodeURIComponent(defaultBranch)}`, options.token),
    getJson<ContentItem[]>(fetcher, `${apiBase}/contents?ref=${encodeURIComponent(defaultBranch)}`, options.token),
    getJson<CommitPayload[]>(fetcher, `${apiBase}/commits?sha=${encodeURIComponent(defaultBranch)}&per_page=5`, options.token),
  ]);

  const readme = readmeResult.status === "fulfilled" ? readmeText(readmeResult.value) : "";
  const root = rootResult.status === "fulfilled" && Array.isArray(rootResult.value) ? rootResult.value : [];
  const commits = commitsResult.status === "fulfilled" && Array.isArray(commitsResult.value) ? commitsResult.value : [];
  const names = rootNames(root);
  const lowerNames = new Set(names.map((name) => name.toLowerCase()));
  const manifests = names.filter((name) =>
    ["package.json", "pyproject.toml", "requirements.txt", "go.mod", "cargo.toml", "gemfile", "composer.json"].includes(name.toLowerCase()),
  );

  const templateSignal = explicitTemplate(readme);
  const readmeLower = readme.toLowerCase();
  const latest = commits[0];
  const latestCommitAt = latest?.commit?.committer?.date || latest?.commit?.author?.date || null;
  const license = repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION"
    ? repo.license.spdx_id
    : repo.license?.name || null;

  const evidence: GitHubEvidenceItem[] = [
    { source: "repository", claim: "Canonical repository", value: repo.full_name || repository },
    { source: "repository", claim: "Default branch", value: defaultBranch },
    { source: "repository", claim: "Archived", value: String(Boolean(repo.archived)) },
    { source: "repository", claim: "Visibility", value: repo.visibility || "unknown" },
    { source: "repository", claim: "License", value: license || "not reported by repository metadata" },
    { source: "root", claim: "Root package manifests", value: manifests.join(", ") || "none detected" },
    { source: "root", claim: "Security policy present", value: String(lowerNames.has("security.md")) },
    { source: "commits", claim: "Latest inspected commit", value: latest?.sha ? `${latest.sha.slice(0, 12)} @ ${latestCommitAt || "unknown date"}` : "unavailable" },
  ];

  if (templateSignal) {
    evidence.push({
      source: "README.md",
      claim: "Template classification evidence",
      value: "README explicitly describes the repository as a template/starter and provides clone/fork/customization guidance.",
    });
  }

  return {
    repository: repo.full_name || repository,
    canonicalSource: resource.canonicalSource,
    description: repo.description ?? null,
    defaultBranch,
    archived: Boolean(repo.archived),
    visibility: repo.visibility || "unknown",
    license,
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    openIssues: Number(repo.open_issues_count || 0),
    updatedAt: repo.updated_at || null,
    pushedAt: repo.pushed_at || null,
    latestCommitAt,
    latestCommitSha: latest?.sha || null,
    rootFiles: names,
    hasSecurityPolicy: lowerNames.has("security.md"),
    hasArchitectureDocs: lowerNames.has("docs") || names.some((name) => /architecture/i.test(name)),
    packageManifests: manifests,
    readmeSignals: {
      explicitlyTemplate: templateSignal,
      mentionsFileBasedKnowledge: /file[- ]based|file[- ]system/.test(readmeLower) && /knowledge/.test(readmeLower),
      mentionsSandbox: /sandbox/.test(readmeLower),
      mentionsSourceSync: /source/.test(readmeLower) && /sync/.test(readmeLower),
    },
    architectureSuggestion: templateSignal ? "TEMPLATE" : null,
    dispositionSuggestion: "PENDING",
    evidence,
  };
}
