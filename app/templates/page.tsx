import { AppShell } from "@/components/os/AppShell";
import { TemplateCatalog } from "@/components/os/TemplateCatalog";
import { daypartGreeting } from "@/lib/os/greeting";
import { catalogTemplates } from "@/lib/os/templates";
import { getNotesBySection } from "@/lib/vault/index";

export const revalidate = 300;

export default async function TemplatesPage() {
  const notes = await getNotesBySection("templates");

  return (
    <AppShell greeting={daypartGreeting()}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>Templates</h1>
          <p>Readable names and purpose. Raw placeholders stay out of this view.</p>
        </header>
        <TemplateCatalog templates={catalogTemplates(notes)} />
      </div>
    </AppShell>
  );
}
