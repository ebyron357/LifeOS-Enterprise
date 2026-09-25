"use client";

import { useEffect, useState } from "react";

type ServiceState = { configured: boolean };

type SaveResult = {
  ok?: boolean;
  path?: string;
  pullRequest?: { number?: number | null; url?: string | null };
  error?: string;
};

export function CheckpointSaver({ defaultNextAction }: { defaultNextAction: string }) {
  const [service, setService] = useState<ServiceState | null>(null);
  const [lastCompleted, setLastCompleted] = useState("");
  const [nextAction, setNextAction] = useState(defaultNextAction);
  const [closeSession, setCloseSession] = useState(false);
  const [secret, setSecret] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [result, setResult] = useState<SaveResult | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/lifeos/continuity/checkpoint", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: ServiceState) => { if (active) setService(data); })
      .catch(() => { if (active) setService({ configured: false }); });
    return () => { active = false; };
  }, []);

  const ready = Boolean(nextAction.trim() && secret.trim()) && service?.configured !== false;

  async function save() {
    if (!ready) return;
    setState("saving");
    setResult(null);
    try {
      const response = await fetch("/api/lifeos/continuity/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({
          checkpoint: {
            lastCompleted: lastCompleted.trim() || undefined,
            nextAction: nextAction.trim(),
            sessionStatus: closeSession ? "CLOSED" : "OPEN",
          },
        }),
      });
      const data = await response.json() as SaveResult;
      setResult(data);
      setState(response.ok && data.ok ? "saved" : "failed");
    } catch {
      setResult({ error: "Checkpoint request failed." });
      setState("failed");
    }
  }

  return (
    <details className="os-review-form">
      <summary>Save this as a checkpoint</summary>
      <p className="os-lede">Records where you are so the next session resumes without reconstructing. Saved as a draft PR; nothing writes to main.</p>
      <label>Just finished (optional)
        <input value={lastCompleted} onChange={(event) => setLastCompleted(event.target.value)} aria-label="Just finished" />
      </label>
      <label>Next action
        <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} aria-label="Checkpoint next action" />
      </label>
      <label className="os-inline-check">
        <input type="checkbox" checked={closeSession} onChange={(event) => setCloseSession(event.target.checked)} />
        {" "}Close this session
      </label>
      <label>Owner write secret
        <input
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="off"
          aria-label="Checkpoint owner write secret"
        />
      </label>
      <button type="button" className="os-secondary" onClick={save} disabled={!ready || state === "saving"}>
        {state === "saving" ? "Staging draft PR…" : "Save checkpoint"}
      </button>
      {service && !service.configured ? (
        <p className="os-lede">Checkpoint writes are fail-closed until the LifeOS write path and GitHub token are configured.</p>
      ) : null}
      {state === "saved" && result ? (
        <p role="status">
          Checkpoint staged: {result.path}{" "}
          {result.pullRequest?.url ? <a href={result.pullRequest.url} target="_blank" rel="noreferrer">draft PR #{result.pullRequest.number}</a> : null}
        </p>
      ) : null}
      {state === "failed" ? <p className="os-lede" role="alert">{result?.error || "Checkpoint failed."}</p> : null}
    </details>
  );
}
