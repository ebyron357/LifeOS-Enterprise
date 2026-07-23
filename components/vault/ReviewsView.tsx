import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import type { VaultNote } from "@/lib/vault/types";

export function ReviewsView({ notes }: { notes: VaultNote[] }) {
  const reviews = notes
    .filter((note) => note.section === "reviews")
    .sort((a, b) => (b.reviewDate ?? b.modifiedAt ?? "").localeCompare(a.reviewDate ?? a.modifiedAt ?? ""));

  if (!reviews.length) return <p className="portal-empty">No review records found.</p>;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Review</th>
            <th>Type</th>
            <th>Status</th>
            <th>Review date</th>
            <th>Folder</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.path}>
              <td><Link href={noteHref(review.path)}>{review.title}</Link></td>
              <td>{review.type ?? "—"}</td>
              <td>{review.status ?? "—"}</td>
              <td>{review.reviewDate ?? "—"}</td>
              <td>{review.folder}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
