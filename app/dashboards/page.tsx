import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { getOsContext } from "@/lib/os/page-data";
import { noteHref } from "@/lib/vault/slug";

export const dynamic = "force-dynamic";

const dashboards = [
  {
    key: "personal",
    label: "Personal",
    detail: "Personal command view for priorities, life administration, routines, and what needs attention.",
    href: noteHref("00 Home/Personal Dashboard.md"),
    source: "Vault dashboard",
  },
  {
    key: "business",
    label: "Business",
    detail: "Revenue, leads, active business projects, follow-ups, tools, and operating decisions.",
    href: noteHref("00 Home/Business Dashboard.md"),
    source: "Vault dashboard",
  },
  {
    key: "leads",
    label: "Leads",
    detail: "Content-to-lead pipeline, prospecting, CRM handoff, follow-up, attribution, and qualified-conversation signals.",
    href: noteHref("00 Home/Content Services Dashboard.md"),
    source: "Lead-generation dashboard",
  },
  {
    key: "charlotte",
    label: "Charlotte Real Estate",
    detail: "Charlotte / Jasmine Parker project control: repo, production state, blockers, next action, and delivery evidence.",
    href: noteHref("Projects/Charlotte Real Estate System.md"),
    source: "Project control",
  },
  {
    key: "agents",
    label: "Agentic Work",
    detail: "AI workforce, agent execution, delegated work, approvals, and evidence-backed progress.",
    href: noteHref("00 Home/Agentic Work Dashboard.md"),
    source: "Vault dashboard",
  },
  {
    key: "growth",
    label: "Personal Growth",
    detail: "Learning, capability growth, habits, measurable progress, and the next skill to compound.",
    href: noteHref("00 Home/Personal Growth Dashboard.md"),
    source: "Vault dashboard",
  },
  {
    key: "weekly",
    label: "Weekly Review",
    detail: "A weekly operating review across progress, blockers, decisions, priorities, and follow-through.",
    href: noteHref("Dashboards/Weekly Review.md"),
    source: "Review dashboard",
  },
  {
    key: "monthly",
    label: "Monthly Review",
    detail: "Monthly scorecard for revenue, leads, savings, health, deep work, and trend direction.",
    href: noteHref("Dashboards/Monthly Review.md"),
    source: "Review dashboard",
  },
  {
    key: "widgets",
    label: "Widget Workspace",
    detail: "The live interactive command center with draggable widgets, GitHub health, project signals, and system telemetry.",
    href: "/dashboard",
    source: "Live app workspace",
  },
] as const;

export default async function DashboardsPage() {
  const os = await getOsContext();

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-life-map">
        <header className="os-life-map-hero">
          <div>
            <p className="widget-eyebrow">{os.dateLabel} · Dashboards</p>
            <h1>Your dashes.</h1>
            <p>One launch deck for personal, business, leads, Charlotte, agent work, growth, reviews, and the live widget workspace.</p>
          </div>
          <Link className="os-primary" href="/life-map">Back to Life Map</Link>
        </header>

        <section className="os-life-map-grid" aria-label="LifeOS dashboards">
          {dashboards.map((dashboard) => (
            <Link key={dashboard.key} href={dashboard.href} className="os-life-zone" data-zone={dashboard.key === "charlotte" ? "mission" : dashboard.key === "leads" ? "wealth" : dashboard.key === "business" ? "business" : dashboard.key === "agents" ? "automation" : "systems"}>
              <span className="os-life-zone-kicker">{dashboard.source}</span>
              <strong>{dashboard.label}</strong>
              <p>{dashboard.detail}</p>
              <span className="os-life-zone-action">Open dashboard →</span>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
