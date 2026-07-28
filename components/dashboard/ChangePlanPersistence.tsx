"use client";

import { useEffect, useState } from "react";
import styles from "./ChangePlanPersistence.module.css";

type PersistResult = {
  ok: boolean;
  error?: string;
  details?: Array<{ project: string; path: string; conflicts: Array<{ field: string; expected: string; current: string }> }>;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  branch?: string;
  planId?: string;
  duplicate?: boolean;
  state?: string;
};

type ServiceStatus = {
  enabled: boolean;
  configured: boolean;
  mode: string;
  directMainWrites: boolean;
};

type SubmissionState = "idle" | "checking" | "validated" | "submitting" | "conflict" | "failed" | "completed";

export function ChangePlanPersistence() {
  const [secret, setSecret] = useState("");
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [state, setState] = useState<SubmissionState>("checking");
  const [message, setMessage] = useState("Checking persistence availability…");
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<PersistResult["details"]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/lifeos/change-plan", { cache: "no-store" })
      .then((response) => response.json())
      .then((status: ServiceStatus) => {
        if (!active) return;
        setService(status);
        setState(status.configured ? "idle" : "failed");
        setMessage(status.configured
          ? "Persistence is available. Approved plans create draft pull requests only."
          : "Persistence is locked until the required production credentials are configured.");
      })
      .catch(() => {
        if (!active) return;
        setState("failed");
        setMessage("Unable to verify persistence availability.");
      });
    return () => { active = false; };
  }, []);

  function approvalPackage() {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Approval package JSON"]');
    return textarea?.value || "";
  }

  function restoreCanonical() {
    window.location.reload();
  }

  async function persistPlan() {
    const packageValue = approvalPackage();
    if (!packageValue) {
      setState("failed");
      setMessage("Generate and validate an approval package above first.");
      return;
    }
    if (!secret.trim()) {
      setState("failed");
      setMessage("Enter the LifeOS write authorization secret.");
      return;
    }

    setState("submitting");
    setMessage("Validating canonical values and creating an isolated draft change request…");
    setPullRequestUrl(null);
    setConflicts([]);
    try {
      const plan = JSON.parse(packageValue);
      setState("validated");
      const response = await fetch("/api/lifeos/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ plan }),
      });
      const result = await response.json() as PersistResult;
      if (response.status === 409 && result.details) {
        setConflicts(result.details);
        setState("conflict");
        setMessage("Canonical data changed after this plan was generated. Refresh and stage the changes again.");
        return;
      }
      if (!response.ok || !result.ok || !result.pullRequestUrl) {
        throw new Error(result.error || "Unable to create the GitHub change request.");
      }
      setPullRequestUrl(result.pullRequestUrl);
      setSecret("");
      setState("completed");
      setMessage(result.duplicate
        ? `Existing draft PR #${result.pullRequestNumber} reopened for plan ${result.planId}. No duplicate was created.`
        : `Draft PR #${result.pullRequestNumber} created for plan ${result.planId}. Main remains unchanged.`);
    } catch (error) {
      setState("failed");
      setMessage(error instanceof Error ? error.message : "Unable to create the GitHub change request.");
    }
  }

  const disabled = state === "submitting" || !service?.configured;

  return (
    <section className={styles.panel} aria-label="Controlled GitHub persistence" data-state={state}>
      <div>
        <p className="widget-eyebrow">Authenticated persistence · V2</p>
        <h3>Create a reviewable GitHub change request</h3>
        <p>LifeOS rechecks canonical values, rejects stale plans, deduplicates repeated submissions, and creates a draft pull request. It never writes directly to <code>main</code>.</p>
      </div>

      <div className={styles.statusRow} aria-label="Persistence state">
        <span className={styles.stateBadge}>{state}</span>
        <span>{service?.configured ? "Service configured" : "Service locked"}</span>
        <span>{service?.directMainWrites ? "Direct writes detected" : "Draft PR only"}</span>
      </div>

      <div className={styles.controls}>
        <label>
          <span>Write authorization secret</span>
          <input type="password" autoComplete="off" value={secret} onChange={(event) => setSecret(event.target.value)} disabled={!service?.configured} />
        </label>
        <button type="button" onClick={persistPlan} disabled={disabled}>{state === "submitting" ? "Validating…" : "Create draft PR"}</button>
      </div>

      {conflicts?.length ? (
        <div className={styles.conflicts} role="alert">
          <strong>Conflict report</strong>
          {conflicts.map((item) => (
            <div key={item.path}>
              <b>{item.project}</b>
              {item.conflicts.map((conflict) => <small key={conflict.field}>{conflict.field}: expected “{conflict.expected || "empty"}”, current “{conflict.current || "empty"}”</small>)}
            </div>
          ))}
        </div>
      ) : null}

      <p className={styles.message} aria-live="polite">{message}</p>
      <div className={styles.actions}>
        {pullRequestUrl ? <a className={styles.link} href={pullRequestUrl} target="_blank" rel="noreferrer">Open created pull request</a> : null}
        <button type="button" onClick={restoreCanonical}>Restore canonical values</button>
        {state === "failed" || state === "conflict" ? <button type="button" onClick={() => { setState(service?.configured ? "idle" : "failed"); setConflicts([]); }}>Clear error</button> : null}
      </div>
    </section>
  );
}
