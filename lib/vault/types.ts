export type VaultSection =
  | "overview"
  | "projects"
  | "tasks"
  | "businesses"
  | "growth"
  | "intelligence"
  | "agents"
  | "resources"
  | "people"
  | "learning"
  | "journal"
  | "reviews"
  | "sops"
  | "templates"
  | "archive"
  | "search";

export type VaultLink = {
  raw: string;
  target: string;
  alias: string | null;
  heading: string | null;
  resolvedPath: string | null;
  external: boolean;
};

export type VaultTask = {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string | null;
  priority: string | null;
  sourcePath: string;
  sourceTitle: string;
  line: number;
  project: string | null;
  area: string | null;
  section: VaultSection;
};

export type VaultNote = {
  path: string;
  slug: string;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  tags: string[];
  owner: string | null;
  reviewDate: string | null;
  nextAction: string | null;
  blocker: string | null;
  waitingOn: string | null;
  business: string | null;
  area: string | null;
  goal: string | null;
  organization: string | null;
  role: string | null;
  relationship: string | null;
  lastContact: string | null;
  nextContact: string | null;
  created: string | null;
  updated: string | null;
  folder: string;
  section: VaultSection;
  legacy: boolean;
  excerpt: string;
  headings: Array<{ level: number; text: string; anchor: string }>;
  links: VaultLink[];
  embeds: VaultLink[];
  tasks: VaultTask[];
  body: string;
  frontmatter: Record<string, unknown>;
  modifiedAt: string | null;
};

export type VaultIndex = {
  builtAt: string;
  noteCount: number;
  notes: VaultNote[];
  byPath: Record<string, VaultNote>;
  bySlug: Record<string, VaultNote>;
  byType: Record<string, VaultNote[]>;
  byTag: Record<string, VaultNote[]>;
  byFolder: Record<string, VaultNote[]>;
  bySection: Record<VaultSection, VaultNote[]>;
  backlinks: Record<string, string[]>;
  basenameIndex: Record<string, string[]>;
  tasks: VaultTask[];
  errors: Array<{ path: string; message: string }>;
};

export type SearchFilters = {
  section?: VaultSection;
  type?: string;
  status?: string;
  tag?: string;
  business?: string;
};

export type SearchResult = {
  note: VaultNote;
  score: number;
  highlights: string[];
};
