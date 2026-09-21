---
type: prompt
title: Vercel Production Closeout
purpose: Close out a Vercel production change from live deployment evidence, including env-var redeploy, secret safety, and remaining smoke tests.
status: approved
version: 2.0
created: 2026-09-20
updated: 2026-09-20
owner: Byron
project:
tags: [prompt, vercel, closeout, production, sop]
task_types: [vercel, closeout, deployment, production]
trigger_context: [vercel, production, deploy, closeout, environment variables, lead routing]
recommended_context: Client or LifeOS production closeout after code merge. Matches work like D'Affordable Homes or Charlotte Real Estate System production verification.
source_path: 80 SOPs/LifeOS Owner's Operating Manual.md
source_origin: sop-extracted
canonical_prompt_id: prompt:vercel-production-closeout
supersedes: prompt:vercel-production-closeout@1.0
superseded_by:
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: public-safe
---

# Vercel Production Closeout

## Purpose

Close out a Vercel production change from live deployment evidence, including env-var redeploy, secret safety, and remaining smoke tests.

## Recommended context

Use when the current action is a Vercel/production/deploy closeout for any project, including D'Affordable Homes or Charlotte Real Estate System.

## Expected input

Project name, canonical repo, expected production URL, whether env vars changed, remaining smoke-test, and what must stay owner-gated.

## Expected output

Live deployment identity, whether env vars required a redeploy, secret-safety confirmation, remaining unverified steps, and one next action.

## Constraints

- Verify production from the live Vercel deployment, not from a merged PR or an agent claim.
- After adding or changing environment variables, redeploy so the deployment picks them up.
- Environment variables are secrets/configuration; do not paste secret values into chat.
- Use Production scope for production-only credentials unless the runbook explicitly says otherwise.

## Prohibited actions

- Do not treat merged as deployed.
- Do not paste service-role keys, API tokens, salts, cron secrets, passwords, or private integration tokens into chat, screenshots, docs, or ClickUp comments.
- Do not invent a production URL, SHA, or smoke-test result.

## Evidence required

Deployment URL, deployment SHA or ID, env-var change yes/no plus redeploy evidence, remaining smoke test, and unknowns marked UNKNOWN.

## Prompt

```text
OBJECTIVE
Close out Vercel production for [PROJECT] from live deployment evidence.

SOURCE OF TRUTH
- Canonical repository/branch/PR: [REPO]
- Expected production URL: [URL]
- Governing runbook: LifeOS Owner's Operating Manual §7 Vercel

VERIFY
1. Confirm the live Vercel production deployment, not the merged PR and not an agent claim.
2. Record deployment URL and SHA or ID.
3. If environment variables changed, confirm Production scope and that a redeploy picked them up.
4. Do not paste secret values. Report only whether required keys are present, not their values.
5. State the remaining live smoke test or database check, if any.
6. Mark anything unverified as UNKNOWN.

DO NOT
- Treat merged as deployed.
- Touch unrelated Vercel projects.
- Claim PASS without live evidence.

OUTPUT
- current production identity
- env-var/redeploy status
- remaining closeout step
- owner-gated items
- one next action
```
