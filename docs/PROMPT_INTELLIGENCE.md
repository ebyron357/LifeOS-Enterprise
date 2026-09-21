# LifeOS Prompt Intelligence

**Implementation status:** Canonical prompt model, library UI, deterministic recommendation, Continuity linkage, and read-only agent API.  
**System owner:** Prompt Intelligence  
**Canonical storage:** `40 Resources/Prompts/` as `type: prompt` Markdown  
**Write model:** Vault Markdown plus existing draft-PR path. This slice does not add a new write API.

## Owner problem

Prompts were scattered across Resources, AI roles, SOPs, skills, and project docs. The owner rebuilt them from memory instead of reusing a proven one.

## Flow

```text
Existing vault / Resource Intelligence EXTRACT / SOP / skill / AI role
  → one canonical Prompt record
  → exact identity dedupe (normalized body hash)
  → version + supersedes
  → /prompts search + conservative recommendation
  → Continuity resume package includes the matching prompt
  → GET /api/lifeos/prompts for agents
```

This is not a second command center and not a second intake path.

## Identity

- `canonical_prompt_id` is stable across versions.
- Exact duplicate key is `prompt-body:` plus a hash of the normalized prompt body.
- Display title is not identity.
- Possible semantic duplicates are review candidates only. They are not auto-merged.

## Result states

`UNTESTED | USED | PASS | PARTIAL | FAILED | SUPERSEDED`

A prompt is proven only when evidence supports `PASS`. Migrated records start as `UNTESTED` unless already superseded.

## Recommendation

Deterministic token matching against `task_types`, `trigger_context`, project, and title. Weak context returns nothing. Failed prompts surface a warning rather than silent reuse.

## Continuity

The resume package can include `relevantPrompts`. Example speech:

`You already have a prompt for this: Vercel Production Closeout v2.0.`

If a later usage record is `PASS`, speech becomes `Last implementation prompt used: …`.

## Resource Intelligence

New prompt-like captures still enter as `type: resource`. After `EXTRACT`, canonicalize the reusable body under `40 Resources/Prompts/`. Prompt Intelligence does not create a competing capture form.

## Security

- `privacy_level: private` is excluded from the web vault index.
- Agent API omits private bodies even when `includeBody=1`.
- Secret-like values are redacted.
- Imported external text is sanitized with `sanitizeImportedText` and is never treated as LifeOS policy.
- Git history remains the detailed version log; frontmatter tracks current/superseded versions.

## Explicitly not claimed

- Vector database / Graphiti / Mem0 / Zep
- Automatic semantic merge
- Durable usage writes without a vault/PR edit
- Proven success scores without evidence
