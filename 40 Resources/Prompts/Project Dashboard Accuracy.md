---
type: prompt
title: Project Dashboard Accuracy
purpose: Confirm status, priority, blocker, and next action for active projects so the dashboard stays accurate.
status: approved
version: 1.0
created: 2026-07-07
updated: 2026-09-20
owner: Byron
agent: Project Manager
tags: [prompt, ai-role, project-manager, dashboard]
task_types: [audit, project, dashboard]
trigger_context: [project notes, dashboard accurate, status, next action, blocker]
recommended_context: Active project notes before trusting dashboard tables.
source_path: AI/Project Manager.md
source_origin: embedded-ai-role
canonical_prompt_id: prompt:project-dashboard-accuracy
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: internal
---

# Project Dashboard Accuracy

## Purpose

Confirm status, priority, blocker, and next action for active projects so the dashboard stays accurate.

## Recommended context

Current project notes. Keep the Project Manager role file as the agent instruction.

## Prompt

```text
Audit the current project notes. For each active project, confirm status, priority, blocker, and next action. Return only the actions needed to make the dashboard accurate.
```
