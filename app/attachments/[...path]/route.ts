import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { isAttachmentPath, isExcludedPath, normalizeVaultPath } from "@/lib/vault/exclusions";

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
  const relative = normalizeVaultPath(segments.join("/"));

  if (!relative || isExcludedPath(relative) || !isAttachmentPath(relative)) {
    notFound();
  }

  if (segments.some((segment) => segment === ".." || segment === ".")) {
    notFound();
  }

  const absolute = path.join(process.cwd(), relative);
  const extension = path.extname(relative).toLowerCase();

  try {
    const file = await readFile(absolute);
    return new Response(file, {
      headers: {
        "Content-Type": MIME[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    notFound();
  }
}
