import { AppShell } from "@/components/os/AppShell";
import { LearningHome } from "@/components/os/LearningHome";
import { daypartGreeting } from "@/lib/os/greeting";
import { getNotesBySection } from "@/lib/vault/index";

export const revalidate = 300;

export default async function LearningPage() {
  const notes = await getNotesBySection("learning");
  const visible = notes.filter((note) => !/\{\{[^}]+\}\}/.test(note.title));

  return (
    <AppShell greeting={daypartGreeting()}>
      <LearningHome notes={visible} />
    </AppShell>
  );
}
