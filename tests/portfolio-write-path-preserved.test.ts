import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/change-plan/route.ts"), "utf8");
const runlogPath = path.join(process.cwd(), "docs/P0_LIFEOS_RECOVERY_RUNLOG.md");

describe("portfolio implementation preserves the existing draft-PR write path", () => {
  it("test case 20: the change-plan route is still the only durable write path, unchanged by the portfolio layer", () => {
    expect(routeSource).toContain('const ALLOWED_FIELDS = new Set(["status", "priority", "next_action"]);');
    expect(routeSource).toContain("draft: true");
    expect(routeSource).not.toContain("branch: BASE");
  });

  it("the portfolio layer introduces no direct-to-main write helpers", () => {
    const syncSource = readFileSync(path.join(process.cwd(), "lib/portfolio/github-project-sync.ts"), "utf8");
    const clientSource = readFileSync(path.join(process.cwd(), "lib/portfolio/github-project-client.ts"), "utf8");
    expect(syncSource).not.toMatch(/contents\/.*method:\s*["']PUT["']/);
    expect(clientSource).not.toMatch(/repos\/.*\/contents/);
  });

  it("the portfolio UI page does not expose a second write form", () => {
    const pageSource = readFileSync(path.join(process.cwd(), "app/portfolio/page.tsx"), "utf8");
    const overviewSource = readFileSync(path.join(process.cwd(), "components/portfolio/PortfolioOverview.tsx"), "utf8");
    expect(pageSource).not.toMatch(/fetch\(.*method:\s*["']POST["']/);
    expect(overviewSource).not.toContain("<form");
  });
});

describe("rollback and manual-step documentation", () => {
  it("test case 16: docs/P0_LIFEOS_RECOVERY_RUNLOG.md documents rollback instructions for the portfolio layer", () => {
    const runlog = readFileSync(runlogPath, "utf8");
    expect(runlog.toLowerCase()).toContain("rollback");
    expect(runlog).toContain("feat/canonical-portfolio-control-layer");
    expect(runlog.toLowerCase()).toContain("read:project");
  });
});
