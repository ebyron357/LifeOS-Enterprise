import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  hasPathTraversal,
  isAttachmentPath,
  resolveSafeAttachmentPath,
} from "@/lib/vault/exclusions";

describe("attachment path safety", () => {
  it("rejects traversal segments and dotted path escapes", () => {
    expect(hasPathTraversal("40 Resources/../../secret.png")).toBe(true);
    expect(isAttachmentPath("40 Resources/../../secret.png")).toBe(false);
    expect(isAttachmentPath("40 Resources/..%2F..%2Fsecret.png")).toBe(false);
    expect(resolveSafeAttachmentPath("40 Resources/../../secret.png")).toBeNull();
  });

  it("allows contained resources attachments", () => {
    expect(isAttachmentPath("40 Resources/Attachments/diagram.png")).toBe(true);
    expect(resolveSafeAttachmentPath("40 Resources/Attachments/diagram.png")).toBe(
      path.resolve(process.cwd(), "40 Resources/Attachments/diagram.png"),
    );
  });

  it("rejects non-resource and non-media paths", () => {
    expect(isAttachmentPath("10 Projects/secret.png")).toBe(false);
    expect(isAttachmentPath("40 Resources/notes.md")).toBe(false);
    expect(resolveSafeAttachmentPath("package.json")).toBeNull();
  });
});
