import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getVaultIndex } from "@/lib/vault/index";
import { isStale } from "./model";
import { buildPortfolioSnapshot } from "./portfolio-snapshot";
import type { PortfolioData } from "./portfolio-snapshot";

async function readVaultFile(relativePath: string): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), relativePath), "utf8");
  } catch {
    return "";
  }
}

export async function getPortfolioData(now = new Date()): Promise<PortfolioData> {
  const [index, registrySource] = await Promise.all([getVaultIndex(), readVaultFile("PROJECT_REPO_REGISTRY.md")]);
  return buildPortfolioSnapshot(index.notes, registrySource, now);
}

export type { PortfolioData };
export { isStale };
