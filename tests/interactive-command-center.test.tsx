import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InteractiveCommandCenter } from "@/components/dashboard/InteractiveCommandCenter";
import type { ProjectBrief } from "@/lib/lifeos/types";

const projects: ProjectBrief[] = [
  {
    name: "Active Alpha",
    path: "Projects/Active Alpha.md",
    status: "active",
    priority: "P1",
    business: "LifeOS",
    nextAction: "Finish the interactive command board.",
    reviewDate: "2026-07-30",
    waitingOn: "",
    blocker: "",
  },
  {
    name: "Waiting Beta",
    path: "Projects/Waiting Beta.md",
    status: "waiting",
    priority: "P2",
    business: "LifeOS",
    nextAction: "Receive the final approval response.",
    reviewDate: "2026-07-31",
    waitingOn: "Owner",
    blocker: "",
  },
];

function projectCard(lane: string, project: string) {
  const laneRegion = screen.getByRole("region", { name: `${lane} projects` });
  return within(laneRegion).getByText(project).closest("article") as HTMLElement;
}

describe("interactive command center", () => {
  afterEach(cleanup);

  it("stages status, priority, and next-action edits before approval", () => {
    render(<InteractiveCommandCenter projects={projects} />);

    let card = projectCard("active", "Active Alpha");
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));

    let selects = within(card).getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "P0" } });
    fireEvent.change(within(card).getByRole("textbox"), {
      target: { value: "Resolve the deployment credential blocker." },
    });
    fireEvent.change(selects[0], { target: { value: "blocked" } });

    card = projectCard("blocked", "Active Alpha");
    expect(card).toHaveAttribute("data-staged", "true");

    fireEvent.click(screen.getByRole("button", { name: /review changes \(1\)/i }));
    const review = screen.getByRole("region", { name: /review staged project changes/i });
    expect(within(review).getByText(/status: active → blocked/i)).toBeInTheDocument();
    expect(within(review).getByText(/priority: P1 → P0/i)).toBeInTheDocument();
    expect(within(review).getByText(/next_action:/i)).toBeInTheDocument();
  });

  it("generates a proposal-only approval package without writing vault data", () => {
    render(<InteractiveCommandCenter projects={projects} />);

    const card = projectCard("active", "Active Alpha");
    fireEvent.change(within(card).getByRole("combobox"), { target: { value: "complete" } });
    expect(projectCard("complete", "Active Alpha")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /review changes \(1\)/i }));
    fireEvent.click(screen.getByRole("button", { name: /generate approval package/i }));

    const packageRegion = screen.getByRole("region", { name: /generated approval package/i });
    const payload = within(packageRegion).getByRole("textbox") as HTMLTextAreaElement;
    expect(payload.value).toContain('"schema": "lifeos.change-plan.v1"');
    expect(payload.value).toContain('"write_mode": "proposal-only"');
    expect(payload.value).toContain('"path": "Projects/Active Alpha.md"');
    expect(screen.getByText(/no vault files were changed/i)).toBeInTheDocument();
  });
});
