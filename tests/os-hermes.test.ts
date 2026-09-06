import { describe, expect, it } from "vitest";
import { getHermesContract } from "@/lib/os/hermes";

describe("Hermes contract", () => {
  it("stays unavailable without credentials and never claims connected", () => {
    const missing = getHermesContract({});
    expect(missing.available).toBe(false);
    expect(missing.state).toBe("unavailable");
    expect(missing.delegatedTasks).toBe(0);
  });

  it("reports configured, not connected, when only credentials exist", () => {
    const configured = getHermesContract({
      HERMES_ENDPOINT: "https://example.invalid/hermes",
      HERMES_TOKEN: "not-a-real-token",
    });
    expect(configured.state).toBe("configured");
    expect(configured.available).toBe(false);
    expect(configured.limitation).toMatch(/not connected/i);
  });
});
