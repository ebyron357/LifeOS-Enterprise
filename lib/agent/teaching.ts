import type { TeachingMode, TeachingPlan, TeachingStep } from "./types";

const MODE_GOALS: Record<TeachingMode, string> = {
  Explain: "Explain the current LifeOS surface in plain language.",
  "Walk Me Through It": "Walk through the next safe action one step at a time.",
  "Teach Me": "Teach the owner how this part of LifeOS works.",
  "Show Me What To Click": "Point to the next visible control without guessing hidden UI.",
  "Quiz Me": "Ask one question about the current topic.",
  Practice: "Give one practice action the owner can complete now.",
  Review: "Review what just happened and what remains.",
  Troubleshoot: "Diagnose the current error using verified evidence only.",
};

export function detectTeachingMode(text: string): TeachingMode | null {
  const lower = text.toLowerCase();
  if (/\bquiz me\b/.test(lower)) return "Quiz Me";
  if (/\bpractice\b/.test(lower)) return "Practice";
  if (/\btroubleshoot|\berror\b|\bwhat is wrong\b/.test(lower)) return "Troubleshoot";
  if (/\bshow me what to click|where do i click|what should i click\b/.test(lower)) return "Show Me What To Click";
  if (/\bwalk me through|guide me\b/.test(lower)) return "Walk Me Through It";
  if (/\bteach me|how do i\b/.test(lower)) return "Teach Me";
  if (/\breview (this|what we did)\b/.test(lower)) return "Review";
  if (/\bexplain\b/.test(lower)) return "Explain";
  return null;
}

function step(index: number, title: string, instruction: string, lookFor: string, expectedResult: string, nextHint: string): TeachingStep {
  return { index, title, instruction, lookFor, expectedResult, nextHint };
}

export function buildTeachingPlan(mode: TeachingMode, question: string, screenSharing: boolean): TeachingPlan {
  const goal = `${MODE_GOALS[mode]} ${question ? `Owner asked: ${question}` : ""}`.trim();
  const screenNote = screenSharing
    ? "Use the shared screen only for verified metadata unless a vision provider is configured."
    : "No screen is shared, so guidance stays inside LifeOS controls.";

  const steps: TeachingStep[] = [
    step(0, "Orient", `Confirm what you are looking at. ${screenNote}`, "The Conversation workspace panels: Conversation, Screen, Agent, Context, Evidence.", "You can name the panel you need.", "Move to the single next action."),
    step(1, "One next action", mode === "Show Me What To Click"
      ? "Click Share Screen only if you want LifeOS to see a window. Otherwise type your question in the conversation box."
      : "Do one action: start voice, share a screen, or ask a question.", "The control label matches the action you want.", "The matching panel updates its state in words, not color alone.", "Check the expected result before asking for another step."),
    step(2, "Confirm", "Look at Agent Activity. If an approval is waiting, approve or reject it. Do not continue a high-risk action automatically.", "Waiting-for-owner or an Approve / Reject pair.", "The activity log records the decision.", "Stop or pause the agent if you are done."),
  ];

  if (mode === "Quiz Me") {
    steps[1] = step(1, "Question", "What is the only durable write path for canonical LifeOS project metadata?", "ChangePlanPersistence → draft change plan → draft pull request.", "You can say the path without mentioning a direct write to main.", "Review the answer in Evidence.");
  }

  return {
    mode,
    goal,
    currentStepIndex: 0,
    steps,
    source: screenSharing ? "screen-context" : "lifeos-knowledge",
  };
}

export function advanceTeachingPlan(plan: TeachingPlan): TeachingPlan {
  return {
    ...plan,
    currentStepIndex: Math.min(plan.currentStepIndex + 1, plan.steps.length - 1),
  };
}

export function describeCurrentTeachingStep(plan: TeachingPlan): string {
  const current = plan.steps[plan.currentStepIndex];
  if (!current) return "No teaching step is available.";
  return `${plan.mode}: ${current.title}. ${current.instruction} Look for: ${current.lookFor} Expected: ${current.expectedResult}`;
}
