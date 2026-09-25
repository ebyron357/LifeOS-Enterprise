"use client";

import { useEffect, useMemo, useState } from "react";

export type ReviewableResource = {
  path: string;
  title: string;
  architecture: string;
  disposition: string;
};

type ServiceState = {
  configured: boolean;
  architectures: string[];
  dispositions: string[];
};

type ReviewResult = {
  ok?: boolean;
  path?: string;
  previousDisposition?: string;
  decision?: { architectureClassification: string; disposition: string };
  pullRequest?: { number?: number | null; url?: string | null };
  error?: string;
};

const FALLBACK_ARCHITECTURES = ["PENDING", "PLATFORM", "TEMPLATE", "PROJECT"];
const FALLBACK_DISPOSITIONS = ["ADOPT", "ADAPT", "EXTRACT", "WATCH", "ARCHIVE", "REJECT"];
const LEVELS = ["", "low", "medium", "high"];

export function ResourceReviewPanel({ records }: { records: ReviewableResource[] }) {
  const [service, setService] = useState<ServiceState | null>(null);
  const [path, setPath] = useState(records[0]?.path ?? "");
  const [architecture, setArchitecture] = useState("PENDING");
  const [disposition, setDisposition] = useState("");
  const [rationale, setRationale] = useState("");
  const [evidence, setEvidence] = useState("");
  const [overlap, setOverlap] = useState("");
  const [value, setValue] = useState("");
  const [effort, setEffort] = useState("");
  const [risk, setRisk] = useState("");
  const [license, setLicense] = useState("");
  const [cost, setCost] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");
  const [secret, setSecret] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "completed" | "failed">("idle");
  const [result, setResult] = useState<ReviewResult | null>(null);

  const selected = useMemo(() => records.find((record) => record.path === path) ?? null, [records, path]);
  const isRevision = Boolean(selected && selected.disposition !== "PENDING");

  useEffect(() => {
    let active = true;
    fetch("/api/lifeos/resource-review", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: ServiceState) => { if (active) setService(data); })
      .catch(() => {
        if (active) setService({ configured: false, architectures: FALLBACK_ARCHITECTURES, dispositions: FALLBACK_DISPOSITIONS });
      });
    return () => { active = false; };
  }, []);

  const needsArchitecture = (disposition === "ADOPT" || disposition === "ADAPT") && architecture === "PENDING";
  const needsDate = disposition === "WATCH" && !nextReviewDate;
  const ready = Boolean(path && disposition && rationale.trim().length >= 12 && secret.trim())
    && !needsArchitecture && !needsDate && service?.configured !== false;

  async function submit() {
    if (!ready) return;
    setState("submitting");
    setResult(null);
    try {
      const response = await fetch("/api/lifeos/resource-review", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({
          path,
          decision: {
            architectureClassification: architecture,
            disposition,
            rationale,
            evidence: evidence || undefined,
            overlap: overlap || undefined,
            value: value || undefined,
            effort: effort || undefined,
            risk: risk || undefined,
            license: license || undefined,
            cost: cost || undefined,
            nextReviewDate: nextReviewDate || undefined,
            reviewer: "owner",
            revise: isRevision,
          },
        }),
      });
      const data = await response.json() as ReviewResult;
      setResult(data);
      setState(response.ok && data.ok ? "completed" : "failed");
    } catch {
      setResult({ error: "Resource review request failed." });
      setState("failed");
    }
  }

  if (!records.length) {
    return (
      <section className="os-card" aria-labelledby="resource-review-form-title">
        <h2 id="resource-review-form-title">Record a review decision</h2>
        <p>No canonical Resource records exist yet. Promote a resource from Capture first.</p>
      </section>
    );
  }

  const architectures = service?.architectures ?? FALLBACK_ARCHITECTURES;
  const dispositions = service?.dispositions ?? FALLBACK_DISPOSITIONS;

  return (
    <section className="os-card os-review-form" aria-labelledby="resource-review-form-title">
      <p className="widget-eyebrow">Owner decision</p>
      <h2 id="resource-review-form-title">Record a review decision</h2>
      <p className="os-lede">
        You choose the classification and disposition. LifeOS records your decision in a draft PR and never adopts or implements a resource by itself.
      </p>

      <label>Resource
        <select value={path} onChange={(event) => setPath(event.target.value)} aria-label="Resource record">
          {records.map((record) => (
            <option key={record.path} value={record.path}>
              {record.title} ({record.architecture} / {record.disposition})
            </option>
          ))}
        </select>
      </label>
      {isRevision ? (
        <p className="os-lede">This resource was already reviewed as {selected?.disposition}. Submitting records a revised decision and keeps the earlier one in Review History.</p>
      ) : null}

      <div className="os-grid os-grid-2">
        <label>Architecture
          <select value={architecture} onChange={(event) => setArchitecture(event.target.value)} aria-label="Architecture classification">
            {architectures.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Disposition
          <select value={disposition} onChange={(event) => setDisposition(event.target.value)} aria-label="Disposition">
            <option value="">Choose…</option>
            {dispositions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <label>Rationale (required)
        <textarea
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          rows={3}
          placeholder="Why this decision, grounded in source evidence"
          aria-label="Review rationale"
        />
      </label>
      <label>Evidence
        <input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="README, license, commits, docs inspected" aria-label="Evidence" />
      </label>
      <label>Stack overlap
        <input value={overlap} onChange={(event) => setOverlap(event.target.value)} placeholder="What LifeOS already has that overlaps" aria-label="Stack overlap" />
      </label>

      <div className="os-grid os-grid-2">
        <label>Value
          <select value={value} onChange={(event) => setValue(event.target.value)} aria-label="Value rating">
            {LEVELS.map((item) => <option key={item || "none"} value={item}>{item || "—"}</option>)}
          </select>
        </label>
        <label>Effort
          <select value={effort} onChange={(event) => setEffort(event.target.value)} aria-label="Effort rating">
            {LEVELS.map((item) => <option key={item || "none"} value={item}>{item || "—"}</option>)}
          </select>
        </label>
        <label>Risk
          <select value={risk} onChange={(event) => setRisk(event.target.value)} aria-label="Risk rating">
            {LEVELS.map((item) => <option key={item || "none"} value={item}>{item || "—"}</option>)}
          </select>
        </label>
        <label>Next review date
          <input type="date" value={nextReviewDate} onChange={(event) => setNextReviewDate(event.target.value)} aria-label="Next review date" />
        </label>
        <label>License
          <input value={license} onChange={(event) => setLicense(event.target.value)} placeholder="e.g. MIT" aria-label="License review" />
        </label>
        <label>Cost
          <input value={cost} onChange={(event) => setCost(event.target.value)} placeholder="e.g. free, paid tier" aria-label="Cost review" />
        </label>
      </div>

      {needsArchitecture ? <p className="os-lede">ADOPT and ADAPT need a PLATFORM, TEMPLATE, or PROJECT classification.</p> : null}
      {needsDate ? <p className="os-lede">WATCH needs a next review date.</p> : null}

      <label>Owner write secret
        <input
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="off"
          placeholder="Required to stage the draft PR"
          aria-label="Owner write secret"
        />
      </label>

      <button type="button" className="os-primary" onClick={submit} disabled={!ready || state === "submitting"}>
        {state === "submitting" ? "Staging draft PR…" : "Stage review decision PR"}
      </button>

      {service && !service.configured ? (
        <p className="os-lede">Review writes are fail-closed. Enable the existing LifeOS write path and GitHub token before this control can stage a PR.</p>
      ) : null}

      {state === "completed" && result ? (
        <div className="os-empty" role="status">
          <h3>Review decision staged</h3>
          <p>{result.path}: {result.previousDisposition} → {result.decision?.disposition}</p>
          {result.pullRequest?.url ? (
            <a href={result.pullRequest.url} target="_blank" rel="noreferrer">Open draft PR #{result.pullRequest.number}</a>
          ) : null}
        </div>
      ) : null}
      {state === "failed" ? <p className="os-lede" role="alert">{result?.error || "Resource review failed."}</p> : null}
    </section>
  );
}
