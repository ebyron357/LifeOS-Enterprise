# Contributing to LifeOS Core

## Scope

Contribute executable implementation only. Product requirements, ADRs, and standards must be changed in the specification repository first and then referenced here.

## Workflow

1. Link the governing specification doc(s) in your PR description.
2. Implement only traceable changes.
3. Run validation locally:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
4. Ensure CI is green.

## Commit Standard

Use Conventional Commits, for example:

- `feat(core): add event bus handler pipeline`
- `fix(database): guard invalid postgres url`

## Pull Requests

Include:

- Summary of implementation change
- Specification references
- Test evidence
- Security impact notes
