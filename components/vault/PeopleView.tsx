import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { VaultNote } from "@/lib/vault/types";

export function PeopleView({ notes }: { notes: VaultNote[] }) {
  const people = notes
    .filter((note) => note.type === "person" || note.section === "people")
    .sort((a, b) => a.title.localeCompare(b.title));

  if (!people.length) return <p className="portal-empty">No people records found.</p>;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>
            <th>Role</th>
            <th>Relationship</th>
            <th>Last contact</th>
            <th>Next contact</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.path}>
              <td><Link href={noteHref(person.path)}>{person.title}</Link></td>
              <td>{person.organization ?? "—"}</td>
              <td>{person.role ?? "—"}</td>
              <td>{person.relationship ?? "—"}</td>
              <td>{person.lastContact ?? "—"}</td>
              <td>{person.nextContact ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
