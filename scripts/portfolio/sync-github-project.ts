/**
 * CLI for the Life OS <-> GitHub Project 2 sync engine.
 *
 * Default mode (no flags): loads real vault + registry data, builds a sync
 * plan against an EMPTY in-memory board, and prints the dry-run plan. This
 * is safe to run at any time — it never touches the network — and exists
 * to produce concrete "dry-run evidence" without requiring the `project`
 * OAuth scope this environment's `gh` token currently lacks.
 *
 * `--live --project-id <node-id>`: runs against the real GitHub Project 2
 * board via the GraphQL API. Requires GITHUB_TOKEN (or `gh auth token`)
 * with the `project` scope. Always dry-run unless `--apply` is also given.
 *
 * Usage:
 *   npm run portfolio:sync                       # safe local dry-run demo
 *   npm run portfolio:sync -- --live --project-id PVT_xxx
 *   npm run portfolio:sync -- --live --project-id PVT_xxx --apply
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildVaultIndex } from "../../lib/vault/build-index";
import { buildPortfolioSnapshot } from "../../lib/portfolio/portfolio-snapshot";
import { applySync, planFieldReuse, planSync, REQUIRED_FIELD_DEFINITIONS, type LastSyncedSnapshot, type ProjectV2Field, type ProjectV2Item, type ProjectsV2Client } from "../../lib/portfolio/github-project-sync";
import { createGithubProjectsV2Client } from "../../lib/portfolio/github-project-client";

type Args = { live: boolean; apply: boolean; projectId?: string };

function parseArgs(argv: string[]): Args {
  const live = argv.includes("--live");
  const apply = argv.includes("--apply");
  const idx = argv.indexOf("--project-id");
  const projectId = idx >= 0 ? argv[idx + 1] : undefined;
  return { live, apply, projectId };
}

function resolveToken(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

const SNAPSHOT_PATH = path.join(process.cwd(), "docs", "portfolio-sync-last-run.json");

async function loadLastSynced(): Promise<LastSyncedSnapshot> {
  try {
    return JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function saveLastSynced(snapshot: LastSyncedSnapshot) {
  await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

/** In-memory fake board used for the safe, no-network default demo run. */
function emptyDemoClient(): ProjectsV2Client {
  const fields: ProjectV2Field[] = REQUIRED_FIELD_DEFINITIONS.map((def, i) => ({ id: `demo-field-${i}`, name: def.name, dataType: def.dataType, options: def.options?.map((o) => ({ id: o, name: o })) }));
  const items: ProjectV2Item[] = [];
  return {
    listFields: async () => fields,
    listItems: async () => items,
    createField: async (_p, name, dataType, options) => ({ id: `demo-field-new-${name}`, name, dataType, options: options?.map((o) => ({ id: o, name: o })) }),
    createItem: async (_p, title) => ({ id: `demo-item-${title}`, fieldValues: [] }),
    updateItemField: async () => undefined,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [index, registrySource] = await Promise.all([
    buildVaultIndex(),
    readFile(path.join(process.cwd(), "PROJECT_REPO_REGISTRY.md"), "utf8").catch(() => ""),
  ]);
  const snapshot = buildPortfolioSnapshot(index.notes, registrySource, new Date());
  console.log(`Loaded ${snapshot.projects.length} trackable project(s) from the vault.`);

  let client: ProjectsV2Client;
  let projectId: string;

  if (args.live) {
    const token = resolveToken();
    if (!token) {
      console.error("No GitHub token available. Set GITHUB_TOKEN or run `gh auth login`.");
      process.exitCode = 1;
      return;
    }
    if (!args.projectId) {
      console.error("--live requires --project-id <GitHub Project 2 node ID>.");
      process.exitCode = 1;
      return;
    }
    client = createGithubProjectsV2Client(token);
    projectId = args.projectId;
  } else {
    console.log("No --live flag given: running against an in-memory demo board (no network access). This is the safe default while the `project` OAuth scope is not granted — see docs/P0_LIFEOS_RECOVERY_RUNLOG.md.");
    client = emptyDemoClient();
    projectId = "demo-project";
  }

  const [fields, items, lastSynced] = await Promise.all([client.listFields(projectId), client.listItems(projectId), loadLastSynced()]);
  const fieldPlan = planFieldReuse(fields);
  const plan = planSync(snapshot.projects, items, fieldPlan, lastSynced, new Date().toISOString());
  const dryRun = !args.apply;

  const outcome = await applySync(projectId, plan, client, fieldPlan, { dryRun, createMissingFields: args.apply });

  console.log(`\nFields reused: ${outcome.fieldsReused.join(", ") || "(none)"}`);
  console.log(`Fields missing on board: ${outcome.fieldsMissing.join(", ") || "(none)"}`);
  console.log(`Would create: ${outcome.itemsCreated}, would update: ${outcome.itemsUpdated}, unchanged: ${outcome.itemsSkippedUnchanged}`);
  console.log(`Conflicts requiring human review: ${outcome.conflicts.length}`);
  for (const conflict of outcome.conflicts) {
    console.log(`  - [${conflict.projectId}] ${conflict.field}: board="${conflict.currentValue}" vs proposed="${conflict.proposedValue}" (${conflict.recommendedResolution})`);
  }
  if (outcome.errors.length) {
    console.log(`Errors (${outcome.errors.length}):`);
    for (const error of outcome.errors) console.log(`  - ${error}`);
  }
  console.log(`\nMode: ${dryRun ? "DRY RUN (no writes performed)" : "APPLY"}. Board: ${args.live ? projectId : "in-memory demo (not persisted)"}.`);

  if (!dryRun && args.live) {
    const nextSnapshot: LastSyncedSnapshot = { ...lastSynced };
    for (const item of plan.items) {
      if (item.action === "skip-unchanged") continue;
      nextSnapshot[item.projectId] = { ...nextSnapshot[item.projectId], ...item.fieldsToWrite };
    }
    await saveLastSynced(nextSnapshot);
    console.log(`Updated ${SNAPSHOT_PATH} with the fields this run wrote, for conflict detection on the next run.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
