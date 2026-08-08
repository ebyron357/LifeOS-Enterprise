"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { PortfolioProject } from "@/lib/portfolio/types";
import { generateDailyBrief } from "@/lib/daily-brief/generate-brief";
import { buildEndOfDayReview } from "@/lib/daily-brief/build-end-of-day-review";
import {
  addBriefRevision,
  approveBrief,
  approveSchedule,
  approveWorkOrder,
  completeEndOfDayReview,
  deferOutcome,
  editMission,
  getAllDatesDescending,
  getLatestRevision,
  getMostRecentApprovedBrief,
  markOutcomeComplete,
  regenerateAfterApproval,
  rejectSchedule,
  rejectWorkOrder,
  startEndOfDayReview,
} from "@/lib/daily-brief/store";
import { useDailyBriefStore } from "@/lib/daily-brief/use-daily-brief-store";
import type { DailyOperationsBrief } from "@/lib/daily-brief/types";
import styles from "./DailyOperationsBriefApp.module.css";

type Props = {
  projects: PortfolioProject[];
  generatedAtIso: string;
};

function useNow(generatedAtIso: string) {
  return useMemo(() => new Date(generatedAtIso), [generatedAtIso]);
}

export function DailyOperationsBriefApp({ projects, generatedAtIso }: Props) {
  const now = useNow(generatedAtIso);
  const today = now.toISOString().slice(0, 10);
  const [store, setStore] = useDailyBriefStore();
  const [selectedDate, setSelectedDate] = useState(today);
  const [evidenceOpen, setEvidenceOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const existing = getLatestRevision(store, today);
    if (existing) return;
    const previousBrief = getMostRecentApprovedBrief(store, today);
    const brief = generateDailyBrief({ projects, now, previousBrief, existingRevisions: store.revisionsByDate[today] });
    setStore(addBriefRevision(store, brief));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brief = getLatestRevision(store, selectedDate);
  const dates = getAllDatesDescending(store);
  const nowIso = () => new Date().toISOString();

  function regenerate() {
    const currentRevisions = store.revisionsByDate[today] ?? [];
    const previousBrief = getMostRecentApprovedBrief(store, today);
    const nextDraft = generateDailyBrief({ projects, now: new Date(), previousBrief, existingRevisions: currentRevisions });
    const latest = getLatestRevision(store, today);
    if (latest && (latest.state === "Approved" || latest.state === "Active" || latest.state === "Completed")) {
      setStore(regenerateAfterApproval(store, today, nextDraft));
    } else {
      setStore({ ...store, revisionsByDate: { ...store.revisionsByDate, [today]: [...currentRevisions.slice(0, -1), nextDraft] } });
    }
    setSelectedDate(today);
  }

  function approve() {
    if (!confirm("Approve this Daily Operations Brief? Approved briefs cannot be silently overwritten.")) return;
    setStore(approveBrief(store, selectedDate, nowIso()));
  }

  function startReview() {
    if (!brief) return;
    const review = buildEndOfDayReview(brief, projects, new Date());
    setStore(startEndOfDayReview(store, selectedDate, review));
  }

  function completeReview() {
    if (!confirm("Complete the end-of-day review? This will influence tomorrow's brief.")) return;
    setStore(completeEndOfDayReview(store, selectedDate, nowIso()));
  }

  function toggleEvidence(id: string) {
    setEvidenceOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function editTodaysMission() {
    if (!brief) return;
    const next = window.prompt("Edit Today's Mission", brief.todaysMission);
    if (next == null || !next.trim() || next === brief.todaysMission) return;
    setStore(editMission(store, selectedDate, next.trim(), nowIso()));
  }

  if (!brief) {
    return <p className="portal-empty" role="status">Loading today&rsquo;s Daily Operations Brief…</p>;
  }

  const review = store.endOfDayReviewsByDate[selectedDate];
  const isToday = selectedDate === today;

  return (
    <div className={styles.stack} data-brief-state={brief.state}>
      <section aria-label="Controls" className={styles.controls}>
        <button type="button" onClick={regenerate}>Regenerate draft</button>
        <button type="button" onClick={approve} disabled={brief.state !== "Draft" && brief.state !== "Awaiting Review"}>Approve brief</button>
        {isToday && brief.completionState !== "Completed" ? (
          brief.endOfDayReviewId ? (
            <button type="button" onClick={completeReview}>Complete end-of-day review</button>
          ) : (
            <button type="button" onClick={startReview} disabled={brief.state !== "Approved" && brief.state !== "Active"}>Start end-of-day review</button>
          )
        ) : null}
      </section>

      {dates.length > 1 ? (
        <nav aria-label="Previous briefs" className={styles.previousNav}>
          <span>Previous briefs:</span>
          {dates.map((date) => (
            <button key={date} type="button" onClick={() => setSelectedDate(date)} aria-current={date === selectedDate} className={date === selectedDate ? styles.activeDate : undefined}>
              {date}
            </button>
          ))}
        </nav>
      ) : null}

      <section aria-label="Today's Mission" className={styles.mission}>
        <p className="widget-eyebrow">Today&rsquo;s Mission · {brief.state} · revision {brief.revision}</p>
        <h2>{brief.todaysMission}</h2>
        <button type="button" onClick={editTodaysMission}>Edit mission</button>
        {!brief.calendar.connected ? (
          <p className={styles.calendarNote} role="note">{brief.calendar.reason}</p>
        ) : null}
      </section>

      <section aria-label="Start Here">
        <h3 className={styles.sectionTitle}>Start Here</h3>
        {brief.startHere ? (
          <p className={styles.startHere}>
            <strong>{brief.startHere.verbPhrase}</strong> {brief.startHere.object}
          </p>
        ) : (
          <p className="portal-empty">No immediately actionable, unblocked step is available right now.</p>
        )}
      </section>

      <section aria-label="Top outcomes">
        <h3 className={styles.sectionTitle}>Top outcomes ({brief.topOutcomes.length} of 3 max)</h3>
        {brief.topOutcomes.length ? (
          <div className={styles.outcomeGrid}>
            {brief.topOutcomes.map((outcome) => (
              <article key={outcome.outcomeId} className={styles.outcomeCard}>
                <header>
                  <strong>{outcome.projectName}</strong>
                  <span className={styles.badge}>{outcome.priority}</span>
                </header>
                <p>{outcome.desiredResult}</p>
                <p className={styles.reason}>{outcome.reasonItMattersToday}</p>
                <dl className={styles.outcomeMeta}>
                  <dt>Status</dt><dd>{outcome.portfolioStatus}</dd>
                  <dt>Health</dt><dd>{outcome.health}</dd>
                  <dt>Owner</dt><dd>{outcome.ownerType}</dd>
                  <dt>Confidence</dt><dd>{outcome.confidence}</dd>
                  {outcome.deadlineOrDependency ? (<><dt>Deadline/dependency</dt><dd>{outcome.deadlineOrDependency}</dd></>) : null}
                </dl>
                <button type="button" onClick={() => toggleEvidence(outcome.outcomeId)} aria-expanded={Boolean(evidenceOpen[outcome.outcomeId])}>
                  {evidenceOpen[outcome.outcomeId] ? "Hide evidence" : "View evidence"}
                </button>
                {evidenceOpen[outcome.outcomeId] ? (
                  <ul className={styles.evidenceList}>
                    {outcome.evidence.length ? outcome.evidence.map((item) => <li key={item}>{item}</li>) : <li>No evidence recorded.</li>}
                  </ul>
                ) : null}
                <div className={styles.outcomeActions}>
                  <button type="button" onClick={() => setStore(markOutcomeComplete(store, selectedDate, outcome.outcomeId, nowIso()))} disabled={outcome.completed}>
                    Mark complete
                  </button>
                  <button type="button" onClick={() => setStore(deferOutcome(store, selectedDate, outcome.outcomeId, nowIso()))} disabled={outcome.deferred}>
                    Defer
                  </button>
                  {outcome.sourceLinks[0] ? <Link href={noteHref(outcome.sourceLinks[0])}>Open project</Link> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="portal-empty">No project currently qualifies as an unblocked top outcome.</p>
        )}
      </section>

      <section aria-label="Proposed schedule">
        <h3 className={styles.sectionTitle}>Proposed schedule · Suggest Only</h3>
        <p className={styles.helpText}>No calendar event is created or modified. Approve or reject the proposal below; edits stay local until approved.</p>
        <div className={styles.scheduleActions}>
          <button type="button" onClick={() => setStore(approveSchedule(store, selectedDate, nowIso()))}>Approve schedule</button>
          <button type="button" onClick={() => setStore(rejectSchedule(store, selectedDate, nowIso()))}>Reject schedule</button>
          <span className={styles.badge}>{brief.scheduleApprovalState}</span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Project</th><th>Action</th><th>Flexibility</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {brief.proposedSchedule.map((block) => (
                <tr key={block.blockId}>
                  <td>{block.startTime}–{block.endTime}</td>
                  <td>{block.projectName || "—"}</td>
                  <td>{block.action}</td>
                  <td>{block.flexibility}</td>
                  <td>{block.reasonForPlacement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Proposed agent work orders">
        <h3 className={styles.sectionTitle}>Proposed agent work orders</h3>
        {brief.proposedWorkOrders.length ? (
          <div className={styles.outcomeGrid}>
            {brief.proposedWorkOrders.map((order) => (
              <article key={order.workOrderId} className={styles.workOrderCard}>
                <p className={styles.workOrderLabel}>{order.label}</p>
                <strong>{order.projectName}</strong>
                <p>{order.objective}</p>
                <p className={styles.badge}>{order.humanApprovalState} · risk {order.riskLevel}</p>
                <div className={styles.outcomeActions}>
                  <button type="button" onClick={() => setStore(approveWorkOrder(store, selectedDate, order.workOrderId, nowIso()))} disabled={order.humanApprovalState !== "Pending"}>
                    Approve
                  </button>
                  <button type="button" onClick={() => setStore(rejectWorkOrder(store, selectedDate, order.workOrderId, nowIso()))} disabled={order.humanApprovalState !== "Pending"}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="portal-empty">No outcome today is an Agent Candidate or Shared owner.</p>
        )}
      </section>

      <section aria-label="Decisions required">
        <h3 className={styles.sectionTitle}>Decisions required</h3>
        {brief.humanDecisions.length ? (
          <ul className={styles.decisionList}>
            {brief.humanDecisions.map((decision) => (
              <li key={decision.decisionId}>
                <strong>{decision.question}</strong>
                <p>{decision.whyItMatters}</p>
                <p className={styles.helpText}>Options: {decision.options.join(", ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="portal-empty">No genuine human decision is required right now.</p>
        )}
      </section>

      <section aria-label="Blocked and waiting">
        <h3 className={styles.sectionTitle}>Blocked and waiting</h3>
        {brief.blockedItems.length || brief.waitingItems.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Project</th><th>State</th><th>Blocker / waiting on</th><th>Follow-up</th></tr></thead>
              <tbody>
                {[...brief.blockedItems, ...brief.waitingItems].map((item) => (
                  <tr key={item.itemId}>
                    <td>{item.projectName}</td>
                    <td>{item.kind}</td>
                    <td>{item.blocker || item.waitingOn}</td>
                    <td>{item.followUpDate || item.escalationCondition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="portal-empty">Nothing is blocked or waiting right now.</p>
        )}
      </section>

      <details className={styles.disclosure}>
        <summary>Not today ({brief.notToday.length})</summary>
        <ul>
          {brief.notToday.map((item) => (
            <li key={item.itemId}><strong>{item.projectName}</strong>: {item.reason}</li>
          ))}
        </ul>
      </details>

      <details className={styles.disclosure}>
        <summary>Changes since previous brief ({brief.changesSincePrevious.length})</summary>
        <ul>
          {brief.changesSincePrevious.map((change) => (
            <li key={change.changeId}>{change.description}</li>
          ))}
        </ul>
      </details>

      <details className={styles.disclosure}>
        <summary>Assumptions and confidence ({brief.confidence})</summary>
        <ul>
          {brief.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
        </ul>
        {brief.staleWarnings.length ? (
          <p role="alert" className={styles.staleWarning}>{brief.staleWarnings.length} stale-data warning(s): {brief.staleWarnings.join(" ")}</p>
        ) : null}
      </details>

      {review ? (
        <section aria-label="End-of-day review" className={styles.mission}>
          <h3 className={styles.sectionTitle}>End-of-day review {review.completedAt ? "(completed)" : "(in progress)"}</h3>
          <p>Completed: {review.completedWork.join(", ") || "None"}</p>
          <p>Remaining: {review.remainingWork.join(", ") || "None"}</p>
          <p>Carrying forward: {review.selectedCarryForward.join(", ") || "None"}</p>
        </section>
      ) : null}
    </div>
  );
}

export type { DailyOperationsBrief };
