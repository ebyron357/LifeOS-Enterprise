"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProjectBrief } from "@/lib/lifeos/types";
import { useBrowserStorageString } from "@/lib/lifeos/use-browser-storage";

type Density = "calm" | "standard";
type TextSize = "normal" | "large";

export function CognitiveSupportCenter({ projects }: { projects: ProjectBrief[] }) {
  const [selectedName, setSelectedName] = useState(projects[0]?.name ?? "");
  const [overloaded, setOverloaded] = useState(false);
  const [density, setDensity] = useState<Density>("calm");
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [highContrast, setHighContrast] = useState(false);
  const resumeKey = `lifeos-resume-${selectedName}`;
  const [resumeNote, setResumeNote] = useBrowserStorageString(resumeKey, "");

  const selected = useMemo(
    () => projects.find((project) => project.name === selectedName) ?? projects[0],
    [projects, selectedName],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.lifeosDensity = overloaded ? "calm" : density;
    root.dataset.lifeosText = textSize;
    root.dataset.lifeosContrast = highContrast ? "high" : "normal";
    root.dataset.lifeosOverloaded = overloaded ? "true" : "false";
  }, [density, highContrast, overloaded, textSize]);

  function saveResumeNote(value: string) {
    setResumeNote(value);
  }

  function readCurrentStep() {
    if (!selected || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(
      `Current project: ${selected.name}. Your next step is: ${selected.nextAction}.`,
    );
    message.rate = 1;
    window.speechSynthesis.speak(message);
  }

  const nextProjects = projects.filter((project) => project.name !== selected?.name).slice(0, overloaded ? 1 : 3);
  const laterCount = Math.max(0, projects.length - nextProjects.length - (selected ? 1 : 0));

  return (
    <section className="cognitive-center" aria-label="Focus and cognitive support">
      <header className="cognitive-header">
        <div>
          <p className="widget-eyebrow">Low-load focus workspace</p>
          <h2>What needs your attention now?</h2>
          <p>One current action. Your place is saved if you stop.</p>
        </div>
        <button
          className={overloaded ? "overload-button is-active" : "overload-button"}
          onClick={() => setOverloaded((value) => !value)}
          type="button"
          aria-pressed={overloaded}
        >
          {overloaded ? "Show normal view" : "I’m overloaded"}
        </button>
      </header>

      <div className="support-preferences" aria-label="Display preferences">
        <label>
          Screen
          <select value={density} onChange={(event) => setDensity(event.target.value as Density)}>
            <option value="calm">Calm</option>
            <option value="standard">Standard</option>
          </select>
        </label>
        <label>
          Text
          <select value={textSize} onChange={(event) => setTextSize(event.target.value as TextSize)}>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </label>
        <label className="support-toggle">
          <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} />
          <span>Higher contrast</span>
        </label>
      </div>

      {overloaded ? (
        <div className="overload-message">
          <strong>The rest can wait.</strong>
          <span>Only the current step is shown. Nothing was deleted or changed.</span>
        </div>
      ) : null}

      <div className="now-next-later">
        <article className="now-card">
          <div className="lane-label"><span>NOW</span><small>one action</small></div>
          {selected ? (
            <>
              {!overloaded ? (
                <label className="project-choice">
                  Current project
                  <select value={selected.name} onChange={(event) => setSelectedName(event.target.value)}>
                    {projects.map((project) => <option key={project.name}>{project.name}</option>)}
                  </select>
                </label>
              ) : null}
              <h3>{selected.name}</h3>
              <div className="single-step">
                <span>Next clear step</span>
                <strong>{selected.nextAction}</strong>
              </div>
              <div className="focus-actions">
                <button onClick={readCurrentStep} type="button">Hear this step</button>
                <span>Status: {selected.status}</span>
              </div>
              <label className="resume-field">
                Where I stopped / what I need to remember
                <textarea
                  value={resumeNote}
                  onChange={(event) => saveResumeNote(event.target.value)}
                  placeholder="Example: I finished the homepage. Next I need to check the contact form."
                  rows={3}
                />
                <small>Saved automatically in this browser.</small>
              </label>
            </>
          ) : <p>No current project is recorded.</p>}
        </article>

        {!overloaded ? (
          <>
            <article className="next-lane">
              <div className="lane-label"><span>NEXT</span><small>after now</small></div>
              {nextProjects.map((project) => (
                <button key={project.name} onClick={() => setSelectedName(project.name)} type="button">
                  <strong>{project.name}</strong>
                  <small>{project.nextAction}</small>
                </button>
              ))}
              {!nextProjects.length ? <p>No additional active work.</p> : null}
            </article>
            <article className="later-lane">
              <div className="lane-label"><span>LATER</span><small>not today</small></div>
              <strong>{laterCount}</strong>
              <p>Other active records are safely out of the way.</p>
              <small>They remain in the project view and are not lost.</small>
            </article>
          </>
        ) : null}
      </div>
    </section>
  );
}
