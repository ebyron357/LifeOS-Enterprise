import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { getOsContext } from "@/lib/os/page-data";

export const dynamic = "force-dynamic";

const zones = [
  { key: "roots", label: "Roots & Identity", detail: "Heritage, service, values, legacy, and the parts of life that define the operating system.", href: "/journal", action: "Open journal / identity notes" },
  { key: "people", label: "Family & People", detail: "Keep the important people, relationships, responsibilities, and follow-ups close.", href: "/people", action: "Open people" },
  { key: "raven", label: "Raven", detail: "A dedicated personal lane for Raven-related notes, routines, resources, and reminders.", href: "/search", action: "Search Raven records" },
  { key: "health", label: "Health & Performance", detail: "Fitness, recovery, routines, focus, and the personal systems that keep execution sharp.", href: "/today", action: "Open today" },
  { key: "wealth", label: "Wealth & Growth", detail: "Revenue, growth, portfolio evidence, and the scoreboards that move the mission forward.", href: "/growth", action: "Open growth" },
  { key: "business", label: "Business Empire", detail: "Businesses, active builds, portfolio proof, and the work that creates leverage.", href: "/businesses", action: "Open businesses" },
  { key: "automation", label: "AI Workforce & Automation", detail: "Agents, automations, integrations, and delegated execution without losing control.", href: "/automations", action: "Open automations" },
  { key: "creative", label: "Creativity & Media", detail: "Ideas, content, design, prompts, and creative production lanes.", href: "/prompts", action: "Open creative intelligence" },
  { key: "learning", label: "Learning & Skills", detail: "Courses, certifications, research, and the next capability to compound.", href: "/learning", action: "Open learning" },
  { key: "soundtrack", label: "Soundtrack", detail: "Music belongs in the command center too. Connect a real media source here instead of faking playback.", href: "/integrations", action: "Open integrations" },
  { key: "systems", label: "Files, Intel & Memory", detail: "Search the vault, find evidence, inspect intelligence, and recover context fast.", href: "/files", action: "Open files" },
  { key: "mission", label: "Mission Control", detail: "Projects, today, blockers, next actions, and the work that needs you now.", href: "/projects", action: "Open projects" },
] as const;

export default async function LifeMapPage() {
  const os = await getOsContext();

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-life-map">
        <header className="os-life-map-hero">
          <div>
            <p className="widget-eyebrow">{os.dateLabel} · Personal operating system</p>
            <h1>Life Map</h1>
            <p>Everything that matters stays one tap away. Identity is not decoration here; it is navigation.</p>
          </div>
          <Link className="os-primary" href="/conversation">Ask LifeOS across everything</Link>
        </header>

        <section className="os-life-map-grid" aria-label="LifeOS personal operating zones">
          {zones.map((zone) => (
            <Link key={zone.key} href={zone.href} className="os-life-zone" data-zone={zone.key}>
              <span className="os-life-zone-kicker">{zone.label}</span>
              <strong>{zone.label}</strong>
              <p>{zone.detail}</p>
              <span className="os-life-zone-action">{zone.action} →</span>
            </Link>
          ))}
        </section>

        <section className="os-life-map-footer">
          <div>
            <span>Fast lane</span>
            <strong>Today → Projects → Ask LifeOS</strong>
          </div>
          <div>
            <span>Deep lane</span>
            <strong>Life Map → Files → Intelligence</strong>
          </div>
          <div>
            <span>Delegate lane</span>
            <strong>Agents → Automations → Integrations</strong>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
