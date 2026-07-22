import { describe, expect, it } from "vitest";
import { buildMorningBriefSpeech } from "@/lib/lifeos/morning-brief-speech";
import type { ProjectBrief } from "@/lib/lifeos/types";

const projects: ProjectBrief[] = [
  {
    name: "Ship LifeOS",
    status: "active",
    priority: "P0",
    business: "LifeOS",
    nextAction: "Verify the interactive shell.",
    reviewDate: "2026-07-17",
    waitingOn: "",
    blocker: "",
  },
  {
    name: "Blocked Ops",
    status: "blocked",
    priority: "P1",
    business: "LifeOS",
    nextAction: "Clear the blocker.",
    reviewDate: "2026-07-18",
    waitingOn: "",
    blocker: "Waiting on access",
  },
  {
    name: "Waiting Partner",
    status: "waiting",
    priority: "P2",
    business: "LifeOS",
    nextAction: "Follow up with partner.",
    reviewDate: "2026-07-19",
    waitingOn: "Partner reply",
    blocker: "",
  },
];

describe("morning brief speech", () => {
  it("uses the verified active-project count and does not treat blocked or waiting work as active", () => {
    const verifiedActiveCount = projects.filter((project) => project.status === "active").length;
    expect(verifiedActiveCount).toBe(1);
    expect(projects.length).toBe(3);

    const speech = buildMorningBriefSpeech({
      activeProjects: verifiedActiveCount,
      projects,
      reviewsDue: 2,
    });

    expect(speech).toContain("You have 1 active projects");
    expect(speech).not.toContain("You have 3 active projects");
    expect(speech).toContain("1 blocked");
    expect(speech).toContain("1 waiting");
    expect(speech).toContain("2 reviews due");
    expect(speech).toContain("Ship LifeOS. Next: Verify the interactive shell.");
    expect(speech).not.toContain("Blocked Ops");
    expect(speech).not.toContain("Waiting Partner");
  });
});
