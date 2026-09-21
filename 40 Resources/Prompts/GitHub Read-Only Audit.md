---
type: prompt
title: GitHub Read-Only Audit
purpose: Inspect repository evidence without modifying files and return exact paths, unknowns, and one next action.
status: approved
version: 1.0
created: 2026-09-20
updated: 2026-09-20
owner: Byron
tags: [prompt, github, audit, sop]
task_types: [github, audit, inspect]
trigger_context: [github, read-only, audit, inspect, copilot]
recommended_context: Before changing code, when the need is evidence rather than a patch.
source_path: 80 SOPs/LifeOS Owner's Operating Manual.md
source_origin: sop-prompt-library
canonical_prompt_id: prompt:github-read-only-audit
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: public-safe
---

# GitHub Read-Only Audit

## Purpose

Inspect repository evidence without modifying files and return exact paths, unknowns, and one next action.

## Prohibited actions

Do not modify files. Do not guess. Mark unknowns UNKNOWN.

## Prompt

```text
Perform a READ-ONLY audit.
Do not modify files.
Return exact file paths and evidence.
Mark unknowns UNKNOWN.
Do not guess.
Give me one next action.
```
