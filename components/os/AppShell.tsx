"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import { ADVANCED_NAV, MOBILE_NAV, PRIMARY_NAV, isNavActive } from "@/lib/os/nav";
import { QuickCaptureDock } from "./QuickCaptureDock";
import { LifeMegaMenu } from "./LifeMegaMenu";
import styles from "./LegendaryCommandCenter.module.css";

type AppShellProps = {
  children: ReactNode;
  greeting?: string;
};

const commandNav = [
  { href: "/", label: "Command Center", icon: "⌂" },
  { href: "/life-map", label: "My Life", icon: "◉" },
  { href: "/agents", label: "AI Agents", icon: "✦" },
  { href: "/conversation", label: "Communications", icon: "●" },
  { href: "/today", label: "Tasks", icon: "✓" },
  { href: "/projects", label: "Projects", icon: "▦" },
  { href: "/businesses", label: "Shopify / E-Commerce", icon: "◆" },
  { href: "/portfolio", label: "Websites", icon: "▣" },
  { href: "/growth", label: "Marketing", icon: "↗" },
  { href: "/resources", label: "Content Studio", icon: "◩" },
  { href: "/dashboard", label: "Finance", icon: "$" },
  { href: "/dashboards", label: "Real Estate", icon: "⌂" },
  { href: "/search", label: "Veteran Hub", icon: "◈" },
  { href: "/learning", label: "Learning", icon: "▰" },
  { href: "/files", label: "Files & Drive", icon: "▱" },
  { href: "/integrations", label: "Integrations", icon: "⌘" },
  { href: "/more", label: "Tools & Resources", icon: "✣" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

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
    <div className={styles.shell}>
      <a className="os-skip skip-link" href="#main-content">Skip to main content</a>

      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>L</span>
          <div>
            <strong>LifeOS</strong>
            <small>COMMAND CENTER</small>
          </div>
        </Link>

        <nav className={styles.nav} aria-label="Primary command center">
          {commandNav.map((item) => (
            <Link key={item.label} href={item.href} data-active={isNavActive(pathname, item.href) ? "true" : "false"} aria-current={isNavActive(pathname, item.href) ? "page" : undefined}>
              <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <strong>Raven · Chief Morale Officer</strong>
          <span>● Always with you.</span>
          <p style={{margin:"10px 0 0",fontSize:".68rem",color:"#7f93ab"}}>{greeting || "Same mission. Bigger possibilities."}</p>
        </div>
      </aside>

      <div className={styles.mainCol}>
        <header className={styles.topbar}>
          <button className={styles.search} type="button" onClick={() => setPaletteOpen(true)} aria-label="Search LifeOS">
            <span>Search everything… projects, files, messages, tasks, clients, tools, ideas, agents</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className={styles.topActions}>
            <LifeMegaMenu />
            <Link href="/conversation">Ask LifeOS</Link>
            <button type="button" onClick={() => setCaptureOpen(true)}>Capture</button>
          </div>
        </header>

        <main className={styles.content} id="main-content" tabIndex={-1}>{children}</main>
      </div>

      <nav className={styles.dock} aria-label="Mobile">
        {MOBILE_NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isNavActive(pathname, item.href) ? "page" : undefined}>
            {item.label}
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
