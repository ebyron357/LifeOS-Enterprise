"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { headingToAnchor } from "@/lib/vault/slug";

type Chapter = { id: string; label: string };

/** Native document scrolling: the guide observes it, never intercepts the wheel or touch. */
export function NoteReadingGuide({ children, contentKey }: { children: ReactNode; contentKey: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeId, setActiveId] = useState("");

  function positionMenu() {
    const menu = menuRef.current;
    const guide = guideRef.current;
    if (!menu?.open || !guide) return;
    // The absolute popup is positioned against the sticky guide, not details.
    const rect = guide.getBoundingClientRect();
    const gap = 6;
    const edge = 8;
    const above = Math.max(0, rect.top - gap - edge);
    const below = Math.max(0, window.innerHeight - rect.bottom - gap - edge);
    const useAbove = above > below;
    menu.dataset.menuPosition = useAbove ? "above" : "below";
    menu.style.setProperty("--note-menu-max-height", `${Math.min(360, useAbove ? above : below)}px`);
  }

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Read rendered headings so code fences and inline Markdown cannot create fake chapters.
    const headings = Array.from(content.querySelectorAll<HTMLElement>("h2, h3"));
    const used = new Set<string>(["note-reader-start"]);
    const outline = headings.map((heading) => {
      const label = heading.textContent?.trim() || "Section";
      const base = `note-${headingToAnchor(label) || "section"}`;
      let id = base;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      heading.id = id;
      heading.tabIndex = -1;
      return { id, label };
    });
    let frame = 0;

    function measure() {
      frame = 0;
      if (!content) return;
      const rect = content.getBoundingClientRect();
      positionMenu();
      // Match the heading anchor offset so the selected chapter follows native
      // fragment navigation even on short viewports.
      const anchorOffset = headings[0] ? Number.parseFloat(window.getComputedStyle(headings[0]).scrollMarginTop) : 0;
      const readingLine = Math.min(window.innerHeight - 1, Number.isFinite(anchorOffset) ? anchorOffset : 172);
      const travel = Math.max(1, rect.height - window.innerHeight + readingLine);
      const progress = Math.min(1, Math.max(0, (readingLine - rect.top) / travel));
      progressRef.current?.style.setProperty("--reading-progress", String(progress));
      let current = outline[0]?.id ?? "";
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > readingLine) break;
        current = heading.id;
      }
      // Short final sections cannot always reach the reading line before the page ends.
      if (rect.height > 0 && rect.bottom <= window.innerHeight + 2) current = outline.at(-1)?.id ?? current;
      setActiveId(current);
    }

    function scheduleMeasure() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }

    frame = window.requestAnimationFrame(() => {
      setChapters(outline);
      measure();
    });
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(content);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      resizeObserver?.disconnect();
    };
  }, [contentKey]);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (menuRef.current) menuRef.current.open = false;
    const target = document.getElementById(event.currentTarget.hash.slice(1));
    // Leave URL/history and scrolling to the browser; move keyboard focus with the reader.
    target?.focus({ preventScroll: true });
  }

  const activeChapter = chapters.find((chapter) => chapter.id === activeId);
  return (
    <div className="note-reading-surface" id="note-reader-start" tabIndex={-1}>
      {chapters.length > 1 ? (
        <div ref={guideRef} className="note-reading-guide">
          <details ref={menuRef} className="note-reading-menu" onToggle={positionMenu}>
            <summary>On this page<span aria-hidden="true">{activeChapter?.label}</span></summary>
            <nav aria-label="On this page">
              <ol>
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <a href={`#${chapter.id}`} aria-current={chapter.id === activeId ? "location" : undefined} onClick={navigate}>{chapter.label}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>
          <a className="note-reading-top" href="#note-reader-start" onClick={navigate}>Back to top</a>
          <span className="note-reading-progress" ref={progressRef} aria-hidden="true" />
        </div>
      ) : null}
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
