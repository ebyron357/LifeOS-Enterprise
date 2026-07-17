import type { WidgetDefinition } from "@/components/widgets/registry";

type DashboardLayoutProps = { widgets: readonly WidgetDefinition[] };

export function DashboardLayout({ widgets }: DashboardLayoutProps) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Executive command center</p>
          <h1>Good morning, Byron.</h1>
          <p className="date-line">{today} · Your highest-leverage work, in one view.</p>
        </div>
        <div className="system-pill" aria-label="LifeOS systems operational">
          <span aria-hidden="true" /> Systems operational
        </div>
      </header>

      <section className="dashboard-grid" aria-label="Executive dashboard widgets">
        {widgets.map(({ id, Component, size }) => (
          <div className={`widget-slot widget-slot--${size}`} key={id} data-widget-id={id}>
            <Component />
          </div>
        ))}
      </section>
    </main>
  );
}
