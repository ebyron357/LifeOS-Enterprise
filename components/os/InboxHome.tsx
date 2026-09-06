"use client";

import { InboxList } from "./QuickCaptureDock";

export function InboxHome() {
  return (
    <div className="os-grid">
      <header className="os-page-header">
        <h1>Capture</h1>
        <p>Park a note, task, idea, or reminder. File it later. Do not decide the perfect folder first.</p>
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
      <InboxList />
    </div>
  );
}
