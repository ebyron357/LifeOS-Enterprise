"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import { ADVANCED_NAV, MOBILE_NAV, PRIMARY_NAV, isNavActive } from "@/lib/os/nav";
import { QuickCaptureDock } from "./QuickCaptureDock";

type AppShellProps = {
  children: ReactNode;
  greeting?: string;
};

export function AppShell({ children, greeting }: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    function onCapture() {
      setCaptureOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("lifeos-open-quick-capture", onCapture);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("lifeos-open-quick-capture", onCapture);
    };
  }, []);

  const destinations = [...PRIMARY_NAV, ...ADVANCED_NAV];

  return (
    <div className="os-app">
      <a className="os-skip skip-link" href="#main-content">Skip to main content</a>

      <aside className="os-sidebar">
        <Link className="os-brand" href="/">
          <span className="brand-mark">L</span>
          <div>
            <strong>LifeOS</strong>
            <small>Personal Command System</small>
          </div>
        </Link>

        <div className="os-sidebar-label">COMMAND CENTER</div>
        <nav className="os-rail" aria-label="Primary">
          {PRIMARY_NAV.map((item, index) => (
            <Link key={item.href} href={item.href} aria-current={isNavActive(pathname, item.href) ? "page" : undefined}>
              <span className="os-nav-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="os-nav-copy">
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </span>
            </Link>
          ))}
          <Link href="/more" aria-current={isNavActive(pathname, "/more") ? "page" : undefined}>
            <span className="os-nav-index">11</span>
            <span className="os-nav-copy">
              <strong>More</strong>
              <span>Settings, vault, systems, and advanced tools.</span>
            </span>
          </Link>
        </nav>

        <div className="os-sidebar-footer">
          <span className="os-status-dot" aria-hidden="true" />
          <div>
            <strong>System online</strong>
            <span>{greeting || "Command Center"}</span>
          </div>
        </div>
      </aside>

      <div className="os-shell">
        <header className="os-topbar">
          <div>
            <span className="os-topbar-kicker">LIFE OPERATIONS</span>
            <strong className="os-topbar-title">Command Center</strong>
          </div>
          <div className="os-top-actions">
            <button type="button" className="os-command-trigger" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
              <span>Search anything</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button type="button" className="os-icon-btn" onClick={() => setCaptureOpen(true)}>Capture</button>
            <Link className="os-ask" href="/conversation">Ask LifeOS</Link>
          </div>
        </header>

        <main className="os-main" id="main-content" tabIndex={-1}>{children}</main>
      </div>

      <nav className="os-dock" aria-label="Mobile">
        {MOBILE_NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isNavActive(pathname, item.href) ? "page" : undefined}>
            <strong>{item.label}</strong>
          </Link>
        ))}
      </nav>

      {paletteOpen ? (
        <div className="os-palette-overlay" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <Command className="os-palette" label="LifeOS commands" onMouseDown={(event) => event.stopPropagation()}>
            <Command.Input placeholder="Search LifeOS, projects, tools, or destinations…" aria-label="Search LifeOS destinations" />
            <Command.List>
              <Command.Empty>No matching destination.</Command.Empty>
              {destinations.map((item) => (
                <Command.Item
                  key={item.href}
                  value={`${item.label} ${item.description}`}
                  onSelect={() => {
                    setPaletteOpen(false);
                    router.push(item.href);
                  }}
                >
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      ) : null}

      <QuickCaptureDock open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
