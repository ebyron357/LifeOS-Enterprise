---
type: prompt
title: n8n Controlled Proof
purpose: Build one controlled n8n proof against an existing object without touching production or creating duplicates.
status: approved
version: 1.0
created: 2026-09-20
updated: 2026-09-20
owner: Byron
tags: [prompt, n8n, sop, automation]
task_types: [n8n, automation-proof]
trigger_context: [n8n, controlled proof, do not touch production]
recommended_context: Testing one automation against a known source and existing target object.
source_path: 80 SOPs/LifeOS Owner's Operating Manual.md
source_origin: sop-prompt-library
canonical_prompt_id: prompt:n8n-controlled-proof
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: public-safe
---

# n8n Controlled Proof

## Purpose

Build one controlled n8n proof against an existing object without touching production or creating duplicates.

## Prompt

```text
Build a controlled proof only.
Source: [EVENT]
Target: [EXISTING OBJECT ID]
Validate: [TOKEN / SOURCE]
Action: [ONE UPDATE]
Do not create duplicates.
Do not touch production.
Do not claim success unless the target actually changed.
```
