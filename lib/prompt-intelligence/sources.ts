import "server-only";

import { getVaultIndex } from "@/lib/vault/index";
import { catalogPromptsFromNotes } from "./catalog";
import type { PromptRecord } from "./model";

export async function collectPromptRecords(): Promise<PromptRecord[]> {
  const index = await getVaultIndex();
  return catalogPromptsFromNotes(index.notes);
}
