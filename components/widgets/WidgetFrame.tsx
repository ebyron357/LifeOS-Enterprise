type WidgetFrameProps = {
  eyebrow: string;
  title: string;
  action?: string;
  tone?: "default" | "prayer";
  children: React.ReactNode;
};

export function WidgetFrame({ eyebrow, title, action, tone = "default", children }: WidgetFrameProps) {
  return (
    <article className={`widget widget--${tone}`}>
      <header className="widget-header">
        <div>
          <p className="widget-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {action ? <span className="widget-action">{action}</span> : null}
      </header>
      {children}
    </article>
  );
}
