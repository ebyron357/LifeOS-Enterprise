import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { hasPathTraversal, normalizeVaultPath, resolveSafeAttachmentPath } from "@/lib/vault/exclusions";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

type AttachmentRouteProps = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, { params }: AttachmentRouteProps) {
  const segments = (await params).path.map((segment) => decodeURIComponent(segment));
  if (segments.some((segment) => segment.includes("/") || segment.includes("\\") || hasPathTraversal(segment))) {
    notFound();
  }

  const relative = normalizeVaultPath(segments.join("/"));
  if (!relative || hasPathTraversal(relative)) {
    notFound();
  }

  const absolute = resolveSafeAttachmentPath(relative);
  if (!absolute) {
    notFound();
  }

  const extension = path.extname(relative).toLowerCase();
  const headers: Record<string, string> = {
    "Content-Type": MIME[extension] ?? "application/octet-stream",
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };

  // SVGs can carry scripts; force download so they never execute on the portal origin.
  if (extension === ".svg") {
    headers["Content-Type"] = "application/octet-stream";
    headers["Content-Disposition"] = `attachment; filename="${path.basename(relative).replace(/"/g, "")}"`;
  }

  try {
    const file = await readFile(absolute);
    return new Response(file, { headers });
  } catch {
    notFound();
  }
}
