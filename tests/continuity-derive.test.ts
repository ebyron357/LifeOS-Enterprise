import { describe, expect, it } from "vitest";
import { deriveResumePackage, speakResumePackage } from "@/lib/continuity/derive";
import { classifyContinuityAction, shouldInterruptOwner } from "@/lib/continuity/ownership";
import { parseCheckpointRecord, renderCheckpointRecord, resumePackageToCheckpoint } from "@/lib/continuity/checkpoint";
import { isOperationalContinuityNote } from "@/lib/continuity/notes";

const github = {
  connected: true,
  openPullRequests: 2,
  failedWorkflows: 1,
  defaultBranch: "main",
  lastWorkflow: "failure",
  updatedAt: "2026-09-20T18:00:00.000Z",
};

describe("continuity ownership firewall", () => {
  it("keeps inspection with agents and credentials with the owner", () => {
    const inspect = classifyContinuityAction("Inspect GitHub evidence and draft a summary");
    expect(inspect.ownership).toBe("agent");
    expect(shouldInterruptOwner(inspect)).toBe(false);

    const secret = classifyContinuityAction("Add the owner write secret and MFA");
    expect(secret.ownership).toBe("owner");
    expect(shouldInterruptOwner(secret)).toBe(true);
  });
});

describe("deriveResumePackage", () => {
  it("answers interruption questions without inventing chat or ClickUp state", () => {
    const resume = deriveResumePackage({
      nowIso: "2026-09-20T19:00:00.000Z",
      projects: [
        {
          name: "LifeOS Enterprise",
          path: "10 Projects/LifeOS Enterprise.md",
          status: "active",
          priority: "P0",
          business: "LifeOS",
          nextAction: "Inspect CI failure evidence and draft a repair PR",
          reviewDate: "2026-09-19",
          waitingOn: "",
          blocker: "",
          outcome: "Owner resumes without reconstructing context.",
        },
        {
          name: "Client launch",
          path: "10 Projects/Client Launch.md",
          status: "blocked",
          priority: "P0",
          business: "ClientVerse",
          nextAction: "Ask the owner for production credentials",
          reviewDate: "2026-09-21",
          waitingOn: "API credentials",
          blocker: "Missing credential",
        },
      ],
      resources: [{
        name: "knowledge-agent-template",
        path: "40 Resources/Resource Intelligence/Records/knowledge.md",
        sourceType: "github",
        processingState: "needs-review",
        disposition: "PENDING",
        architectureClassification: "PENDING",
        nextAction: "",
        owner: "Resource Intelligence",
        lastCaptured: "2026-09-20",
      }],
      github,
    });

    expect(resume.whereWasI).toMatch(/Client launch|LifeOS Enterprise/);
    expect(resume.needsOwner.some((item) => /credential/i.test(item.detail) || /credential/i.test(item.title))).toBe(true);
    expect(resume.agentCanContinue.some((item) => item.kind === "github" || item.kind === "resource")).toBe(true);
    expect(resume.unverified.some((item) => /Slack, ClickUp/i.test(item))).toBe(true);
    expect(JSON.stringify(resume)).not.toMatch(/\{\{/);
    expect(resume.next.detail).toBeTruthy();
    expect(speakResumePackage(resume)).toMatch(/Desired outcome/i);
  });

  it("uses a durable checkpoint as the last known place without discarding live blockers", () => {
    const resume = deriveResumePackage({
      nowIso: "2026-09-20T19:00:00.000Z",
      projects: [{
        name: "LifeOS Enterprise",
        path: "10 Projects/LifeOS Enterprise.md",
        status: "active",
        priority: "P0",
        business: "LifeOS",
        nextAction: "Inspect repository evidence",
        reviewDate: "2026-09-22",
        waitingOn: "",
        blocker: "",
      }],
      checkpoints: [{
        path: "Command Center/Checkpoints/2026-09-18-lifeos.md",
        title: "After PR 68",
        capturedAt: "2026-09-18T22:00:00.000Z",
        project: "LifeOS Enterprise",
        lastCompleted: "Merged GitHub evidence processor",
        currentState: "Resource Intelligence intake exists; review UI is not built.",
        nextAction: "Build continuity, not another command center",
        owner: "agent",
        sourceOfTruth: "docs/RESOURCE_INTELLIGENCE.md",
        blocker: "",
        doNotRepeat: ["Do not rebuild the Command Center."],
        evidence: ["PR #68 merged"],
        sessionStatus: "OPEN",
      }],
      github: { ...github, failedWorkflows: 0, lastWorkflow: "success" },
    });

    expect(resume.source).toBe("checkpoint+derived");
    expect(resume.whereWasI).toMatch(/LifeOS Enterprise/);
    expect(resume.whatWasIDoing).toMatch(/Merged GitHub evidence processor/);
    expect(resume.doNotRepeat).toContain("Do not rebuild the Command Center.");
  });
});

describe("checkpoint records", () => {
  it("excludes template and placeholder notes from operational continuity", () => {
    expect(isOperationalContinuityNote({ path: "99 Templates/Resume Checkpoint.md", title: "{{title}}", section: "templates" })).toBe(false);
    expect(isOperationalContinuityNote({ path: "99 Templates/Resource.md", title: "{{title}}", body: "{{date}}" })).toBe(false);
    expect(isOperationalContinuityNote({ path: "Command Center/Checkpoints/2026-09-20-lifeos.md", title: "After PR 68" })).toBe(true);
  });

  it("ignores template placeholder checkpoint notes", () => {
    expect(parseCheckpointRecord("99 Templates/Resume Checkpoint.md", `---
type: checkpoint
title: "{{title}}"
---

# {{title}}
`)).toBeNull();
  });

  it("round-trips the conversation-closeout checkpoint shape", () => {
    const source = renderCheckpointRecord({
      path: "Command Center/Checkpoints/demo.md",
      title: "Demo checkpoint",
      capturedAt: "2026-09-20T12:00:00.000Z",
      project: "LifeOS Enterprise",
      lastCompleted: "Derived resume packages",
      currentState: "Continuity slice in progress",
      nextAction: "Run tests",
      owner: "agent",
      sourceOfTruth: "docs/CONTINUITY.md",
      blocker: "",
      doNotRepeat: ["Do not create another LifeOS."],
      evidence: ["unit tests pending"],
      sessionStatus: "OPEN",
    });
    const parsed = parseCheckpointRecord("Command Center/Checkpoints/demo.md", source);
    expect(parsed?.project).toBe("LifeOS Enterprise");
    expect(parsed?.doNotRepeat).toContain("Do not create another LifeOS.");
    expect(parsed?.sessionStatus).toBe("OPEN");
  });

  it("can stage a checkpoint from a live resume package without claiming a write", () => {
    const resume = deriveResumePackage({
      nowIso: "2026-09-20T19:00:00.000Z",
      projects: [{
        name: "LifeOS Enterprise",
        path: "10 Projects/LifeOS Enterprise.md",
        status: "active",
        priority: "P0",
        business: "LifeOS",
        nextAction: "Inspect CI",
        reviewDate: "2026-09-22",
        waitingOn: "",
        blocker: "",
      }],
      github,
    });
    const checkpoint = resumePackageToCheckpoint(resume, "2026-09-20T19:00:00.000Z");
    expect(checkpoint.path.startsWith("Command Center/Checkpoints/")).toBe(true);
    expect(checkpoint.sessionStatus).toBe("OPEN");
    expect(checkpoint.evidence.some((item) => item.startsWith("source:"))).toBe(true);
  });
});
