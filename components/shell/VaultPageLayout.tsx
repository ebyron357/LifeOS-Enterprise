import type { ReactNode } from "react";
import { AppShell } from "@/components/os/AppShell";
import { daypartGreeting } from "@/lib/os/greeting";

type VaultPageLayoutProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  counts?: unknown;
  dashboardActions?: ReactNode;
  children: ReactNode;
};

export function VaultPageLayout({
  title,
  description,
  eyebrow,
  children,
}: VaultPageLayoutProps) {
  return (
    <AppShell greeting={daypartGreeting()}>
      <header className="os-page-header">
        {eyebrow ? <p className="widget-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </AppShell>
  );
}
