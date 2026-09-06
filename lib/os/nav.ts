export type OsNavItem = {
  href: string;
  label: string;
  intent: "do" | "decide" | "resume" | "review" | "capture" | "ask" | "more";
  description: string;
};

export const PRIMARY_NAV: OsNavItem[] = [
  { href: "/", label: "Home", intent: "decide", description: "See what needs you today." },
  { href: "/conversation", label: "Ask LifeOS", intent: "ask", description: "Talk or type. Approve before anything writes." },
  { href: "/projects", label: "Projects", intent: "resume", description: "Open a project workspace and resume work." },
  { href: "/today", label: "Today", intent: "do", description: "Today's mission, outcomes, and next action." },
  { href: "/inbox", label: "Capture", intent: "capture", description: "Park a note, task, idea, or reminder." },
  { href: "/journal", label: "Journal", intent: "capture", description: "Write today's journal entry." },
  { href: "/learning", label: "Learning", intent: "resume", description: "Continue or add something to learn." },
  { href: "/files", label: "Files", intent: "review", description: "Find notes and files without browsing folders first." },
  { href: "/automations", label: "Automations", intent: "review", description: "See n8n and approved automation status." },
  { href: "/integrations", label: "Integrations", intent: "review", description: "Honest connection health for every service." },
];

export const MOBILE_NAV: OsNavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  PRIMARY_NAV[2],
  PRIMARY_NAV[4],
  { href: "/more", label: "More", intent: "more", description: "Settings, vault browse, and advanced tools." },
];

const mobileHrefs = new Set(MOBILE_NAV.map((item) => item.href));

/** Primary destinations that do not fit on the mobile dock. */
export const MORE_PRIMARY_NAV = PRIMARY_NAV.filter((item) => !mobileHrefs.has(item.href));

export const ADVANCED_NAV: OsNavItem[] = [
  { href: "/dashboard", label: "Widget workspace", intent: "more", description: "Existing Command Center widgets and layout." },
  { href: "/daily-brief", label: "Daily Brief", intent: "review", description: "Structured daily operations brief." },
  { href: "/templates", label: "Templates", intent: "more", description: "Reusable note templates." },
  { href: "/settings", label: "Settings", intent: "more", description: "Owner preferences and write posture." },
  { href: "/search", label: "Search vault", intent: "review", description: "Full vault search." },
  { href: "/portfolio", label: "Portfolio", intent: "review", description: "Repository and project evidence." },
  { href: "/tasks", label: "Tasks (vault)", intent: "more", description: "Raw vault task notes." },
  { href: "/businesses", label: "Businesses", intent: "more", description: "Business records." },
  { href: "/people", label: "People", intent: "more", description: "People records." },
  { href: "/agents", label: "Agents", intent: "more", description: "Agent records." },
  { href: "/growth", label: "Growth", intent: "more", description: "Growth metrics." },
  { href: "/intelligence", label: "Intelligence", intent: "more", description: "Intelligence notes." },
  { href: "/reviews", label: "Reviews", intent: "more", description: "Review notes." },
  { href: "/sops", label: "SOPs", intent: "more", description: "Standard operating procedures." },
  { href: "/resources", label: "Resources", intent: "more", description: "Resource notes." },
  { href: "/archive", label: "Archive", intent: "more", description: "Archived notes." },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
