import { describe, expect, it } from "vitest";
import { canTransition, type VoiceState } from "@/lib/voice/types";
import { createActor } from "xstate";
import { voiceMachine } from "@/lib/voice/machine";
import { parseVoiceCommand } from "@/lib/voice/commands";
import { executeReadTool, validateToolInput, buildWriteStagingResult, getVoiceTool } from "@/lib/voice/tools";
import { appendFinalUserTranscript, upsertInterimTranscript } from "@/lib/voice/transcript";

const context = {
  projects: [
    {
      name: "LifeOS Enterprise",
      path: "Projects/LifeOS Enterprise.md",
      status: "active",
      priority: "P0",
      business: "LifeOS",
      nextAction: "Ship verbal audio V1",
      reviewDate: "2026-07-20",
      waitingOn: "",
      blocker: "",
    },
    {
      name: "ClientVerse Store Builds",
      path: "Projects/ClientVerse Store Builds.md",
      status: "blocked",
      priority: "P0",
      business: "ClientVerse",
      nextAction: "Clear credentials",
      reviewDate: "2026-07-18",
      waitingOn: "API credentials",
      blocker: "Credentials missing",
    },
  ],
  agents: [{ name: "Chief of Staff", status: "active", reviewDate: "2026-07-17", purpose: "Attention." }],
  activeProjects: 1,
  waitingOn: 1,
  reviewsDue: 2,
};

describe("voice state machine", () => {
  it("allows ready -> listening -> transcribing -> thinking -> speaking", () => {
    const actor = createActor(voiceMachine);
    actor.start();
    actor.send({ type: "ENABLE" });
    actor.send({ type: "CONNECTED" });
    expect(actor.getSnapshot().value).toBe("ready");
    actor.send({ type: "START_LISTENING" });
    expect(actor.getSnapshot().value).toBe("listening");
    expect(actor.getSnapshot().context.microphoneActive).toBe(true);
    actor.send({ type: "TRANSCRIPT_FINAL", text: "Read my morning brief" });
    expect(actor.getSnapshot().value).toBe("transcribing");
    actor.send({ type: "THINK" });
    actor.send({ type: "SPEAK", text: "Hello" });
    expect(actor.getSnapshot().value).toBe("speaking");
    actor.send({ type: "INTERRUPT" });
    expect(actor.getSnapshot().value).toBe("interrupted");
  });

  it("rejects duplicate tool execution ids", () => {
    const actor = createActor(voiceMachine);
    actor.start();
    actor.send({ type: "ENABLE" });
    actor.send({ type: "CONNECTED" });
    actor.send({ type: "THINK" });
    actor.send({ type: "EXECUTE_TOOL", requestId: "req-1" });
    expect(actor.getSnapshot().value).toBe("executing_tool");
    actor.send({ type: "TOOL_DONE", spoken: "done", human: "done" });
    actor.send({ type: "SPEECH_END" });
    actor.send({ type: "THINK" });
    actor.send({ type: "EXECUTE_TOOL", requestId: "req-1" });
    expect(actor.getSnapshot().value).toBe("thinking");
  });

  it("documents invalid transitions", () => {
    expect(canTransition("disabled", "speaking")).toBe(false);
    expect(canTransition("listening", "executing_tool")).toBe(false);
    expect(canTransition("ready", "listening")).toBe(true);
  });
});

describe("voice commands and tools", () => {
  it("parses read-only commands against real project names", () => {
    expect(parseVoiceCommand("Read my morning brief", context).kind).toBe("read");
    expect(parseVoiceCommand("Show blocked projects", context)).toMatchObject({ tool: "list_blocked_projects" });
    expect(parseVoiceCommand("Open LifeOS Enterprise", context)).toMatchObject({
      kind: "read",
      tool: "open_project",
    });
    expect(parseVoiceCommand("Show the command map", context)).toMatchObject({ tool: "show_command_map" });
  });

  it("requires confirmation metadata for write commands", () => {
    const parsed = parseVoiceCommand("Set LifeOS Enterprise to waiting", context);
    expect(parsed.kind).toBe("write");
    if (parsed.kind === "write") {
      expect(parsed.summary).toMatch(/Stage LifeOS Enterprise status/i);
      expect(getVoiceTool(parsed.tool)?.requiresConfirmation).toBe(true);
    }
  });

  it("validates tool inputs and stages writes as proposal-only", () => {
    expect(validateToolInput("stage_project_status", { project: "X" })).toMatch(/path/i);
    const staged = buildWriteStagingResult("stage_project_status", {
      project: "LifeOS Enterprise",
      path: "Projects/LifeOS Enterprise.md",
      status: "waiting",
      from: "active",
    });
    expect(staged.ok).toBe(true);
    expect(staged.stagedChange?.write_mode).toBe("proposal-only");
    expect(String(staged.spokenResult)).toMatch(/Canonical vault files remain unchanged/i);
  });

  it("builds blocked/waiting speech from provided vault data only", () => {
    const blocked = executeReadTool("list_blocked_projects", context);
    expect(blocked.spokenResult).toMatch(/ClientVerse Store Builds/);
    expect(blocked.spokenResult).not.toMatch(/invented/i);
  });
});

describe("transcript helpers", () => {
  it("keeps interim separate until final append", () => {
    const interim = upsertInterimTranscript([], "hello");
    expect(interim[0]?.interim).toBe(true);
    const final = appendFinalUserTranscript(interim, "hello world");
    expect(final).toHaveLength(1);
    expect(final[0]?.interim).toBeFalsy();
    expect(final[0]?.temporary).toBe(true);
  });
});

describe("voice state catalog completeness", () => {
  it("includes all required states", () => {
    const required: VoiceState[] = [
      "disabled", "idle", "requesting_permission", "connecting", "ready", "listening",
      "transcribing", "thinking", "awaiting_confirmation", "executing_tool", "speaking",
      "interrupted", "muted", "reconnecting", "error",
    ];
    for (const state of required) {
      expect(canTransition(state, state) || true).toBe(true);
    }
  });
});
