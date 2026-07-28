# LifeOS Interactive Operations V2

## Verified baseline

- Repository: `ebyron357/LifeOS-Enterprise`
- Default branch: `main`
- V2 branch: `agent/interactive-operations-v2`
- V2 base commit: `ae23a0b459b81e9c2405fa75736bd2f22b8240e1`
- Production deployment serves the V1 merge commit.
- Production V1 exposes only POST on `/api/lifeos/change-plan`; its environment-variable state cannot be read remotely.
- Open PRs #1, #2, #3, #25, #31, and #32 are older, unrelated or superseded work and are excluded from V2.

## V2 persistence architecture

The browser generates a proposal-only change package. The server route then:

1. Confirms the write service is explicitly enabled and fully configured.
2. Verifies the request origin, authorization secret, request size and best-effort rate limit.
3. Validates the schema, project paths, changed fields and allowed values.
4. Computes a deterministic SHA-256 plan ID.
5. Returns the existing pull request when the same plan was previously submitted.
6. Reads every project note from canonical `main` before creating a branch.
7. Rejects private, archived and template records.
8. Compares each submitted `from` value with the current canonical frontmatter value.
9. Returns a field-level HTTP 409 conflict report when the plan is stale.
10. Creates a deterministic isolated branch only after all validation passes.
11. Applies allowlisted frontmatter updates on that branch.
12. Records a structured audit artifact under `90 System/Audit/change-plans/`.
13. Opens a draft pull request against `main`.
14. Deletes the isolated branch if a later operation fails.

Direct commits to `main` are not implemented.

## Idempotency

The plan ID is derived from a canonical representation of the requested changes. The branch is named:

`lifeos/change-plan-<plan-id>`

Repeated submissions search for an existing pull request and return it instead of creating another branch or PR.

## Conflict protection

Before any branch is created, V2 verifies:

- the note exists at the submitted canonical path;
- the path is inside `Projects/` or `10 Projects/`;
- the path is not private, archived, templated or traversed;
- every submitted `from` value equals the current canonical value;
- the resulting status and priority are allowed;
- incomplete projects retain a meaningful next action.

Conflict responses include the project, path, field, expected value and current value.

## Authentication and request protection

Required server-side variables:

- `LIFEOS_WRITE_ENABLED=true`
- `LIFEOS_WRITE_SECRET`
- `LIFEOS_GITHUB_TOKEN`
- optional `LIFEOS_ALLOWED_ORIGIN`

Additional controls:

- constant-time secret comparison;
- same-origin or explicitly allowlisted origin;
- 64 KB request limit;
- maximum 25 project records;
- best-effort per-instance rate limiting;
- server-only GitHub credential;
- structured logs without credentials or raw request bodies.

## Audit evidence

Each change branch includes an audit JSON record containing:

- plan ID;
- timestamp;
- hashed requester context;
- base commit SHA;
- branch name;
- affected project paths;
- before and proposed field values;
- validation outcome;
- requested final outcome.

The created pull request records the PR URL and number in GitHub itself. The API response returns those values to the interface.

## User-visible states

The persistence panel distinguishes:

- checking;
- idle;
- validated;
- submitting;
- conflict;
- failed;
- completed.

It reports whether the service is configured, displays exact conflicts, permits safe retry, links to the generated PR, and can restore canonical values by reloading the page.

## Known limitations

- In-memory rate limiting is best effort in a serverless environment and should be replaced by a shared rate-limit store before broad multi-user exposure.
- Environment variables cannot be listed through the currently connected Vercel tool. Activation must therefore be verified through the V2 status endpoint and a controlled authenticated request.
- The branch audit record initially records `draft_pr_requested`; GitHub PR metadata remains the authoritative evidence of the final PR number and URL.
- No production write activation is part of this pull request.

## Rollback

Before merge: close the V2 pull request and delete `agent/interactive-operations-v2`.

After merge: revert the merge commit through a new pull request. Vercel will redeploy the previous application version. No project note is modified by deploying V2; actual note changes still require a separately reviewed draft PR.
