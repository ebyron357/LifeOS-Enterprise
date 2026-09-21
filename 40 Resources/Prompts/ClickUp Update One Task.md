---
type: prompt
title: ClickUp Update One Task
purpose: Update one existing ClickUp task with verified state, status, next action, and evidence. Do not create a duplicate.
status: approved
version: 1.0
created: 2026-09-20
updated: 2026-09-20
owner: Byron
tags: [prompt, clickup, sop]
task_types: [clickup, task-update]
trigger_context: [clickup, update task, do not create a new task]
recommended_context: An existing ClickUp task that needs a truthful status and next action.
source_path: 80 SOPs/LifeOS Owner's Operating Manual.md
source_origin: sop-prompt-library
canonical_prompt_id: prompt:clickup-update-one-task
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: public-safe
---

# ClickUp Update One Task

## Purpose

Update one existing ClickUp task with verified state, status, next action, and evidence. Do not create a duplicate.

## Recommended context

Use when a ClickUp task is stale and the vault already has the facts.

## Expected input

Task name, current verified facts, target status, one next action, evidence link.

## Prohibited actions

Do not create a new task. Do not change any other task or structure.

## Prompt

```text
Update the existing task: [TASK NAME]
Do not create a new task.
Current verified state: [FACTS]
Set status to: [STATUS]
Next Action: [ONE ACTION]
Add evidence: [LINK/RESULT]
Do not change any other task or structure.
```
