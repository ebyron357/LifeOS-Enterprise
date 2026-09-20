"use client";

import { InboxList } from "./QuickCaptureDock";
import { ResourceIntakePanel } from "./ResourceIntakePanel";

export function InboxHome() {
  return (
    <div className="os-grid">
      <header className="os-page-header">
        <h1>Capture</h1>
        <p>Park a note, task, idea, reminder, or resource. Browser capture stays lightweight; promote valuable resources into the canonical vault when you are ready.</p>
      </header>
      <section className="os-card os-page">
        <h2>Start here</h2>
        <p>Use Capture in the top bar, or open it from here.</p>
        <button
          type="button"
          className="os-primary"
          onClick={() => window.dispatchEvent(new Event("lifeos-open-quick-capture"))}
        >
          Capture something
        </button>
      </section>
      <ResourceIntakePanel />
      <InboxList />
    </div>
  );
}
