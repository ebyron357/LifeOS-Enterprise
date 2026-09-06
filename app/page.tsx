import { AppShell } from "@/components/os/AppShell";
import { CommandCenterHome } from "@/components/os/CommandCenterHome";
import { getOsContext } from "@/lib/os/page-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const os = await getOsContext();

  return (
    <AppShell greeting={os.greeting}>
      <CommandCenterHome
        greeting={os.greeting}
        dateLabel={os.dateLabel}
        vault={os.vault}
        integrations={os.integrations}
        hermes={os.hermes}
        github={os.github}
      />
    </AppShell>
  );
}
