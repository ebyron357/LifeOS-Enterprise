import { createHash } from "node:crypto";

export type ResourceSourceType =
  | "github"
  | "youtube"
  | "pdf-document"
  | "tool-course"
  | "social"
  | "webpage"
  | "file"
  | "generic-internal";

export type ResourceArchitectureClassification = "PENDING" | "PLATFORM" | "TEMPLATE" | "PROJECT";
export type ResourceDisposition = "PENDING" | "ADOPT" | "ADAPT" | "EXTRACT" | "WATCH" | "ARCHIVE" | "REJECT";

export type ResourceCaptureInput = {
  source: string;
  title?: string;
  captureChannel?: string;
  relatedProject?: string;
  relatedArea?: string;
  owner?: string;
  reviewDate?: string;
  fileName?: string;
  fileHash?: string;
  fileSize?: number;
  fileType?: string;
};

export type NormalizedResource = {
  canonicalSource: string;
  sourceType: ResourceSourceType;
  sourceIdentity: string;
  slug: string;
  title: string;
  fileName: string | null;
  fileHash: string | null;
  fileSize: number | null;
  fileType: string | null;
};

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
]);

const SOCIAL_HOSTS = new Set([
  "x.com",
  "twitter.com",
  "www.twitter.com",
  "linkedin.com",
  "www.linkedin.com",
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "facebook.com",
  "www.facebook.com",
]);

const COURSE_HOSTS = new Set([
  "coursera.org",
  "www.coursera.org",
  "udemy.com",
  "www.udemy.com",
  "edx.org",
  "www.edx.org",
  "pluralsight.com",
  "www.pluralsight.com",
]);

function compactHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function cleanSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/\.git$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return normalized || "resource";
}

function identitySlug(identity: string): string {
  const readable = identity.replace(/^(github|youtube|url|file|internal):/i, "");
  return `${cleanSlug(readable).slice(0, 58)}-${compactHash(identity)}`;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(value);
}

function parseUrl(raw: string): URL | null {
  if (!looksLikeUrl(raw)) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}

function normalizeWebUrl(url: URL): string {
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString().replace(/\/$/, "");
}

function githubResource(url: URL): Omit<NormalizedResource, "slug" | "title" | "fileName" | "fileHash" | "fileSize" | "fileType"> | null {
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0].toLowerCase();
  const repository = parts[1].replace(/\.git$/i, "").toLowerCase();
  if (!owner || !repository) return null;
  const identity = `github:${owner}/${repository}`;
  return {
    canonicalSource: `https://github.com/${owner}/${repository}`,
    sourceType: "github",
    sourceIdentity: identity,
  };
}

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com") return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const parts = url.pathname.split("/").filter(Boolean);
  if (["shorts", "embed", "live"].includes(parts[0] ?? "")) return parts[1] ?? null;
  return null;
}

function hostTitle(url: URL): string {
  const last = url.pathname.split("/").filter(Boolean).pop();
  if (last) return decodeURIComponent(last).replace(/[-_]+/g, " ");
  return url.hostname.replace(/^www\./, "");
}

export function normalizeResource(input: ResourceCaptureInput): NormalizedResource {
  const source = input.source?.trim();
  const fileHash = input.fileHash?.trim().toLowerCase() || null;
  const fileName = input.fileName?.trim() || null;

  if (fileHash) {
    if (!/^[a-f0-9]{32,128}$/i.test(fileHash)) {
      throw new Error("fileHash must be a hexadecimal digest.");
    }
    const sourceIdentity = `file:${fileHash}`;
    const title = input.title?.trim() || fileName || "Captured file";
    return {
      canonicalSource: fileName ? `file:${fileName}` : source || "file:metadata",
      sourceType: "file",
      sourceIdentity,
      slug: identitySlug(sourceIdentity),
      title,
      fileName,
      fileHash,
      fileSize: Number.isFinite(input.fileSize) ? Number(input.fileSize) : null,
      fileType: input.fileType?.trim() || null,
    };
  }

  if (!source) throw new Error("source is required.");

  const url = parseUrl(source);
  if (!url) {
    const sourceIdentity = `internal:${compactHash(source.toLowerCase())}`;
    const title = input.title?.trim() || source.slice(0, 100);
    return {
      canonicalSource: source,
      sourceType: "generic-internal",
      sourceIdentity,
      slug: identitySlug(sourceIdentity),
      title,
      fileName,
      fileHash,
      fileSize: Number.isFinite(input.fileSize) ? Number(input.fileSize) : null,
      fileType: input.fileType?.trim() || null,
    };
  }

  const github = githubResource(url);
  if (github) {
    const title = input.title?.trim() || github.sourceIdentity.replace(/^github:/, "");
    return {
      ...github,
      slug: identitySlug(github.sourceIdentity),
      title,
      fileName,
      fileHash,
      fileSize: Number.isFinite(input.fileSize) ? Number(input.fileSize) : null,
      fileType: input.fileType?.trim() || null,
    };
  }

  const videoId = youtubeVideoId(url);
  if (videoId) {
    const sourceIdentity = `youtube:${videoId}`;
    const title = input.title?.trim() || `YouTube ${videoId}`;
    return {
      canonicalSource: `https://www.youtube.com/watch?v=${videoId}`,
      sourceType: "youtube",
      sourceIdentity,
      slug: identitySlug(sourceIdentity),
      title,
      fileName,
      fileHash,
      fileSize: Number.isFinite(input.fileSize) ? Number(input.fileSize) : null,
      fileType: input.fileType?.trim() || null,
    };
  }

  const canonicalSource = normalizeWebUrl(url);
  const hostname = url.hostname.toLowerCase();
  const sourceType: ResourceSourceType =
    url.pathname.toLowerCase().endsWith(".pdf") ? "pdf-document"
      : SOCIAL_HOSTS.has(hostname) ? "social"
        : COURSE_HOSTS.has(hostname) ? "tool-course"
          : "webpage";
  const sourceIdentity = `url:${canonicalSource}`;
  const title = input.title?.trim() || hostTitle(url);

  return {
    canonicalSource,
    sourceType,
    sourceIdentity,
    slug: identitySlug(sourceIdentity),
    title,
    fileName,
    fileHash,
    fileSize: Number.isFinite(input.fileSize) ? Number(input.fileSize) : null,
    fileType: input.fileType?.trim() || null,
  };
}

export function resourceRecordPath(resource: NormalizedResource): string {
  return `40 Resources/Resource Intelligence/Records/${resource.slug}.md`;
}

function yamlString(value: string | null | undefined): string {
  return JSON.stringify(value ?? "");
}

function lineValue(markdown: string, key: string): string | null {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return null;
  const raw = match[1].trim();
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw.replace(/^["']|["']$/g, "");
  }
}

function replaceLine(markdown: string, key: string, value: string | number): string {
  const line = `${key}: ${typeof value === "number" ? value : yamlString(value)}`;
  const pattern = new RegExp(`^${key}:.*$`, "m");
  return pattern.test(markdown) ? markdown.replace(pattern, line) : markdown;
}

export function renderResourceRecord(
  input: ResourceCaptureInput,
  resource: NormalizedResource,
  nowIso: string,
): string {
  const date = nowIso.slice(0, 10);
  const channel = input.captureChannel?.trim() || "lifeos-web";
  const nextAction = "Review source evidence, architecture classification, disposition, overlap, value, effort, risk, and implementation need.";

  return `---
type: resource
status: inbox
source: ${yamlString((input.source || resource.canonicalSource).trim())}
canonical_source: ${yamlString(resource.canonicalSource)}
source_type: ${yamlString(resource.sourceType)}
source_identity: ${yamlString(resource.sourceIdentity)}
capture_channel: ${yamlString(channel)}
captured_at: ${yamlString(nowIso)}
last_captured: ${yamlString(nowIso)}
capture_count: 1
processing_state: "needs-review"
architecture_classification: "PENDING"
disposition: "PENDING"
related_project: ${yamlString(input.relatedProject)}
related_area: ${yamlString(input.relatedArea)}
owner: ${yamlString(input.owner)}
review_date: ${yamlString(input.reviewDate || date)}
file_name: ${yamlString(resource.fileName)}
file_hash: ${yamlString(resource.fileHash)}
file_size: ${resource.fileSize ?? 0}
file_type: ${yamlString(resource.fileType)}
next_action: ${yamlString(nextAction)}
tags:
  - resource
  - resource-intelligence
---

# ${resource.title}

## Source

- Canonical source: ${resource.canonicalSource}
- Source type: ${resource.sourceType}
- Stable identity: ${resource.sourceIdentity}

## Evaluation

- Architecture classification: **PENDING**
- Disposition: **PENDING**
- Evidence: capture only; source inspection has not yet been performed.
- Next action: ${nextAction}

## Capture History

- ${nowIso} — captured through ${channel}.

## Governance

This record is canonical for the stable source identity above. Exact duplicates update this record instead of creating a competing record. Strategic classification and disposition require source-grounded review; capture alone does not prove adoption, value, or implementation.
`;
}

export function updateResourceRecord(
  existing: string,
  input: ResourceCaptureInput,
  resource: NormalizedResource,
  nowIso: string,
): string {
  const existingIdentity = lineValue(existing, "source_identity");
  if (existingIdentity && existingIdentity !== resource.sourceIdentity) {
    throw new Error("Existing resource identity does not match the captured source.");
  }

  const previousCount = Number(lineValue(existing, "capture_count") || "1");
  const nextCount = Number.isFinite(previousCount) ? previousCount + 1 : 2;
  const channel = input.captureChannel?.trim() || "lifeos-web";

  let updated = existing;
  updated = replaceLine(updated, "source", (input.source || resource.canonicalSource).trim());
  updated = replaceLine(updated, "canonical_source", resource.canonicalSource);
  updated = replaceLine(updated, "source_type", resource.sourceType);
  updated = replaceLine(updated, "source_identity", resource.sourceIdentity);
  updated = replaceLine(updated, "last_captured", nowIso);
  updated = replaceLine(updated, "capture_count", nextCount);

  const historyLine = `- ${nowIso} — captured again through ${channel}; exact identity dedupe matched the canonical record.`;
  if (updated.includes("## Capture History")) {
    updated = updated.replace("## Capture History\n", `## Capture History\n\n${historyLine}\n`);
  } else {
    updated += `\n## Capture History\n\n${historyLine}\n`;
  }

  return updated;
}
