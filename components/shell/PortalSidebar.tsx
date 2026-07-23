"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

export function PortalSidebar({ counts = {}, dashboardActions }: PortalSidebarProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="mobile-nav-toggle"
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {open ? <div className="mobile-nav-scrim" onClick={() => setOpen(false)} aria-hidden="true" /> : null}

      <aside className={`lifeos-sidebar portal-sidebar ${open ? "is-open" : ""}`} aria-label="LifeOS navigation">
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
