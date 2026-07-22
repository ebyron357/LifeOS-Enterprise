import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LifeOSNavigation } from "@/components/dashboard/LifeOSNavigation";
import type { ProjectBrief } from "@/lib/lifeos/types";

const projects: ProjectBrief[] = [
  {
    name: "Active Alpha",
    status: "active",
    priority: "P0",
    business: "LifeOS",
    nextAction: "Finish the brief fix.",
    reviewDate: "2026-07-17",
    waitingOn: "",
    blocker: "",
  },
  {
    name: "Blocked Beta",
    status: "blocked",
    priority: "P1",
    business: "LifeOS",
    nextAction: "Remove the blocker.",
    reviewDate: "2026-07-18",
    waitingOn: "",
    blocker: "Missing credential",
  },
  {
    name: "Waiting Gamma",
    status: "waiting",
    priority: "P2",
    business: "LifeOS",
    nextAction: "Await reply.",
    reviewDate: "2026-07-19",
    waitingOn: "Client",
    blocker: "",
  },
];

class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1;
  onstart: ((event: Event) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("LifeOS navigation interactions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);
    vi.stubGlobal("speechSynthesis", {
      cancel: vi.fn(),
      speak: vi.fn((utterance: MockSpeechSynthesisUtterance) => {
        utterance.onstart?.(new Event("start"));
        utterance.onend?.(new Event("end"));
      }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps a keyboard-reachable spoken briefing control on mobile widths", () => {
    render(<LifeOSNavigation projects={projects} activeProjects={1} reviewsDue={2} />);

    const mobileDock = screen.getByLabelText("Mobile command actions");
    const mobileBrief = within(mobileDock).getByRole("button", { name: /hear my morning briefing/i });
    const mobileCapture = within(mobileDock).getByRole("button", { name: /open quick capture/i });

    expect(mobileBrief).toBeVisible();
    expect(mobileCapture).toBeVisible();
    expect(mobileBrief).not.toBe(mobileCapture);

    mobileBrief.focus();
    expect(mobileBrief).toHaveFocus();
    fireEvent.click(mobileBrief);

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    const utterance = vi.mocked(window.speechSynthesis.speak).mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.text).toContain("You have 1 active projects");
    expect(utterance.text).not.toContain("You have 3 active projects");
  });

  it("preserves the desktop spoken briefing control", () => {
    render(<LifeOSNavigation projects={projects} activeProjects={1} reviewsDue={2} />);
    const briefButtons = screen.getAllByRole("button", { name: /hear my morning briefing/i });
    expect(briefButtons.length).toBeGreaterThanOrEqual(2);
    expect(briefButtons.some((button) => button.classList.contains("voice-brief-button"))).toBe(true);
    expect(briefButtons.some((button) => button.classList.contains("mobile-brief-button"))).toBe(true);
  });

  it("creates, persists, and completes quick capture items in the current browser", () => {
    render(<LifeOSNavigation projects={projects} activeProjects={1} reviewsDue={2} />);

    fireEvent.click(screen.getAllByRole("button", { name: /open quick capture/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /quick capture/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/saved privately in this browser/i)).toBeInTheDocument();
    expect(screen.queryByText(/synced to obsidian/i)).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText(/idea, task, decision, or reminder/i);
    fireEvent.change(input, { target: { value: "Call the dentist" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^save$/i }));

    expect(within(dialog).getByText("Call the dentist")).toBeInTheDocument();
    expect(window.localStorage.getItem("lifeos-capture")).toContain("Call the dentist");

    fireEvent.click(within(dialog).getByRole("button", { name: /call the dentist/i }));
    expect(within(dialog).getByRole("button", { name: /call the dentist/i })).toHaveClass("is-done");
    expect(window.localStorage.getItem("lifeos-capture")).toContain('"done":true');
  });
});
