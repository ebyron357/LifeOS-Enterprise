"use client";

import { useEffect, useMemo, useState } from "react";

type ServiceState = {
  enabled: boolean;
  configured: boolean;
  mode: string;
};

type IntakeResult = {
  ok?: boolean;
  duplicate?: boolean;
  resource?: { path?: string; sourceType?: string; sourceIdentity?: string };
  pullRequest?: { number?: number | null; url?: string | null; draft?: boolean; reused?: boolean };
  routing?: { processorRoute?: string; automated?: boolean };
  evidence?: { status?: string; inspectedAt?: string | null; error?: string };
  error?: string;
};

function intakeOutcome(result: IntakeResult): { heading: string; detail: string } {
  if (result.pullRequest?.reused) {
    return {
      heading: "Open draft PR updated",
      detail: "An open intake draft PR already stages this record, so it was updated instead of opening a competing PR.",
    };
  }
  if (result.duplicate) {
    return { heading: "Canonical record matched", detail: "Exact identity dedupe updated the existing record in a draft PR." };
  }
  return { heading: "Canonical record staged", detail: "A new canonical Resource record was created in a draft PR." };
}

type GitHubEvidence = {
  repository: string;
  description: string | null;
  defaultBranch: string;
  archived: boolean;
  visibility: string;
  license: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  latestCommitAt: string | null;
  latestCommitSha: string | null;
  hasSecurityPolicy: boolean;
  hasArchitectureDocs: boolean;
  packageManifests: string[];
  architectureSuggestion: "TEMPLATE" | null;
  dispositionSuggestion: "PENDING";
  readmeSignals: {
    explicitlyTemplate: boolean;
    mentionsFileBasedKnowledge: boolean;
    mentionsSandbox: boolean;
    mentionsSourceSync: boolean;
  };
  evidence: Array<{ source: string; claim: string; value: string }>;
};

type EvidenceResponse = {
  ok?: boolean;
  evidence?: GitHubEvidence;
  error?: string;
};

export function ResourceIntakePanel() {
  const [service, setService] = useState<ServiceState | null>(null);
  const [source, setSource] = useState("");
  const [title, setTitle] = useState("");
  const [secret, setSecret] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "completed" | "failed">("idle");
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [evidenceState, setEvidenceState] = useState<"idle" | "loading" | "completed" | "failed">("idle");
  const [evidenceResult, setEvidenceResult] = useState<EvidenceResponse | null>(null);

  const isGitHubSource = useMemo(
    () => /^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/?#]+/i.test(source.trim())
      || /^github\.com\/[^/]+\/[^/?#]+/i.test(source.trim()),
    [source],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/lifeos/resource-intake", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: ServiceState) => { if (active) setService(data); })
      .catch(() => { if (active) setService({ enabled: false, configured: false, mode: "draft-pr-only" }); });
    return () => { active = false; };
  }, []);

  async function inspectGitHub() {
    if (!isGitHubSource) return;
    setEvidenceState("loading");
    setEvidenceResult(null);
    try {
      const response = await fetch(
        `/api/lifeos/resource-intake/github?source=${encodeURIComponent(source.trim())}`,
        { cache: "no-store" },
      );
      const data = await response.json() as EvidenceResponse;
      setEvidenceResult(data);
      setEvidenceState(response.ok && data.ok ? "completed" : "failed");
    } catch {
      setEvidenceResult({ error: "GitHub evidence inspection failed." });
      setEvidenceState("failed");
    }
  }

  async function submit() {
    if (!source.trim() || !secret.trim()) return;
    setState("submitting");
    setResult(null);
    try {
      const response = await fetch("/api/lifeos/resource-intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          source: source.trim(),
          title: title.trim() || undefined,
          captureChannel: "lifeos-web",
        }),
      });
      const data = await response.json() as IntakeResult;
      setResult(data);
      setState(response.ok && data.ok ? "completed" : "failed");
    } catch {
      setResult({ error: "Resource intake request failed." });
      setState("failed");
    }
  }

  const evidence = evidenceResult?.evidence;

  return (
    <section className="os-card os-page" aria-labelledby="resource-intake-title">
      <p className="widget-eyebrow">Resource Intelligence</p>
      <h2 id="resource-intake-title">Promote a resource to the canonical vault</h2>
      <p>
        GitHub repositories, YouTube links, webpages, PDFs, and file metadata are normalized to a stable source identity.
        Exact duplicates update the same Resource record. Every canonical write is staged as a draft pull request.
      </p>
      <p className="os-lede">
        Capture does not decide whether to adopt a resource. Architecture classification and disposition remain PENDING until reviewed.
      </p>

      <label>
        <span className="widget-eyebrow">URL or source</span>
        <input
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setEvidenceState("idle");
            setEvidenceResult(null);
          }}
          placeholder="https://github.com/owner/repository"
          aria-label="Resource URL or source"
        />
      </label>
      <label>
        <span className="widget-eyebrow">Optional title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Short human-readable title"
          aria-label="Resource title"
        />
      </label>

      {isGitHubSource ? (
        <>
          <button
            type="button"
            className="os-secondary"
            onClick={inspectGitHub}
            disabled={evidenceState === "loading"}
          >
            {evidenceState === "loading" ? "Inspecting repository…" : "Inspect GitHub evidence"}
          </button>

          {evidenceState === "completed" && evidence ? (
            <div className="os-empty" role="status" aria-live="polite">
              <h3>GitHub evidence</h3>
              <p><strong>{evidence.repository}</strong>{evidence.description ? ` — ${evidence.description}` : ""}</p>
              <p>
                License: {evidence.license || "not reported"} · Branch: {evidence.defaultBranch} ·
                Archived: {evidence.archived ? "yes" : "no"}
              </p>
              <p>
                Latest inspected commit: {evidence.latestCommitSha?.slice(0, 12) || "unavailable"}
                {evidence.latestCommitAt ? ` · ${evidence.latestCommitAt}` : ""}
              </p>
              <p>
                Security policy: {evidence.hasSecurityPolicy ? "present" : "not detected"} ·
                Architecture/docs: {evidence.hasArchitectureDocs ? "present" : "not detected"}
              </p>
              <p>
                Architecture suggestion: <strong>{evidence.architectureSuggestion || "no evidence-backed suggestion"}</strong>.
                Disposition remains <strong>{evidence.dispositionSuggestion}</strong>.
              </p>
              <p className="os-lede">
                This is read-only source evidence. A TEMPLATE suggestion is shown only when the README explicitly describes
                the repository as a reusable template/starter. LifeOS does not auto-adopt or implement it.
              </p>
              <p className="os-lede">
                This preview is not sent with the capture. Staging the canonical PR re-inspects the repository on the server
                and records the result in the record&apos;s Source Evidence section.
              </p>
            </div>
          ) : null}

          {evidenceState === "failed" ? (
            <p className="os-lede" role="alert">{evidenceResult?.error || "GitHub evidence inspection failed."}</p>
          ) : null}
        </>
      ) : null}

      <label>
        <span className="widget-eyebrow">Owner write secret</span>
        <input
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="off"
          placeholder="Required only for canonical draft-PR intake"
          aria-label="Owner write secret"
        />
      </label>

      <button
        type="button"
        className="os-primary"
        onClick={submit}
        disabled={!source.trim() || !secret.trim() || state === "submitting" || service?.configured === false}
      >
        {state === "submitting" ? "Staging draft PR…" : "Stage canonical Resource PR"}
      </button>

      {service && !service.configured ? (
        <p className="os-lede">
          Canonical intake is fail-closed. Enable the existing LifeOS write path and GitHub token before this control can stage a PR.
        </p>
      ) : null}

      {state === "completed" && result ? (
        <div className="os-empty" role="status">
          <h3>{intakeOutcome(result).heading}</h3>
          <p>{result.resource?.path}</p>
          <p>{intakeOutcome(result).detail}</p>
          {result.evidence?.status ? (
            <p>
              Source evidence: {result.evidence.status}
              {result.evidence.error ? ` (${result.evidence.error})` : ""}
            </p>
          ) : null}
          {result.routing?.processorRoute ? (
            <p>
              Processor route: {result.routing.processorRoute}
              {result.routing.automated ? " (automated, read-only)" : " (manual next step)"}
            </p>
          ) : null}
          {result.pullRequest?.url ? (
            <a href={result.pullRequest.url} target="_blank" rel="noreferrer">
              Open draft PR #{result.pullRequest.number}
            </a>
          ) : null}
        </div>
      ) : null}

      {state === "failed" ? (
        <p className="os-lede" role="alert">{result?.error || "Resource intake failed."}</p>
      ) : null}
    </section>
  );
}
