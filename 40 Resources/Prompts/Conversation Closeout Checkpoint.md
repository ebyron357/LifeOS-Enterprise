---
type: prompt
title: Conversation Closeout Checkpoint
purpose: Convert a meaningful conversation into decisions, execution, evidence, checkpoint, and learning candidates.
status: draft
version: 0.1
created: 2026-09-20
updated: 2026-09-20
owner: Byron
tags: [prompt, closeout, checkpoint, skill-link]
task_types: [conversation-closeout, checkpoint]
trigger_context: [close this out, wrap this conversation, conversation closeout]
recommended_context: End of a meaningful work conversation. Keep the skill as the procedure.
source_path: .cline/skills/conversation-closeout/SKILL.md
source_origin: skill-extracted
canonical_prompt_id: prompt:conversation-closeout-checkpoint
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: internal
---

# Conversation Closeout Checkpoint

## Purpose

Convert a meaningful conversation into decisions, execution, evidence, checkpoint, and learning candidates.

## Recommended context

Use with `.cline/skills/conversation-closeout/SKILL.md`. Route new prompts and resources through Resource Intelligence; write checkpoints with `99 Templates/Resume Checkpoint.md`.

## Prompt

```text
DECISIONS
- durable decision records or "none"

EXECUTION
- owner
- exact next action
- current status
- QC
- evidence required

RESOURCES
- source
- classification/status
- disposition or processing state

BLOCKERS / OWNER ACTIONS
- exact boundary and what is required

CHECKPOINT
- last completed
- current state
- next action
- do not repeat
- evidence

LEARNING / STANDARDIZATION
- skill, lesson, SOP, automation, failure-library, or capability candidate

SESSION STATUS
- CLOSED or OPEN, with reason
```
