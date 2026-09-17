---
name: agent-work-order
description: "Draft a controlled, evidence-based agent assignment for meaningful work. Triggers: assign agent, hand this to Codex, Cursor prompt, Claude Code work order, implementation owner, agent task."
---

# Agent Work Order

**Status:** Draft — must pass repeatability QC before being treated as an approved organizational skill.

Use this skill whenever meaningful work is being delegated to an AI implementation or operations agent.

## Purpose

Turn an intended result into one bounded assignment with one accountable owner, a canonical source of truth, explicit scope, stop conditions, QC, and evidence.

## Prerequisites

Before drafting the work order, identify or retrieve:

- the exact outcome required;
- the current canonical repository/document/design/record;
- the accountable owner;
- the best available executor;
- current verified state and blockers;
- any approval-gated action;
- the evidence that would prove success.

If two sources appear canonical and conflict, stop and resolve the source-of-truth conflict before authorizing execution.

## Required Inputs

- Objective
- Business/cognitive/risk purpose
- Source of truth
- Target project/platform
- Allowed work
- Known exclusions / Do Not Touch
- Current state
- Next required outcome
- QC requirements
- Evidence requirements
- Approval boundaries

## Procedure

1. **State the objective in one outcome sentence.** Describe what must exist when finished, not the activity to perform.
2. **State why the work matters.** Connect it to revenue, delivery, savings, risk reduction, cognitive load, reusable capability/IP, or another explicit strategic reason.
3. **Name one accountable owner.** Other agents may support or verify, but do not create competing ownership.
4. **Name the canonical source of truth.** Use the exact repository, branch/PR when relevant, governing document, approved design, or system record.
5. **Define Allowed Work.** List what the executor may inspect, change, test, or create.
6. **Define Do Not Touch.** Protect unrelated projects, production data, approved designs, secrets, and other out-of-scope systems.
7. **Give the execution sequence.** Start from verified current state; do not ask the agent to rebuild context already available from connected systems.
8. **Define stop conditions.** Stop for unresolved source conflicts, unavailable required credentials, consequential owner approval, legal/licensing uncertainty, destructive action, or evidence that the proposed path is unsafe/wrong.
9. **Define continuous QC.** Include relevant lint, typecheck, tests, browser checks, security checks, source verification, or business-rule validation throughout execution.
10. **Define required evidence.** Require concrete artifacts such as commit SHA, PR, tests, browser evidence, deployment ID/SHA, API/database result, or independent audit result.
11. **Define final status vocabulary.** Use evidence-based states such as DONE/VERIFIED, OWNER-BLOCKED, CODE-BLOCKED, FAILED-QC, or READY-FOR-REVIEW. Never allow an unsupported PASS.
12. **Require a checkpoint.** The agent's final report must include last completed step, current state, unresolved blocker, exact next action, and evidence links.

## Required Work Order Shape

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

## Decision Rules

- Prefer retrieving real repository/tool state over asking for repeated manual copy/paste.
- Do not create a second implementation lane when an active canonical lane already exists.
- Reversible preparation should continue when safe; consequential actions remain approval-gated.
- A missing credential is `OWNER ACTION`, not evidence that engineering is incomplete.
- A builder does not independently certify its own work as verified complete.

## Verification

This skill's output passes when an independent reader can answer, without reconstructing the conversation:

- What exact result is required?
- Why does it matter?
- Who owns it?
- What source is authoritative?
- What may and may not be changed?
- Where should the agent stop?
- How is quality checked?
- What proof is required?
- What happens next if the work cannot finish?

## Skill QC Gate

Keep this skill **Draft** until:

1. another agent executes at least one real work order created with it;
2. the intended outcome is achieved or correctly stopped at a genuine boundary;
3. independent QC confirms the work order prevented scope drift and produced usable evidence.
