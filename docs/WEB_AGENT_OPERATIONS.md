# Web Agent Operations

LifeOS Enterprise exposes a read-only agent-operating layer compatible with Cursor, Claude Code, OpenAI Codex, and other agents that read repository instructions.

## Universal instructions

- `AGENTS.md` — canonical vault and agent rules
- `docs/WEB_VAULT_PORTAL.md` — web portal architecture and privacy model
- `architecture/METADATA_SCHEMA.md` — metadata contract

## Worker model (read-only release)

| Role | Responsibility |
|------|----------------|
| Orchestrator | Inspect vault index, explain proposed changes, never auto-commit |
| Researcher | Gather context from approved notes only |
| File ops | Propose Markdown edits with metadata preserved |
| People CRM | Enrich `type: person` notes using evidence-based tiers |
| Inbox processor | Classify `01 Inbox/` captures without deleting source notes |

## Mutation rules

Autonomous destructive writes are disabled in this release. Any future write path must:

1. Inspect the target note and backlinks first
2. Explain the proposed change in plain language
3. Preserve canonical metadata (`type`, `status`, `priority`, `next_action`, `review_date`)
4. Avoid duplicate note creation
5. Never delete user content without explicit approval
6. Use Git history for reversibility

## Git-backed memory

The vault index is rebuilt from Git-tracked files on each deploy. Agents should treat Markdown frontmatter and note bodies as the durable memory substrate.

## Inspired patterns

Worker routing and evidence-based people enrichment patterns were adapted from public descriptions in COG Second Brain (MIT © 2025 Huy Tieu) and LifeOS-OSS. This document and implementation are original to LifeOS Enterprise.
