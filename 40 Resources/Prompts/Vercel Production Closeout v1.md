---
type: prompt
title: Vercel Production Closeout
purpose: Verify production from the live Vercel deployment, not from a merged PR or an agent claim.
status: approved
version: 1.0
created: 2026-09-20
updated: 2026-09-20
owner: Byron
project:
tags: [prompt, vercel, closeout, sop]
task_types: [vercel, closeout, deployment]
trigger_context: [vercel, production, deploy, closeout]
recommended_context: After a merge that still needs live production proof.
source_path: 80 SOPs/LifeOS Owner's Operating Manual.md
source_origin: sop-extracted
canonical_prompt_id: prompt:vercel-production-closeout
supersedes:
superseded_by: prompt:vercel-production-closeout@2.0
last_result_status: SUPERSEDED
quality_state: SUPERSEDED
review_date: 2026-10-20
privacy_level: public-safe
---

# Vercel Production Closeout

## Purpose

Verify production from the live Vercel deployment, not from a merged PR or an agent claim.

## Prompt

```text
Verify the live Vercel production deployment.
Do not treat merged as deployed.
Do not paste secret values into chat.
Confirm production environment variables were applied, then redeploy if they changed.
Return exact evidence: deployment URL, SHA or ID, and what remains unverified.
```
