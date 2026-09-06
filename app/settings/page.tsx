import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { daypartGreeting } from "@/lib/os/greeting";

export default function SettingsPage() {
  return (
    <AppShell greeting={daypartGreeting()}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>Settings</h1>
          <p>Owner posture. Secrets stay on the server. This browser stores only local capture and journal drafts.</p>
        </header>
        <section className="os-card">
          <h2>Write and approval</h2>
          <p>External writes stay locked unless LIFEOS_WRITE_ENABLED=true, LIFEOS_WRITE_SECRET is set, durable approval storage is configured, and you approve the exact payload.</p>
          <p>Voice-session tokens cannot approve writes. The write secret is never stored in this browser.</p>
        </section>
        <section className="os-card">
          <h2>Where things live</h2>
          <ul>
            <li><Link href="/">Command Center</Link> — what needs you now</li>
            <li><Link href="/conversation">Ask LifeOS</Link> — talk, type, approve</li>
            <li><Link href="/inbox">Capture</Link> — park a thought</li>
            <li><Link href="/journal">Journal</Link> — today entry</li>
            <li><Link href="/integrations">Integrations</Link> — honest connection health</li>
            <li><Link href="/more">More</Link> — advanced and vault browse</li>
          </ul>
        </section>
        <section className="os-card">
          <h2>Advanced</h2>
          <p><Link href="/dashboard">Widget workspace</Link> keeps the previous interactive Command Center widgets.</p>
        </section>
      </div>
    </AppShell>
  );
}
