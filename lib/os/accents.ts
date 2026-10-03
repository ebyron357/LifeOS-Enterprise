/**
 * Life-area accent colors for the command-center shell.
 *
 * Each area keeps one color everywhere it appears (sidebar, launch tiles,
 * operating lanes, quick actions, mobile dock), so color works as a wayfinding
 * cue rather than decoration. This module only decides which accent a
 * destination uses; the color values live in
 * `components/os/LegendaryCommandCenter.module.css` (`[data-accent]` rules).
 */
export const ACCENTS = [
  "sky",
  "blue",
  "cyan",
  "teal",
  "mint",
  "lime",
  "gold",
  "amber",
  "coral",
  "rose",
  "orchid",
  "violet",
  "periwinkle",
  "slate",
] as const;

export type Accent = (typeof ACCENTS)[number];

/** Keyed by the concept each route carries in the shell sidebar (for example `/dashboard` is Finance). */
const ACCENT_BY_ROUTE: Record<string, Accent> = {
  "/": "sky",
  "/life-map": "gold",
  "/agents": "violet",
  "/conversation": "rose",
  "/today": "mint",
  "/projects": "blue",
  "/businesses": "amber",
  "/portfolio": "cyan",
  "/growth": "rose",
  "/resources": "coral",
  "/dashboard": "lime",
  "/dashboards": "orchid",
  "/search": "periwinkle",
  "/learning": "teal",
  "/files": "sky",
  "/integrations": "slate",
  "/more": "slate",
  "/settings": "slate",
  "/automations": "orchid",
  "/inbox": "gold",
  "/journal": "orchid",
  "/prompts": "violet",
  "/people": "rose",
  "/daily-brief": "gold",
};

/** Accent for a destination: exact route first, then its top-level section, then neutral slate. */
export function accentFor(href: string): Accent {
  const path = href.split(/[?#]/)[0] || "/";
  const exact = ACCENT_BY_ROUTE[path];
  if (exact) return exact;
  const section = `/${path.split("/")[1] ?? ""}`;
  return ACCENT_BY_ROUTE[section] ?? "slate";
}

/** Accents used for named records (projects, agents) so a record keeps the same color across panels. */
const RECORD_ACCENTS: readonly Accent[] = ["blue", "violet", "coral", "gold", "mint", "rose", "cyan", "orchid", "amber", "teal"];

/** Stable accent for a record name: the same name always gets the same color. */
export function accentForName(name: string): Accent {
  let hash = 5381;
  for (const char of name.trim().toLowerCase()) {
    hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  }
  return RECORD_ACCENTS[hash % RECORD_ACCENTS.length];
}
