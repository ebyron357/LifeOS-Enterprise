"use client";

import { useState } from "react";
import styles from "./ChangePlanPersistence.module.css";

type PersistResult = {
  ok: boolean;
  error?: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  branch?: string;
};

export function ChangePlanPersistence() {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pullRequestUrl, setPullRequestUrl] = useState<string | null>(null);

  async function persistPlan() {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Approval package JSON"]');
    if (!textarea?.value) {
      setMessage("Generate an approval package above before creating a GitHub change request.");
      return;
    }
    if (!secret.trim()) {
      setMessage("Enter the LifeOS write authorization secret.");
      return;
    }

    setBusy(true);
    setMessage("Creating an isolated GitHub branch and draft pull request…");
    setPullRequestUrl(null);
    try {
      const plan = JSON.parse(textarea.value);
      const response = await fetch("/api/lifeos/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ plan }),
      });
      const result = await response.json() as PersistResult;
      if (!response.ok || !result.ok || !result.pullRequestUrl) {
        throw new Error(result.error || "Unable to create the GitHub change request.");
      }
      setPullRequestUrl(result.pullRequestUrl);
      setSecret("");
      setMessage(`Draft PR #${result.pullRequestNumber} created on ${result.branch}. Main remains unchanged.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the GitHub change request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} aria-label="Controlled GitHub persistence">
      <div>
        <p className="widget-eyebrow">Authenticated persistence</p>
        <h3>Create a GitHub change request</h3>
        <p>After generating an approval package above, authorize LifeOS to create an isolated branch and draft pull request. This never writes directly to <code>main</code>.</p>
      </div>
      <div className={styles.controls}>
        <label>
          <span>Write authorization secret</span>
          <input type="password" autoComplete="off" value={secret} onChange={(event) => setSecret(event.target.value)} />
        </label>
        <button type="button" onClick={persistPlan} disabled={busy}>{busy ? "Creating PR…" : "Create draft PR"}</button>
      </div>
      <p className={styles.message} aria-live="polite">{message}</p>
      {pullRequestUrl ? <a className={styles.link} href={pullRequestUrl} target="_blank" rel="noreferrer">Open created pull request</a> : null}
    </section>
  );
}
