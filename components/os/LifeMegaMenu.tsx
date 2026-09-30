"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const groups = [
  {
    title: "COMMAND",
    subtitle: "Run the day",
    links: [
      ["Life Map", "/life-map"],
      ["Dashboards", "/dashboards"],
      ["Today", "/today"],
      ["Projects", "/projects"],
      ["Capture", "/inbox"],
      ["Ask LifeOS", "/conversation"],
    ],
  },
  {
    title: "BUSINESS & REVENUE",
    subtitle: "Build, sell, grow",
    links: [
      ["Businesses", "/businesses"],
      ["Leads & Content", "/note/00%20Home/Content%20Services%20Dashboard"],
      ["Growth", "/growth"],
      ["Portfolio", "/portfolio"],
      ["Client / project work", "/projects"],
      ["Reviews", "/reviews"],
    ],
  },
  {
    title: "AI WORKFORCE",
    subtitle: "Delegate with control",
    links: [
      ["Agents", "/agents"],
      ["Automations", "/automations"],
      ["Integrations", "/integrations"],
      ["AI Intelligence", "/intelligence"],
      ["Prompt Library", "/prompts"],
      ["SOPs", "/sops"],
    ],
  },
  {
    title: "PROJECTS & CLIENTS",
    subtitle: "What is moving",
    links: [
      ["Charlotte Real Estate", "/note/Projects/Charlotte%20Real%20Estate%20System"],
      ["Active Projects", "/projects"],
      ["Business Dashboard", "/note/00%20Home/Business%20Dashboard"],
      ["Widget Workspace", "/dashboard"],
      ["Tasks", "/tasks"],
      ["Evidence / Files", "/files"],
    ],
  },
  {
    title: "LEARNING & TOOLS",
    subtitle: "Build capability",
    links: [
      ["Learning", "/learning"],
      ["Resources", "/resources"],
      ["Templates", "/templates"],
      ["Technology / tools", "/resources"],
      ["Search Vault", "/search"],
      ["Files", "/files"],
    ],
  },
  {
    title: "PERSONAL",
    subtitle: "Life outside the work",
    links: [
      ["Personal Dashboard", "/note/00%20Home/Personal%20Dashboard"],
      ["People & Family", "/people"],
      ["Personal Growth", "/note/00%20Home/Personal%20Growth%20Dashboard"],
      ["Journal", "/journal"],
      ["Weekly Review", "/note/Dashboards/Weekly%20Review"],
      ["Monthly Review", "/note/Dashboards/Monthly%20Review"],
    ],
  },
  {
    title: "CREATIVE & MEDIA",
    subtitle: "Make and publish",
    links: [
      ["Creative Intelligence", "/prompts"],
      ["Content Services", "/note/00%20Home/Content%20Services%20Dashboard"],
      ["Portfolio", "/portfolio"],
      ["Resources", "/resources"],
      ["Files", "/files"],
      ["Integrations", "/integrations"],
    ],
  },
] as const;

export function LifeMegaMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Closing unmounts the panel; return focus so keyboard users are not dropped on <body>.
      trigger.current?.focus();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="os-life-menu-root" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="os-life-menu-trigger"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        My Life <span aria-hidden="true">⌄</span>
      </button>

      {open ? (
        // Disclosure of plain links (not an ARIA menu): Tab moves through the links in order.
        <nav id={panelId} className="os-life-mega" aria-label="LifeOS personal navigation">
          <div className="os-life-mega-head">
            <div>
              <span>SECOND BRAIN NAVIGATION</span>
              <strong>Everything that matters, visible from one place.</strong>
            </div>
            <div className="os-life-mega-actions">
              <Link href="/life-map" onClick={() => setOpen(false)}>Open Life Map</Link>
              <Link href="/dashboards" onClick={() => setOpen(false)}>Open Dashboards</Link>
            </div>
          </div>

          <div className="os-life-mega-grid">
            {groups.map((group) => (
              <section key={group.title} className="os-life-mega-group">
                <div className="os-life-mega-title">
                  <strong>{group.title}</strong>
                  <span>{group.subtitle}</span>
                </div>
                <div className="os-life-mega-links">
                  {group.links.map(([label, href]) => (
                    <Link key={label + href} href={href} onClick={() => setOpen(false)}>
                      <span>{label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
