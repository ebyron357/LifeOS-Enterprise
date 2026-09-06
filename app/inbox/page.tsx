import { AppShell } from "@/components/os/AppShell";
import { InboxHome } from "@/components/os/InboxHome";
import { daypartGreeting } from "@/lib/os/greeting";

export default function InboxPage() {
  return (
    <AppShell greeting={daypartGreeting()}>
      <InboxHome />
    </AppShell>
  );
}
