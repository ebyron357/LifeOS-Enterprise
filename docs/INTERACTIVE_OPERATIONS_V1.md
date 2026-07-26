# LifeOS Interactive Operations V1

## Purpose

Interactive Operations V1 turns the read-only LifeOS portal into a controlled project-planning surface without granting uncontrolled write access to the canonical Markdown vault.

## Included interactions

- Four project lanes: active, waiting, blocked, complete
- Native drag-and-drop status staging
- Keyboard-accessible status controls
- Priority editing
- Next-action editing
- Health filtering
- Staged-change review
- Validation before approval
- Proposal-only approval package generation
- Downloadable JSON change manifest

## Safety model

The browser interface does not directly edit Markdown, create commits, or alter GitHub data. All changes are maintained in component state until the user generates an approval package.

The approval package uses schema `lifeos.change-plan.v1` and records:

- project name
- canonical vault path
- changed frontmatter field
- previous value
- proposed value
- generation timestamp
- write mode

The current write mode is `proposal-only`.

## Validation rules

- Incomplete projects must retain a meaningful next action.
- Approval is disabled while validation errors remain.
- Refreshing the page restores canonical vault state.
- No project template records are included in operational data.

## Verified checks

- Dashboard CI: PASS
- Vault Health: PASS
- Next.js production build: PASS through Vercel preview
- TypeScript compilation: PASS
- Mobile-responsive board styles included
- Canonical vault write paths remain absent from the client component

## Future controlled persistence

A later release may convert a validated approval package into a GitHub-backed change request. That layer must include authentication, path allowlisting, frontmatter-only mutation, before-and-after evidence, branch and pull-request creation, and rollback instructions.
