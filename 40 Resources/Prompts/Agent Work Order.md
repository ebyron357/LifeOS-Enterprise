---
type: prompt
title: Agent Work Order
purpose: Turn an intended result into one bounded assignment with owner, source of truth, scope, stop conditions, QC, and evidence.
status: draft
version: 0.1
created: 2026-09-20
updated: 2026-09-20
owner: Byron
agent: implementation-agent
tags: [prompt, work-order, skill-link]
task_types: [work-order, implementation, assignment]
trigger_context: [work order, assign agent, cursor prompt, claude code, implementation owner]
recommended_context: Meaningful work being delegated to Cursor, Claude Code, or Codex. Do not replace the skill.
source_path: .cline/skills/agent-work-order/SKILL.md
source_origin: skill-extracted
canonical_prompt_id: prompt:agent-work-order
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: internal
---

# Agent Work Order

## Purpose

Turn an intended result into one bounded assignment with owner, source of truth, scope, stop conditions, QC, and evidence.

## Recommended context

Use with `.cline/skills/agent-work-order/SKILL.md`. This record is the reusable work-order shape, not the whole skill.

## Expected input

Objective, business purpose, source of truth, allowed work, exclusions, current verified state, QC, evidence, approval boundaries.

## Prompt

```text
OBJECTIVE

BUSINESS PURPOSE

ACCOUNTABLE OWNER

EXECUTOR

SOURCE OF TRUTH

CURRENT VERIFIED STATE

ALLOWED WORK

DO NOT TOUCH

REQUIRED STEPS

CONTINUOUS QC

REQUIRED EVIDENCE

STOP CONDITIONS / OWNER ACTIONS

EXPECTED OUTPUT

ROI / VALUE CONNECTION

FINAL STATUS + CHECKPOINT
```
