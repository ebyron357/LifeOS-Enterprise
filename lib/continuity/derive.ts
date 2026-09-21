import { noteHref } from "@/lib/vault/slug";
import { classifyContinuityAction, shouldInterruptOwner } from "./ownership";
import type {
  ContinuityCheckpointInput,
  ContinuityInput,
  ContinuityProjectInput,
  ResumeItem,
  ResumePackage,
} from "./model";

const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function rankProject(project: ContinuityProjectInput): number {
  const blocked = project.status === "blocked" || project.blocker ? 0 : 1;
  return blocked * 10 + (PRIORITY_RANK[project.priority] ?? 9);
}

function latestCheckpoint(checkpoints: ContinuityCheckpointInput[]): ContinuityCheckpointInput | null {
  return [...checkpoints].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0] ?? null;
}

function projectHref(path: string): string {
  return noteHref(path);
}

function itemFromProject(project: ContinuityProjectInput, kindDetail: string): ResumeItem {
  const decision = classifyContinuityAction(project.nextAction, [project.blocker, project.waitingOn, project.status]);
  return {
    id: `project:${project.path}`,
    kind: "project",
    title: project.name,
    detail: kindDetail,
    owner: project.owner || project.assignedAgent || "unassigned",
    ownership: decision.ownership,
    authority: decision.authority,
    href: projectHref(project.path),
    evidence: [
      `status:${project.status}`,
      project.nextAction && `next_action:${project.nextAction}`,
      project.blocker && `blocker:${project.blocker}`,
      project.waitingOn && `waiting_on:${project.waitingOn}`,
      project.lastVerified && `last_verified:${project.lastVerified}`,
    ].filter((value): value is string => Boolean(value)),
    reason: decision.reason,
  };
}

export function deriveResumePackage(input: ContinuityInput): ResumePackage {
  const projects = [...input.projects].sort((a, b) => rankProject(a) - rankProject(b) || a.name.localeCompare(b.name));
  const resources = input.resources ?? [];
  const checkpoints = input.checkpoints ?? [];
  const checkpoint = latestCheckpoint(checkpoints);
  const focus = projects[0] ?? null;
  const unverified: string[] = [];

  const blocked = projects
    .filter((project) => project.status === "blocked" || project.blocker)
    .map((project) => itemFromProject(project, project.blocker || "Recorded as blocked."));

  const waiting = projects
    .filter((project) => project.status === "waiting" || project.waitingOn)
    .map((project) => itemFromProject(project, project.waitingOn || "Marked waiting."));

  const reviewsDue = projects.filter((project) => project.reviewDate && project.reviewDate <= input.nowIso.slice(0, 10));

  const resourceItems: ResumeItem[] = resources
    .filter((resource) => {
      const state = resource.processingState.toLowerCase();
      return !["completed", "archived", "rejected"].includes(state);
    })
    .map((resource) => {
      const pending = resource.disposition === "PENDING" || resource.architectureClassification === "PENDING";
      const decision = classifyContinuityAction(
        resource.nextAction || (pending ? "inspect source-grounded evidence" : resource.processingState),
        [resource.processingState, resource.disposition],
      );
      return {
        id: `resource:${resource.path}`,
        kind: "resource" as const,
        title: resource.name,
        detail: `${resource.sourceType || "resource"} · ${resource.processingState || "unknown"} · disposition ${resource.disposition || "PENDING"}`,
        owner: resource.owner || "Resource Intelligence",
        ownership: pending ? "agent" : decision.ownership,
        authority: pending ? "always-allowed" : decision.authority,
        href: projectHref(resource.path),
        evidence: [
          resource.sourceType && `source_type:${resource.sourceType}`,
          resource.processingState && `processing_state:${resource.processingState}`,
          resource.disposition && `disposition:${resource.disposition}`,
          resource.lastCaptured && `last_captured:${resource.lastCaptured}`,
        ].filter((value): value is string => Boolean(value)),
        reason: pending
          ? "Capture is not a decision. An agent can inspect evidence; the owner still chooses disposition."
          : decision.reason,
      };
    });

  const githubItems: ResumeItem[] = [];
  if (!input.github.connected) {
    unverified.push("GitHub health is unavailable. Open PRs, workflow failures, and repository drift are not verified.");
  } else {
    if (input.github.failedWorkflows > 0) {
      githubItems.push({
        id: "github:failed-workflows",
        kind: "github",
        title: "CI failures on LifeOS-Enterprise",
        detail: `${input.github.failedWorkflows} failed workflow(s) in the latest public run sample. Last conclusion: ${input.github.lastWorkflow}.`,
        owner: "agent",
        ownership: "agent",
        authority: "always-allowed",
        href: "https://github.com/ebyron357/LifeOS-Enterprise/actions",
        evidence: [`failed_workflows:${input.github.failedWorkflows}`, `last_workflow:${input.github.lastWorkflow}`],
        reason: "Inspecting CI failure evidence is agent-doable. Merging or deploying remains owner-gated.",
      });
    }
    if (input.github.openPullRequests > 0) {
      githubItems.push({
        id: "github:open-prs",
        kind: "github",
        title: "Open pull requests",
        detail: `${input.github.openPullRequests} open PR(s) on ${input.github.defaultBranch}. Review and evidence collection can continue; merge is owner-only.`,
        owner: "shared",
        ownership: "shared",
        authority: "review-required",
        href: "https://github.com/ebyron357/LifeOS-Enterprise/pulls",
        evidence: [`open_pull_requests:${input.github.openPullRequests}`],
        reason: "An agent can review diff and tests. Merging to main requires owner authority.",
      });
    }
  }

  if (input.hermes && input.hermes.state !== "unavailable") {
    unverified.push(`Hermes is ${input.hermes.state}. ${input.hermes.limitation}`);
  }

  unverified.push("Slack, ClickUp, email, and calendar state are not invented. Those integrations stay unavailable until live probes exist.");

  const allItems = [...blocked, ...waiting, ...resourceItems, ...githubItems];
  const needsOwner = allItems.filter((item) => shouldInterruptOwner({ ownership: item.ownership, authority: item.authority, reason: item.reason }));
  const agentCanContinue = allItems.filter((item) => item.authority === "always-allowed" || (item.ownership === "agent" && item.authority !== "forbidden"));

  const reviewItems = reviewsDue.map((project) => itemFromProject(project, `Review date ${project.reviewDate} is due.`));
  for (const item of reviewItems) {
    if (item.authority === "always-allowed" || item.ownership === "agent") agentCanContinue.push(item);
    else if (shouldInterruptOwner({ ownership: item.ownership, authority: item.authority, reason: item.reason })) needsOwner.push(item);
  }

  const uniqueById = (items: ResumeItem[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const uniqueNeedsOwner = uniqueById(needsOwner);
  const uniqueAgent = uniqueById(agentCanContinue).filter((item) => !uniqueNeedsOwner.some((ownerItem) => ownerItem.id === item.id));

  const happenedSince: string[] = [];
  if (checkpoint) {
    happenedSince.push(`Last durable checkpoint: ${checkpoint.title} (${checkpoint.capturedAt}).`);
    if (checkpoint.currentState) happenedSince.push(checkpoint.currentState);
  }
  if (input.github.connected && input.github.updatedAt) {
    happenedSince.push(`GitHub last verified ${input.github.updatedAt}. Open PRs: ${input.github.openPullRequests}. Last workflow: ${input.github.lastWorkflow}.`);
  }
  if (reviewsDue.length) {
    happenedSince.push(`${reviewsDue.length} project review date(s) are due.`);
  }
  if (resources.some((resource) => resource.processingState === "needs-review")) {
    happenedSince.push("Resource Intelligence has items still in needs-review. Capture is not a disposition.");
  }
  if (!happenedSince.length) {
    happenedSince.push("No newer verified checkpoint exists. Resume from current vault next actions and GitHub health only.");
  }

  const changed: string[] = [];
  if (input.github.connected) {
    changed.push(`Canonical repository health was last read at ${input.github.updatedAt || "an unknown time"}.`);
  }
  for (const resource of resources.filter((item) => item.lastCaptured)) {
    changed.push(`${resource.name} last captured ${resource.lastCaptured}.`);
  }

  const failed = [
    ...uniqueNeedsOwner.filter((item) => item.kind === "github").map((item) => item.detail),
    ...blocked.map((item) => `${item.title}: ${item.detail}`),
  ];

  const whereWasI = checkpoint?.project
    ? `You were on ${checkpoint.project}.`
    : focus
      ? `You were on ${focus.name} (${focus.status}, ${focus.priority}).`
      : "No active project or checkpoint is recorded.";

  const whatWasIDoing = checkpoint?.lastCompleted || focus?.nextAction || "No last completed step is recorded.";
  const why = focus?.business ? `This belongs to ${focus.business}.` : checkpoint?.sourceOfTruth || "Business purpose is not recorded on the current focus.";
  const desiredOutcome = focus?.outcome || checkpoint?.currentState || (focus ? `Advance ${focus.name} through its recorded next action.` : "No desired outcome is recorded.");

  const ownerNext = uniqueNeedsOwner[0];
  const agentNext = uniqueAgent[0];
  const focusDecision = focus
    ? classifyContinuityAction(focus.nextAction, [focus.blocker, focus.waitingOn])
    : { ownership: "agent" as const, authority: "always-allowed" as const, reason: "No focus project." };

  const interrupt = ownerNext && shouldInterruptOwner({ ownership: ownerNext.ownership, authority: ownerNext.authority, reason: ownerNext.reason });
  const next = interrupt && ownerNext
    ? {
        label: ownerNext.title,
        href: ownerNext.href || "/",
        ownership: ownerNext.ownership,
        detail: ownerNext.detail,
      }
    : agentNext
      ? {
          label: agentNext.title,
          href: agentNext.href || "/",
          ownership: agentNext.ownership,
          detail: agentNext.detail,
        }
      : focus
        ? {
            label: focus.name,
            href: projectHref(focus.path),
            ownership: focusDecision.ownership,
            detail: focus.nextAction || desiredOutcome,
          }
        : {
            label: "Capture the missing next action",
            href: "/inbox",
            ownership: "agent" as const,
            detail: "No resumable project, resource, or checkpoint is available.",
          };

  return {
    generatedAt: input.nowIso,
    whereWasI,
    whatWasIDoing,
    why,
    desiredOutcome,
    happenedSince,
    changed: changed.length ? changed : ["No additional verified change evidence is available beyond vault next actions."],
    failed: failed.length ? failed : ["No verified failures are recorded in vault blockers or GitHub health."],
    blocked: uniqueById(blocked),
    needsOwner: uniqueNeedsOwner,
    agentCanContinue: uniqueAgent,
    next,
    doNotRepeat: checkpoint?.doNotRepeat?.length
      ? checkpoint.doNotRepeat
      : ["Do not rebuild the Command Center.", "Do not treat capture or agent claims as done without evidence.", "Do not invent Slack, ClickUp, or calendar state."],
    unverified,
    focus: focus
      ? { name: focus.name, path: focus.path, href: projectHref(focus.path), status: focus.status, priority: focus.priority }
      : null,
    source: checkpoint ? "checkpoint+derived" : "derived",
  };
}

export function speakResumePackage(resume: ResumePackage): string {
  const ownerLine = resume.needsOwner.length
    ? `Needs you: ${resume.needsOwner.slice(0, 3).map((item) => `${item.title}: ${item.detail}`).join(" ")}`
    : "Nothing currently requires your judgment.";
  const agentLine = resume.agentCanContinue.length
    ? `Agents can continue: ${resume.agentCanContinue.slice(0, 3).map((item) => item.title).join(", ")}.`
    : "No agent-doable continuation is recorded.";
  return [
    resume.whereWasI,
    `You were doing: ${resume.whatWasIDoing}.`,
    `Desired outcome: ${resume.desiredOutcome}.`,
    `Next: ${resume.next.detail}.`,
    ownerLine,
    agentLine,
  ].join(" ");
}
