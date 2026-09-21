---
type: prompt
title: Automation Candidate
purpose: Identify the top automation candidate that saves the most time with the lowest risk.
status: approved
version: 1.0
created: 2026-07-07
updated: 2026-09-20
owner: Byron
agent: Automation Advisor
tags: [prompt, ai-role, automation]
task_types: [automation, candidate]
trigger_context: [automation candidate, workflows, lowest risk]
recommended_context: Current workflows and active projects when choosing the next automation.
source_path: AI/Automation Advisor.md
source_origin: embedded-ai-role
canonical_prompt_id: prompt:automation-candidate
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: internal
---

# Automation Candidate

## Purpose

Identify the top automation candidate that saves the most time with the lowest risk.

## Recommended context

Current workflows and active projects. Keep the Automation Advisor role file as the agent instruction.

## Prompt

```text
Review the current workflows and active projects. Identify the top automation candidate that saves the most time with the lowest risk. Return the exact next step to implement it.
```
