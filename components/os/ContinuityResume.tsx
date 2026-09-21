import Link from "next/link";
import type { ResumeItem, ResumePackage } from "@/lib/continuity/model";

function ItemList({ items, empty }: { items: ResumeItem[]; empty: string }) {
  if (!items.length) return <p>{empty}</p>;
  return (
    <ul>
      {items.slice(0, 5).map((item) => (
        <li key={item.id}>
          <strong>{item.title}</strong> — {item.detail}
          <span className="os-badge" data-state={item.ownership === "owner" ? "degraded" : "available"}>{item.ownership}</span>
        </li>
      ))}
    </ul>
  );
}

export function ContinuityResume({ resume }: { resume: ResumePackage }) {
  return (
    <section className="os-card" aria-labelledby="resume-heading">
      <h2 id="resume-heading">Where was I</h2>
      <p className="widget-eyebrow">{resume.source === "checkpoint+derived" ? "Checkpoint plus live vault/GitHub" : "Derived from live vault and GitHub"}</p>
      <p><strong>{resume.whereWasI}</strong></p>
      <p>{resume.whatWasIDoing}</p>
      <p className="widget-eyebrow">Desired outcome</p>
      <p>{resume.desiredOutcome}</p>
      <p className="widget-eyebrow">What happened since</p>
      <ul>
        {resume.happenedSince.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="os-grid os-grid-2">
        <div>
          <h3>Needs you</h3>
          <ItemList items={resume.needsOwner} empty="Nothing currently requires your judgment." />
        </div>
        <div>
          <h3>Agents can continue</h3>
          <ItemList items={resume.agentCanContinue} empty="No agent-doable continuation is recorded." />
        </div>
      </div>
      <p className="widget-eyebrow">Next</p>
      <p>{resume.next.detail}</p>
      <div className="os-top-actions">
        <Link className="os-primary" href={resume.next.href}>
          {resume.next.ownership === "owner" ? "Handle the owner action" : "Continue without reconstructing"}
        </Link>
        {resume.focus ? <Link className="os-secondary" href={resume.focus.href}>Open {resume.focus.name}</Link> : null}
      </div>
    </section>
  );
}
