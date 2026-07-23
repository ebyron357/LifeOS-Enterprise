import type { ReactNode } from "react";
import type { VaultSection } from "@/lib/vault/types";
import { PortalSidebar } from "./PortalSidebar";

type VaultPageLayoutProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  counts?: Partial<Record<VaultSection, number>>;
  dashboardActions?: ReactNode;
  children: ReactNode;
};

export function VaultPageLayout({
  title,
  description,
  eyebrow = "Vault portal",
  counts,
  dashboardActions,
  children,
}: VaultPageLayoutProps) {
  return (
    <div className="lifeos-app">
      <PortalSidebar counts={counts} dashboardActions={dashboardActions} />
      <main className="dashboard-shell portal-main">
        <header className="portal-page-header">
          <p className="widget-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className="portal-page-description">{description}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
