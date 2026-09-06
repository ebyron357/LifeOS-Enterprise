import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { ADVANCED_NAV, MORE_PRIMARY_NAV } from "@/lib/os/nav";
import { daypartGreeting } from "@/lib/os/greeting";

export default function MorePage() {
  return (
    <AppShell greeting={daypartGreeting()}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>More</h1>
          <p>Advanced tools and vault browse. Use these after the Command Center, not instead of it.</p>
        </header>
        <nav className="os-more-grid" aria-label="More primary destinations">
          {MORE_PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="os-card">
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </nav>
        <h2>Advanced</h2>
        <nav className="os-more-grid" aria-label="Advanced destinations">
          {ADVANCED_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="os-card">
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </nav>
      </div>
    </AppShell>
  );
}
