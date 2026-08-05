import type { VaultNote } from "@/lib/vault/types";
import type {
  PortfolioHealth,
  PortfolioPriority,
  PortfolioProject,
  PortfolioStatus,
  ProjectType,
  SyncStatus,
} from "./types";

const LEGACY_STATUS_TO_PORTFOLIO: Record<string, PortfolioStatus> = {
  inbox: "Inbox",
  planned: "Planned",
  draft: "Planned",
  design: "Planned",
  active: "Active",
  approved: "Active",
  decided: "Active",
  waiting: "Waiting",
  paused: "Waiting",
  blocked: "Blocked",
  review: "Review",
  complete: "Completed",
  archived: "Archived",
  cancelled: "Archived",
};

const PORTFOLIO_STATUS_VALUES = new Set<PortfolioStatus>([
  "Inbox",
  "Needs Review",
  "Needs Audit",
  "Planned",
  "Ready",
  "Active",
  "Waiting",
  "Blocked",
  "Review",
  "Completed",
  "Archived",
]);

const PRIORITY_TO_PORTFOLIO: Record<string, PortfolioPriority> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Someday",
};

const PORTFOLIO_HEALTH_VALUES = new Set<PortfolioHealth>(["On Track", "At Risk", "Blocked", "Unknown"]);
const SYNC_STATUS_VALUES = new Set<SyncStatus>(["Not Synced", "Synced", "Conflict", "Sync Error"]);
const PROJECT_TYPE_VALUES = new Set<ProjectType>([
  "Business",
  "Product",
  "Client",
  "Internal System",
  "Website",
  "Content",
  "Administrative",
  "Personal",
  "Other",
]);

/** Legacy `status` -> Portfolio Status, per architecture/METADATA_SCHEMA.md. */
export function toPortfolioStatus(legacyStatus: string | null | undefined, explicit?: unknown): PortfolioStatus {
  if (typeof explicit === "string" && PORTFOLIO_STATUS_VALUES.has(explicit as PortfolioStatus)) {
    return explicit as PortfolioStatus;
  }
  const key = (legacyStatus ?? "").trim().toLowerCase();
  if (!key) return "Needs Review";
  return LEGACY_STATUS_TO_PORTFOLIO[key] ?? "Needs Review";
}

/** `priority` (P0-P3) -> Portfolio Priority, per architecture/METADATA_SCHEMA.md. */
export function toPortfolioPriority(priority: string | null | undefined): PortfolioPriority {
  const key = (priority ?? "").trim().toUpperCase();
  return PRIORITY_TO_PORTFOLIO[key] ?? "Medium";
}

export function toPortfolioHealth(explicit: unknown): PortfolioHealth {
  if (typeof explicit === "string" && PORTFOLIO_HEALTH_VALUES.has(explicit as PortfolioHealth)) {
    return explicit as PortfolioHealth;
  }
  return "Unknown";
}

export function toSyncStatus(explicit: unknown): SyncStatus {
  if (typeof explicit === "string" && SYNC_STATUS_VALUES.has(explicit as SyncStatus)) {
    return explicit as SyncStatus;
  }
  return "Not Synced";
}

export function toProjectType(explicit: unknown, business: string | null): ProjectType {
  if (typeof explicit === "string" && PROJECT_TYPE_VALUES.has(explicit as ProjectType)) {
    return explicit as ProjectType;
  }
  if (business && business.trim()) return "Business";
  return "Other";
}

function stringField(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  return String(value).trim();
}

function listField(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const single = String(value).trim();
  return single ? [single] : [];
}

/**
 * Derives a stable project ID from an explicit frontmatter value, falling
 * back to a slug of the note's filename. Stable across re-runs because it
 * never depends on note order or content that can legitimately change
 * (status, next_action, etc.).
 */
export function deriveProjectId(note: Pick<VaultNote, "path" | "title" | "frontmatter">): string {
  const explicit = note.frontmatter?.project_id;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  const base = note.title || note.path.replace(/\.md$/i, "").split(/[\\/]/).pop() || note.path;
  return base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function outcomeFromBody(body: string): string {
  const match = body.match(/##\s*Outcome\s*\n+([\s\S]*?)(?=\n##\s|$)/i);
  if (!match) return "";
  const firstLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("#"));
  return firstLine ?? "";
}

const TEMPLATE_PATH_MARKERS = ["/templates/", "templates/", "99 templates/"];

/**
 * Matches a folder-index file by its actual filename on disk, never by its
 * rendered title. This matters because an index note's H1 heading (which
 * becomes VaultNote.title) can read as an ordinary-looking project name —
 * e.g. `10 Projects/README.md` renders with title "Projects" — while the
 * file itself is still just folder documentation, not a project record.
 * Deliberately does not special-case any specific title string.
 */
const INDEX_FILENAME_PATTERN = /^(readme|index|_index|start[_ ]?here)\.md$/i;

export function isIndexNote(path: string): boolean {
  const basename = path.split(/[\\/]/).pop() ?? path;
  return INDEX_FILENAME_PATTERN.test(basename);
}

export function isTrackableProjectNote(note: Pick<VaultNote, "path" | "title" | "type" | "section">): boolean {
  const lowerPath = note.path.toLowerCase();
  const isProject = note.type === "project" || note.section === "projects";
  const isTemplate = note.section === "templates" || TEMPLATE_PATH_MARKERS.some((marker) => lowerPath.includes(marker));
  const isIndex = isIndexNote(note.path);
  const hasPlaceholderTitle = /\{\{[^}]+\}\}/.test(note.title);
  return isProject && !isTemplate && !isIndex && !hasPlaceholderTitle;
}

/**
 * Builds one normalized PortfolioProject from a vault project note. Pure
 * function: no filesystem or network access, so it is fully unit-testable.
 * Only reads the Portfolio Extension fields defined in
 * architecture/METADATA_SCHEMA.md; never mutates the note.
 */
export function buildPortfolioProject(note: VaultNote): PortfolioProject {
  const fm = note.frontmatter ?? {};
  const projectId = deriveProjectId(note);
  const legacyStatus = note.status ?? "";
  const legacyPriority = note.priority ?? "";

  return {
    projectId,
    name: note.title,
    outcome: stringField(fm.outcome) || outcomeFromBody(note.body),
    projectType: toProjectType(fm.project_type, note.business),
    status: toPortfolioStatus(legacyStatus, fm.portfolio_status),
    legacyStatus,
    priority: toPortfolioPriority(legacyPriority),
    legacyPriority,
    health: toPortfolioHealth(fm.health),
    phase: stringField(fm.phase),
    nextAction: note.nextAction ?? "",
    blocker: note.blocker ?? "",
    waitingOn: note.waitingOn ?? "",
    dueDate: stringField(fm.due_date),
    reviewDate: note.reviewDate ?? "",
    lastVerified: stringField(fm.last_verified),
    humanOwner: note.owner ?? "",
    assignedAgentRecord: stringField(fm.assigned_agent),
    canonicalRepository: stringField(fm.canonical_repo),
    referenceRepositories: listField(fm.reference_repos),
    githubProjectItemId: stringField(fm.github_project_item_id),
    evidence: listField(fm.evidence),
    syncStatus: toSyncStatus(fm.sync_status),
    createdAt: note.created ?? "",
    updatedAt: note.updated ?? "",
    sourcePath: note.path,
  };
}

export function buildPortfolioFromNotes(notes: VaultNote[]): PortfolioProject[] {
  return notes.filter(isTrackableProjectNote).map(buildPortfolioProject);
}

/**
 * Rolls up staleness/attention signals without inventing data: a project is
 * "needs attention" only if it is blocked, waiting, or has a review date
 * that has already passed relative to `today`.
 */
export function needsAttention(project: PortfolioProject, today: string): boolean {
  if (project.status === "Blocked" || project.status === "Waiting") return true;
  if (project.reviewDate && project.reviewDate <= today) return true;
  return false;
}

export function isStale(project: PortfolioProject, today: string, staleDays = 14): boolean {
  if (!project.lastVerified) return true;
  const lastVerifiedDate = new Date(project.lastVerified);
  const todayDate = new Date(today);
  if (Number.isNaN(lastVerifiedDate.getTime()) || Number.isNaN(todayDate.getTime())) return true;
  const diffDays = (todayDate.getTime() - lastVerifiedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > staleDays;
}
