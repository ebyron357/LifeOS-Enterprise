import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GitHubHealth } from "@/components/widgets/GitHubHealth";

describe("GitHub Health", () => {
  it("renders sourced repository telemetry", () => {
    render(<GitHubHealth data={{ connected: true, openPullRequests: 2, failedWorkflows: 0, defaultBranch: "main", lastWorkflow: "success", updatedAt: "2026-07-17T00:00:00Z" }} />);
    expect(screen.getByText("Repository telemetry")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("success")).toBeInTheDocument();
  });
});
