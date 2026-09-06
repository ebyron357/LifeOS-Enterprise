import { AppShell } from "@/components/os/AppShell";
import { ProjectCards } from "@/components/os/ProjectCards";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { daypartGreeting } from "@/lib/os/greeting";

export const revalidate = 300;

export default async function ProjectsPage() {
  const vault = await getVaultDashboardData();

  return (
    <AppShell greeting={daypartGreeting()}>
      <div className="os-grid">
        <header className="os-page-header">
          <h1>Projects</h1>
          <p>Open a workspace. Resume work. This is not a file tree.</p>
        </header>
        <ProjectCards projects={vault.projects} />
      </div>
    </AppShell>
  );
}
