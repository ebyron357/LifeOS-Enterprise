import Link from "next/link";
import { notFound } from "next/navigation";
import { VaultPageLayout } from "@/components/shell/VaultPageLayout";
import { getSectionCounts } from "@/lib/vault/index";
import { WORKSPACES } from "@/lib/workspace/workspaces";

export const revalidate = 300;

type WorkspacePageProps = {
  params: Promise<{ slug: string }>;
};

const PLACEHOLDER_SLUGS = new Set(["automation", "developer", "analytics"]);

export default async function PreparedWorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = await params;
  if (!PLACEHOLDER_SLUGS.has(slug)) notFound();

  const workspace = WORKSPACES.find((item) => item.href === `/workspace/${slug}`);
  if (!workspace) notFound();

  const counts = await getSectionCounts();

  return (
    <VaultPageLayout
      title={workspace.label}
      eyebrow="Workspace OS · Prepared"
      description={workspace.description}
      counts={counts}
    >
      <div className="workspace-placeholder">
        <p>
          This workspace is prepared in the Workspace OS shell for a later sprint.
          Command Center is fully implemented in V1.
        </p>
        <p>No fake data is shown here. Canonical vault Markdown remains unchanged.</p>
        <Link className="workspace-action workspace-action--primary" href="/dashboard">
          Return to Command Center
        </Link>
      </div>
    </VaultPageLayout>
  );
}
