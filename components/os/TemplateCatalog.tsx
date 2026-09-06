import type { TemplateCard } from "@/lib/os/templates";

export function TemplateCatalog({ templates }: { templates: TemplateCard[] }) {
  if (!templates.length) {
    return (
      <div className="os-empty">
        <h2>No templates</h2>
        <p>When templates exist, you will see a readable name, purpose, and preview — not raw placeholders.</p>
      </div>
    );
  }

  return (
    <div className="os-grid os-grid-2">
      {templates.map((template) => (
        <article key={template.id} className="os-card">
          <h2>{template.name}</h2>
          <p>{template.purpose}</p>
          <p className="os-lede">{template.preview}</p>
          <p className="os-lede">Use this template in Obsidian. Browser creation still stages a draft PR.</p>
        </article>
      ))}
    </div>
  );
}
