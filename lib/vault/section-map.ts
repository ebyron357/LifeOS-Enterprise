import type { VaultNote, VaultSection } from "./types";

const LEGACY_FOLDERS = new Set([
  "Projects",
  "Businesses",
  "AI",
  "Command Center",
  "Dashboards",
  "Inbox",
  "Knowledge",
  "Learning",
  "People",
  "Resources",
  "Reviews",
  "SOPs",
  "Tools",
  "URLs",
  "Automations",
  "templates",
]);

export function isLegacyPath(path: string): boolean {
  const top = path.split("/")[0];
  return LEGACY_FOLDERS.has(top);
}

export function mapNoteToSection(note: Pick<VaultNote, "path" | "type" | "status" | "frontmatter">): VaultSection {
  const path = note.path;
  const type = (note.type ?? "").toLowerCase();
  const status = (note.status ?? "").toLowerCase();
  const top = path.split("/")[0];

  if (status === "archived" || status === "complete" || top === "90 Archive") return "archive";
  if (type === "project" || top === "10 Projects" || top === "Projects") return "projects";
  if (type === "business" || top === "Businesses") return "businesses";
  if (type === "person" || top === "50 People" || top === "People") return "people";
  if (type === "sop" || top === "80 SOPs" || top === "SOPs") return "sops";
  if (top === "70 Journal" || type === "daily") return "journal";
  if (
    top === "60 Reviews" ||
    top === "Dashboards" ||
    top === "Reviews" ||
    type.includes("review") ||
    type === "growth-checkin"
  ) {
    return "reviews";
  }
  if (top === "99 Templates" || top === "templates") return "templates";
  if (type === "agent" || top === "AI" || path.startsWith(".github/agents/")) return "agents";
  if (top === "Learning" || type === "learning") return "learning";
  if (type === "area" || type === "goal" || path.includes("Personal Growth") || top === "20 Areas" || top === "30 Goals") {
    return "growth";
  }
  if (
    top === "40 Resources" ||
    top === "Knowledge" ||
    top === "Tools" ||
    top === "URLs" ||
    type === "resource" ||
    type === "decision" ||
    type === "content"
  ) {
    return "resources";
  }
  if (top === "Command Center" || top === "00 Home" || top === "Automations" || type === "dashboard") {
    return "intelligence";
  }
  if (top === "01 Inbox" || top === "Inbox") return "resources";
  return "resources";
}
