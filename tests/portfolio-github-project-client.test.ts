import { afterEach, describe, expect, it, vi } from "vitest";
import { createGithubProjectsV2Client } from "@/lib/portfolio/github-project-client";
import type { ProjectV2Field } from "@/lib/portfolio/github-project-sync";

/**
 * Regression coverage for a real live-board defect found while applying the
 * portfolio sync to GitHub Project 2: `updateItemField` sent every field
 * value as `{ text: value }`, but GitHub's `UpdateProjectV2ItemFieldValueInput`
 * requires a differently-shaped value depending on the field's data type —
 * `{ singleSelectOptionId }` for single-select fields and `{ date }` for
 * date fields. Sending the wrong shape for a single-select field is
 * rejected outright ("Did not receive a single select option Id..."),
 * which silently dropped every Portfolio Status / Priority / Health /
 * Sync Status value during the first live apply run.
 */
describe("createGithubProjectsV2Client updateItemField", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetchOnce(responseBody: unknown) {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: responseBody }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;
    return fetchMock;
  }

  it("sends singleSelectOptionId (not raw text) for a SINGLE_SELECT field", async () => {
    const fetchMock = mockFetchOnce({ updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } } });
    const client = createGithubProjectsV2Client("test-token");
    const field: ProjectV2Field = {
      id: "field-status",
      name: "Portfolio Status",
      dataType: "SINGLE_SELECT",
      options: [{ id: "opt-active", name: "Active" }, { id: "opt-blocked", name: "Blocked" }],
    };

    await client.updateItemField("PVT_1", "item-1", field, "Active");

    const [, requestInit] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.variables.input.value).toEqual({ singleSelectOptionId: "opt-active" });
    expect(body.variables.input.fieldId).toBe("field-status");
  });

  it("throws instead of sending an invalid mutation when the value does not match any single-select option", async () => {
    mockFetchOnce({});
    const client = createGithubProjectsV2Client("test-token");
    const field: ProjectV2Field = { id: "field-status", name: "Portfolio Status", dataType: "SINGLE_SELECT", options: [{ id: "opt-active", name: "Active" }] };

    await expect(client.updateItemField("PVT_1", "item-1", field, "Nonexistent Option")).rejects.toThrow(/no single-select option/i);
  });

  it("sends a date value for a DATE field", async () => {
    const fetchMock = mockFetchOnce({ updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } } });
    const client = createGithubProjectsV2Client("test-token");
    const field: ProjectV2Field = { id: "field-review-date", name: "Review Date", dataType: "DATE" };

    await client.updateItemField("PVT_1", "item-1", field, "2026-08-15");

    const [, requestInit] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.variables.input.value).toEqual({ date: "2026-08-15" });
  });

  it("sends a text value for a TEXT field", async () => {
    const fetchMock = mockFetchOnce({ updateProjectV2ItemFieldValue: { projectV2Item: { id: "item-1" } } });
    const client = createGithubProjectsV2Client("test-token");
    const field: ProjectV2Field = { id: "field-owner", name: "Owner", dataType: "TEXT" };

    await client.updateItemField("PVT_1", "item-1", field, "Byron");

    const [, requestInit] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.variables.input.value).toEqual({ text: "Byron" });
  });
});
