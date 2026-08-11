import Link from "next/link";
import { noteHref } from "@/lib/vault/slug";
import { isStale, type PortfolioData } from "@/lib/portfolio/build-portfolio-data";
import type { PortfolioProject } from "@/lib/portfolio/types";
import styles from "./PortfolioOverview.module.css";

function StatusBadge({ status }: { status: PortfolioProject["status"] }) {
  const tone =
    status === "Blocked" ? "danger" : status === "Waiting" || status === "Needs Audit" || status === "Needs Review" ? "warning" : status === "Active" ? "positive" : "neutral";
  return <span className={`${styles.badge} ${styles[tone]}`}>{status}</span>;
}

function AttentionCard({ project }: { project: PortfolioProject }) {
  return (
    <Link href={noteHref(project.sourcePath)} className={styles.attentionCard}>
      <StatusBadge status={project.status} />
      <strong>{project.name}</strong>
      <span>{project.blocker || project.waitingOn || project.nextAction || "Next action not set."}</span>
    </Link>
  );
}

export function PortfolioOverview({ data, today }: { data: PortfolioData; today: string }) {
  const { projects, attention, registryEntries, archiveCandidates, unmappedRepos } = data;

  if (!projects.length) {
    return <p className="portal-empty">No trackable project notes were found in the vault.</p>;
  }

  return (
    <div className={styles.stack}>
      <section aria-label="Needs your attention">
        <h2 className={styles.sectionTitle}>Needs your attention</h2>
        {attention.length ? (
          <div className={styles.attentionRow}>
            {attention.map((project) => (
              <AttentionCard key={project.projectId} project={project} />
            ))}
          </div>
        ) : (
          <p className="portal-empty">Nothing is blocked, waiting, or overdue for review right now.</p>
        )}
      </section>

      <section aria-label="All projects">
        <h2 className={styles.sectionTitle}>Project inventory</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Health</th>
                <th>Phase</th>
                <th>Next action</th>
                <th>Blocked / waiting</th>
                <th>Last verified</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const stale = isStale(project, today);
                return (
                  <tr key={project.projectId}>
                    <td><Link href={noteHref(project.sourcePath)}>{project.name}</Link></td>
                    <td><StatusBadge status={project.status} /></td>
                    <td>{project.priority}</td>
                    <td>{project.health}</td>
                    <td>{project.phase || "—"}</td>
                    <td>{project.nextAction || "Define the next action."}</td>
                    <td>{project.blocker || project.waitingOn || "—"}</td>
                    <td>
                      {project.lastVerified || "Never"}
                      {stale ? <span className={`${styles.badge} ${styles.warning}`}> stale</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Repository mapping">
        <h2 className={styles.sectionTitle}>Repository mapping</h2>
        <p className={styles.helpText}>
          Canonical and reference repositories per project, from each project note&rsquo;s Portfolio Extension fields.
          Full evidence for every mapping decision lives in{" "}
          <code>docs/PORTFOLIO_REPOSITORY_MAPPING_PROPOSAL.md</code>.
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Canonical repository</th>
                <th>Reference repositories</th>
              </tr>
            </thead>
            <tbody>
              {projects
                .filter((project) => project.canonicalRepository || project.referenceRepositories.length)
                .map((project) => (
                  <tr key={project.projectId}>
                    <td>{project.name}</td>
                    <td>{project.canonicalRepository || "—"}</td>
                    <td>{project.referenceRepositories.join(", ") || "—"}</td>
                  </tr>
                ))}
              {!projects.some((project) => project.canonicalRepository || project.referenceRepositories.length) ? (
                <tr>
                  <td colSpan={3}>No project note currently declares a canonical or reference repository.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Repository registry status">
        <h2 className={styles.sectionTitle}>Repository registry baseline</h2>
        <p className={styles.helpText}>
          Read from <code>PROJECT_REPO_REGISTRY.md</code>. This file is the current baseline and is never overwritten
          automatically &mdash; see the mapping proposal doc for any suggested changes and their required human review.
        </p>
        <div className={styles.registryGrid}>
          <div>
            <h3>Registry entries</h3>
            <ul>
              {registryEntries.map((entry) => (
                <li key={`${entry.project}-${entry.activeRepo}`}>
                  <strong>{entry.project}</strong> &rarr; <code>{entry.activeRepo || "unspecified"}</code> ({entry.status || "no status"})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Unmapped repositories</h3>
            {unmappedRepos.length ? (
              <ul>
                {unmappedRepos.map((repo) => (
                  <li key={repo}>
                    <code>{repo}</code> &mdash; listed in the registry but not claimed as canonical by any project note.
                  </li>
                ))}
              </ul>
            ) : (
              <p className="portal-empty">Every registry-active repository is claimed by a project note.</p>
            )}
          </div>
          <div>
            <h3>Archive candidates</h3>
            {archiveCandidates.length ? (
              <ul>
                {archiveCandidates.map((repo) => (
                  <li key={repo}><code>{repo}</code></li>
                ))}
              </ul>
            ) : (
              <p className="portal-empty">None listed.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
