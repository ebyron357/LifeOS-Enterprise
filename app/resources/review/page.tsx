import Link from "next/link";
import { AppShell } from "@/components/os/AppShell";
import { ResourceReviewPanel } from "@/components/os/ResourceReviewPanel";
import { getOsContext } from "@/lib/os/page-data";
import {
  catalogResourceRecords,
  groupResourcesByLane,
  RESOURCE_LANES,
} from "@/lib/resource-intelligence/review";
import { getVaultIndex } from "@/lib/vault/index";
import { noteHref } from "@/lib/vault/slug";

export const dynamic = "force-dynamic";

export default async function ResourceReviewPage() {
  const [index, os] = await Promise.all([getVaultIndex(), getOsContext()]);
  const today = new Date().toISOString().slice(0, 10);
  const records = catalogResourceRecords(index.notes, today);
  const lanes = groupResourcesByLane(records);
  const due = records.filter((record) => record.reviewDue).length;

  return (
    <AppShell greeting={os.greeting}>
      <div className="os-grid">
        <header className="os-page-header">
          <p className="widget-eyebrow">Resource Intelligence</p>
          <h1>Resource review</h1>
          <p>
            {records.length
              ? `${records.length} canonical resource${records.length === 1 ? "" : "s"} · ${lanes.review.length} awaiting review · ${due} review${due === 1 ? "" : "s"} due`
              : "No canonical resources yet."}
          </p>
        </header>

        <section className="os-grid os-grid-2" aria-label="Resource lanes">
          {RESOURCE_LANES.map((lane) => (
            <article key={lane.id} className="os-card" aria-labelledby={`lane-${lane.id}`}>
              <h2 id={`lane-${lane.id}`}>
                {lane.label} <span className="os-badge">{lanes[lane.id].length}</span>
              </h2>
              <p className="widget-eyebrow">{lane.description}</p>
              {lanes[lane.id].length ? (
                <ul>
                  {lanes[lane.id].map((record) => (
                    <li key={record.path}>
                      <p>
                        <Link href={noteHref(record.path)}>{record.title}</Link>
                        {" "}
                        <span className="os-badge">{record.sourceType}</span>
                        {record.reviewDue ? <> <span className="os-badge" data-state="degraded">review due</span></> : null}
                      </p>
                      <p className="widget-eyebrow">
                        {record.architecture} / {record.disposition}
                        {record.captureCount > 1 ? ` · captured ${record.captureCount} times (exact duplicate merged)` : ""}
                        {record.reviewDate ? ` · review ${record.reviewDate.slice(0, 10)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : <p>Nothing here.</p>}
            </article>
          ))}
        </section>

        <ResourceReviewPanel
          records={records.map((record) => ({
            path: record.path,
            title: record.title,
            architecture: record.architecture,
            disposition: record.disposition,
          }))}
        />

        <p><Link href="/inbox">Capture a resource</Link> · <Link href="/resources">Resource library</Link> · <Link href="/">Back to Command Center</Link></p>
      </div>
    </AppShell>
  );
}
