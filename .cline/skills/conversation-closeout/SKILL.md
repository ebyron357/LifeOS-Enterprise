---
name: conversation-closeout
description: "Convert a meaningful conversation into durable decisions, execution, evidence requirements, memory, and reusable learning. Triggers: close this out, wrap this conversation, what did we decide, push this into LifeOS, capture next steps."
---

# Conversation Closeout

**Status:** Draft — must pass repeatability QC before being treated as an approved organizational skill.

Use this skill at the end of a meaningful work conversation or whenever the conversation has produced decisions, assignments, resources, blockers, lessons, or implementation changes.

## Purpose

Prevent important work from remaining trapped inside chat or voice history. Convert the session into durable operational objects with ownership, next action, QC, and evidence.

## Required Inputs

- Conversation outcome and material decisions
- Active project/platform context
- Newly introduced resources/tools/repos
- Work already executed
- Unresolved blockers
- Existing canonical project/task/resource records where available

## Procedure

1. **Extract only material items.** Identify decisions, tasks, blockers, resources, changes, evidence, lessons, skill candidates, SOP candidates, automation candidates, and ROI implications.
2. **Resolve the source of truth.** For each material item, identify the current canonical project, repository, governing document, task, or resource record. Do not create a competing record when one already exists.
3. **Record decisions.** Capture the decision, reason, owner, affected area, evidence/context, and what it supersedes.
4. **Convert action into execution.** Every actionable item gets one accountable owner, exact next action, status, QC method, and evidence requirement.
5. **Route resources.** New repos, videos, documents, tools, prompts, or links enter Resource Intelligence for classification and `ADOPT / ADAPT / EXTRACT / WATCH / ARCHIVE / REJECT` disposition.
6. **Record blockers honestly.** Separate engineering blockers from owner-only actions such as credentials, payment, legal approval, MFA, destructive operations, or consequential production decisions.
7. **Capture the checkpoint.** Record last completed step, current state, blocker, next action, owner, source of truth, what not to repeat, and existing evidence.
8. **Capture learning candidates.** Ask whether the session created a reusable skill, human lesson, teaching guide, SOP, failure-library record, or automation opportunity. Create only materially useful assets.
9. **Update living documents correctly.** When an approved operating rule changed, retrieve the current governing document and replace it with one complete merged version rather than creating a patch fragment.
10. **Close only when structured.** If meaningful items still exist only in the conversation, the conversation remains operationally open.

## Required Output

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

## Decision Rules

- Never create a duplicate task simply to prove the conversation was captured.
- Never treat Slack or chat history as permanent project truth.
- Never mark implementation complete from an agent's unsupported claim.
- If an operating rule changes, the latest complete governing document becomes the new canonical source after approval.
- If a captured item has no action but durable reference value, archive it deliberately rather than leaving it unprocessed.

## Verification

The closeout passes when a person or agent returning later can resume without reading the original conversation and can identify:

- what was decided;
- what remains;
- who owns it;
- the exact next action;
- the authoritative source;
- the blocker;
- the proof already collected;
- the proof still required;
- what new reusable knowledge was created.

## Skill QC Gate

Keep this skill **Draft** until:

1. it is used on at least one real conversation containing multiple decisions/actions;
2. another agent can resume the work from the generated durable records without reading the original transcript;
3. independent review confirms no material item was lost or duplicated.
