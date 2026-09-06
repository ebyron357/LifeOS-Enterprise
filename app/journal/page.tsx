import { AppShell } from "@/components/os/AppShell";
import { JournalToday } from "@/components/os/JournalToday";
import { isoDate, daypartGreeting } from "@/lib/os/greeting";
import { getNotesBySection } from "@/lib/vault/index";

export const revalidate = 300;

function isTodayEntry(path: string, title: string, created: string | null, updated: string | null, modifiedAt: string | null, today: string) {
  return [path, title, created, updated, modifiedAt].some((value) => value?.includes(today));
}

export default async function JournalPage() {
  const notes = await getNotesBySection("journal");
  const today = isoDate();
  const sorted = [...notes].sort((a, b) => (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? ""));
  const todayNotes = sorted.filter((note) => isTodayEntry(note.path, note.title, note.created, note.updated, note.modifiedAt, today));

  return (
    <AppShell greeting={daypartGreeting()}>
      <JournalToday todayNotes={todayNotes} recent={sorted} />
    </AppShell>
  );
}
