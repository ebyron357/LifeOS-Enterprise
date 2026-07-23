"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { VaultSection } from "@/lib/vault/types";

export type NavItem = {
  href: string;
  label: string;
  code: string;
  section?: VaultSection;
  count?: number;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", code: "01", section: "overview" },
  { href: "/projects", label: "Projects", code: "02", section: "projects" },
  { href: "/tasks", label: "Tasks", code: "03", section: "tasks" },
  { href: "/businesses", label: "Businesses", code: "04", section: "businesses" },
  { href: "/growth", label: "Growth", code: "05", section: "growth" },
  { href: "/intelligence", label: "Intelligence", code: "06", section: "intelligence" },
  { href: "/agents", label: "Agents", code: "07", section: "agents" },
  { href: "/resources", label: "Resources", code: "08", section: "resources" },
  { href: "/people", label: "People", code: "09", section: "people" },
  { href: "/learning", label: "Learning", code: "10", section: "learning" },
  { href: "/journal", label: "Journal", code: "11", section: "journal" },
  { href: "/reviews", label: "Reviews", code: "12", section: "reviews" },
  { href: "/sops", label: "SOPs", code: "13", section: "sops" },
  { href: "/templates", label: "Templates", code: "14", section: "templates" },
  { href: "/archive", label: "Archive", code: "15", section: "archive" },
  { href: "/search", label: "Search", code: "16", section: "search" },
];

type PortalSidebarProps = {
  counts?: Partial<Record<VaultSection, number>>;
  dashboardActions?: React.ReactNode;
};

function useIsMobileNav() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(max-width: 1000px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

export function PortalSidebar({ counts = {}, dashboardActions }: PortalSidebarProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobileNav();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const drawerHidden = isMobile && !open;

  return (
    <>
      <button
        ref={toggleRef}
        className="mobile-nav-toggle"
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={navId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "✕" : "☰"}
      </button>

      {open ? (
        <div
          className="mobile-nav-scrim"
          onClick={() => {
            setOpen(false);
            toggleRef.current?.focus();
          }}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id={navId}
        className={`lifeos-sidebar portal-sidebar ${open ? "is-open" : ""}`}
        aria-label="LifeOS navigation"
        aria-hidden={drawerHidden || undefined}
        inert={drawerHidden || undefined}
      >
        <div className="sidebar-brand">
          <span>L</span>
          <div>
            <strong>LIFEOS</strong>
            <small>VAULT PORTAL</small>
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const count = item.section ? counts[item.section] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : ""}
                tabIndex={drawerHidden ? -1 : undefined}
                onClick={() => setOpen(false)}
              >
                <span>{item.code}</span>
                {item.label}
                {typeof count === "number" && count > 0 ? <em>{count}</em> : null}
              </Link>
            );
          })}
        </nav>

        {dashboardActions ? <div className="sidebar-actions">{dashboardActions}</div> : null}

        <div className="sidebar-status">
          <i />
          <span>Read-only portal</span>
          <small>{counts.search ?? 0} indexed notes</small>
        </div>
      </aside>
    </>
  );
}

export { NAV_ITEMS };
