import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { VaultTask } from "@/lib/vault/types";

export function TasksView({ tasks }: { tasks: VaultTask[] }) {
  const open = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = open.filter((task) => task.dueDate && task.dueDate < today);
  const dueSoon = open.filter((task) => task.dueDate && task.dueDate >= today);

  return (
    <div className="tasks-view">
      <div className="mission-strip" aria-label="Task summary">
        <article><span>Open</span><strong>{open.length}</strong></article>
        <article className={overdue.length ? "has-alert" : ""}><span>Overdue</span><strong>{overdue.length}</strong></article>
        <article><span>Due</span><strong>{dueSoon.length}</strong></article>
        <article><span>Completed</span><strong>{completed.length}</strong></article>
      </div>

      <TaskTable title="Open tasks" tasks={open} empty="No open tasks found in vault notes." />
      {overdue.length ? <TaskTable title="Overdue" tasks={overdue} /> : null}
      <TaskTable title="Completed" tasks={completed.slice(0, 20)} empty="No completed tasks indexed yet." />
    </div>
  );
}

function TaskTable({ title, tasks, empty }: { title: string; tasks: VaultTask[]; empty?: string }) {
  if (!tasks.length) return empty ? <p className="portal-empty">{empty}</p> : null;

  return (
    <section className="library-panel">
      <h2>{title}</h2>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Source</th>
              <th>Due</th>
              <th>Priority</th>
              <th>Project / Area</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.text}</td>
                <td><Link href={noteHref(task.sourcePath)}>{task.sourceTitle}</Link></td>
                <td>{task.dueDate ?? "—"}</td>
                <td>{task.priority ?? "—"}</td>
                <td>{task.project ?? task.area ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
