# LifeOS Interactive Operations V1

## Purpose

Interactive Operations V1 turns the LifeOS portal into a controlled project-planning and change-request surface while preserving GitHub and the Markdown vault as the canonical source of truth.

## Included interactions

- Four project lanes: active, waiting, blocked, complete
- Native drag-and-drop status staging
- Keyboard-accessible status controls
- Priority editing
- Next-action editing
- Health filtering
- Staged-change review
- Validation before approval
- Structured approval package generation
- Downloadable JSON change manifest
- Authenticated GitHub change-request creation
- Isolated branch creation
- Draft pull-request creation

## Change flow

1. A user stages project status, priority, or next-action changes in the browser.
2. LifeOS validates the proposed values.
3. The user generates a `lifeos.change-plan.v1` approval package.
4. The user supplies the write authorization secret.
5. The server revalidates the complete package.
6. The server creates a new branch from `main`.
7. Only allowlisted project Markdown files and frontmatter fields are changed.
8. A draft GitHub pull request is created for review.
9. `main` remains unchanged until the pull request is explicitly merged.

## Safety model

The browser never receives the GitHub credential. GitHub writes occur only through the server route `POST /api/lifeos/change-plan`.

The route is default-deny and requires all of the following server environment variables:

- `LIFEOS_WRITE_ENABLED=true`
- `LIFEOS_WRITE_SECRET=<private authorization secret>`
- `LIFEOS_GITHUB_TOKEN=<fine-grained GitHub token>`

The GitHub token should be restricted to `ebyron357/LifeOS-Enterprise` with only the repository permissions required to read and write contents and create pull requests.

## Allowlisted scope

Only Markdown files under these paths may be changed:

- `Projects/*.md`
- `10 Projects/*.md`

Rejected paths include:

- templates
- traversal segments such as `..`
- non-Markdown files
- files outside the two approved project directories

Only these frontmatter fields may be changed:

- `status`
- `priority`
- `next_action`

Allowed statuses:

- `active`
- `waiting`
- `blocked`
- `complete`

Allowed priorities:

- `P0`
- `P1`
- `P2`
- `P3`

## Validation rules

- A package must use schema `lifeos.change-plan.v1`.
- A package must remain marked `proposal-only` when submitted.
- Each request may contain 1–25 project changes.
- Incomplete projects must retain a meaningful next action.
- Every canonical note must already contain valid YAML frontmatter.
- Approval is rejected when any path, status, priority, or next action fails validation.
- No direct commit to `main` is permitted.

## Audit and rollback

Each successful request returns:

- generated branch name
- draft pull-request number
- draft pull-request URL

The draft PR contains the affected project names and before-and-after status and priority values. Reviewers can inspect the exact Markdown diff before merging.

Rollback before merge: close the draft PR and delete its branch.

Rollback after merge: revert the merge commit through a new pull request. Do not force-push or silently rewrite canonical history.

## Verified checks

- Dashboard CI
- Vault Health
- Next.js production build through Vercel preview
- TypeScript compilation
- Mobile-responsive interaction controls
- Client-side GitHub credentials remain absent
- Server-side path and field allowlists are enforced
