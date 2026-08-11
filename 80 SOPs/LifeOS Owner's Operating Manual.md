---
type: sop
status: active
area: LifeOS
created: 2026-08-11
updated: 2026-08-11
tags:
  - life-os
  - operating-manual
  - owner-guide
  - adhd-friendly
  - tbi-friendly
aliases:
  - LifeOS Owner's Operating Manual
  - LifeOS Guidebook
---

# LifeOS Owner's Operating Manual

**Obsidian • ClickUp • GitHub • n8n • Vercel • Supabase**

> [!info] Built for how you actually work
> Short instructions. One decision at a time. Large type. Clear tool boundaries. No guessing. No unnecessary nesting. This manual is designed to reduce cognitive load and make it easy to recover when you lose your place.

Version 1.0 • August 2026

# 1. If You Forget Everything Else

> [!tip] THE ONE RULE
> Obsidian tells you WHAT matters and WHY. ClickUp tells you WHAT TO DO NEXT. GitHub holds the technical truth. n8n moves information between systems.

## Your normal daily flow

1. Open Obsidian → 00 Home → Life OS.
2. Look at the current context: projects, reviews, notes, decisions, and what matters.
3. Open ClickUp → LIFE-OS-OPERATIONS → Today or Executive Overview.
4. Work the highest-priority real task. Do not create a new task unless the current work truly requires one.
5. When technical work changes, use GitHub. When automation is needed, use n8n.
6. Record evidence in ClickUp before marking work Complete.

> [!tip] IF YOU GET LOST
> Ask only three questions:
> 1. What am I trying to finish?
> 2. Which tool owns that kind of information?
> 3. What is the ONE next action?

## Tool map

| Tool | Use it for | Do NOT use it for |
| --- | --- | --- |
| Obsidian | Context, notes, reviews, project intent | Daily task-status tracking |
| ClickUp | Tasks, priority, blockers, next actions, evidence | Long-form knowledge or source code |
| GitHub | Code, PRs, commits, CI, technical evidence | Personal planning or daily task lists |
| n8n | Automation and orchestration | Replacing human approval or business rules |
| Vercel | Deployment, environment variables, production runtime | Project planning |
| Supabase | Database, migrations, backend data | Task tracking or documentation |

# 2. Your LifeOS System in Plain English

> [!info] SYSTEM MODEL
> LifeOS Enterprise is the control plane. Obsidian is the human-facing brain. ClickUp is the execution board. GitHub is technical truth. n8n is the automation engine.

Think of the system like this:

```text
OBSIDIAN
Context / Decisions / Reviews
          ↓
CLICKUP
Tasks / Priority / Blockers / Evidence
          ↓
GITHUB  ↔  n8n
Code        Automation
          ↓
VERCEL / SUPABASE
Production / Data
```

## Verified working parts

- [x] LifeOS core dashboards visually verified in Obsidian.
- [x] LIFE-OS-OPERATIONS structure created in ClickUp.
- [x] Evidence-backed tasks loaded into ClickUp.
- [x] GitHub → n8n → ClickUp automation proof passed.
- [x] n8n updated the existing ClickUp proof task and moved it to Review.
- [x] ClientVerse production Supabase project created and production configuration work started.

> [!warning] IMPORTANT AUTOMATION NOTE
> The GitHub → n8n → ClickUp proof worked, but the proof comment ran multiple times. The automation path is connected; duplicate-run/idempotency protection still needs hardening before broad production automation.

# 3. Obsidian: Your Brain and Control Plane

> [!info] WHEN TO OPEN OBSIDIAN
> Open Obsidian when you need context, direction, memory, reviews, project intent, or a place to capture information.

## Start here every time

1. Open the LifeOS-Enterprise vault.
2. In the left sidebar open 00 Home.
3. Open Life OS.
4. Read the Start Here section.
5. If you need today's work, open today's Daily Note or go to ClickUp for execution.

## The five core dashboards

| Dashboard | What it is for |
| --- | --- |
| 00 Home/Life OS.md | Main home page and navigation. |
| Command Center/Daily Command Center.md | Daily execution context. |
| Dashboards/Weekly Review.md | Weekly reset and review. |
| Dashboards/Monthly Review.md | Monthly direction and pattern review. |
| 00 Home/Personal Growth Dashboard.md | Personal growth focus and evidence. |

## Capture something without thinking too hard

1. If you do not know where something belongs, put it in 01 Inbox.
2. Do not stop to perfectly categorize it.
3. Process the Inbox during your daily or weekly review.
4. Move it only after you know what it is.

## Daily Notes

- Location: 70 Journal/Daily
- Template: 99 Templates/Daily Note
- Use the daily note for what happened, what matters, decisions, and observations.
- Do not turn the Daily Note into a second ClickUp task list.

## Projects in Obsidian

- A project note explains the outcome, why it matters, important context, related areas/goals, and evidence.
- The active work itself should be operationalized in ClickUp.
- Use Obsidian to remember the story; use ClickUp to move the work.

## Weekly review

- [ ] Open Dashboards/Weekly Review.md.
- [ ] Review Inbox.
- [ ] Review active projects.
- [ ] Review blocked and waiting items.
- [ ] Record decisions.
- [ ] Confirm ClickUp reflects the real next actions.

> [!tip] DO NOT DELETE LEGACY FOLDERS YET
> The numbered PARA structure is the standard going forward. Legacy flat folders should be reviewed and archived safely, not deleted blindly.

# 4. ClickUp: Your Execution Layer

> [!info] WHEN TO OPEN CLICKUP
> Open ClickUp when you are ready to DO something: start work, see priority, record a blocker, update status, or prove completion.

## Your Space

**LIFE-OS-OPERATIONS**

- Core Systems
- Client Delivery
- Product Systems
- Automation
- Portfolio Cleanup

## Your task statuses

| Status | Meaning |
| --- | --- |
| Not Started | The task exists but is not ready to work. |
| Ready | You can work it now. |
| In Progress | You are actively working it. |
| Blocked | Something prevents progress. |
| Waiting | You need another person/system/event. |
| Review | Work is done; evidence needs checking. |
| Complete | Evidence is accepted. Stop working it. |

## Priority

- Urgent = P0 Critical
- High = P1 High
- Normal = P2 Medium
- Low = P3 Low

## How to work a task

1. Open the task.
2. Read Objective.
3. Read Current State.
4. Read Blocker and Waiting On.
5. Read Next Action.
6. Do only that next action.
7. Add evidence.
8. Move to Review.
9. After evidence is checked, move to Complete.

> [!warning] THE MOST IMPORTANT CLICKUP RULE
> Do not mark Complete because you are tired of the task. Mark Complete only when the evidence proves the success criteria.

## What counts as evidence

- A GitHub PR or commit.
- A successful CI check.
- A screenshot of the working result.
- A verified deployment.
- A database record.
- A ClickUp verification note.
- A linked source file or runbook.

## If ClickUp is stale

1. Do not trust an old blocker if you know the situation changed.
2. Update the existing task with verified facts.
3. Clear resolved blockers.
4. Set one new Next Action.
5. Do not create a duplicate task.

# 5. GitHub: Technical Source of Truth

> [!info] WHEN TO OPEN GITHUB
> Use GitHub when the work involves code, files, repositories, branches, pull requests, CI checks, or technical evidence.

## Normal code-change flow

1. Work on a branch, not directly on main.
2. Make the change.
3. Run the relevant checks.
4. Open a pull request.
5. Read the diff.
6. Wait for required checks to go green.
7. Merge into main.
8. Use the merged result as evidence in ClickUp.

## If a file is 'missing'

1. Check whether you are looking at main.
2. Check whether the file exists on another branch.
3. Do not assume a 404 means the file never existed.
4. Merge the approved branch to main before another system depends on the file.

## Repository rule

> [!tip] ONE ACTIVE REPO PER PROJECT
> Do not let duplicate repositories become duplicate projects. Archive or consolidate only after unique assets and dependencies are reviewed.

## What NOT to do

- Do not merge because a branch 'looks fine.' Check status and diff.
- Do not create a second repo because you cannot find the first one.
- Do not treat an open PR as implemented capability.
- Do not delete legacy repos without unique-asset verification.

# 6. n8n: Your Automation Engine

> [!info] WHEN TO OPEN n8n
> Use n8n when the same information needs to move between tools automatically, or when a repeatable workflow should run without manual copying.

## Your proven automation path

**GitHub Issue → n8n → ClickUp Task Update**

- GitHub issue #50 was used as the controlled proof event.
- n8n read the issue and validated a proof token.
- n8n updated an existing ClickUp task.
- n8n added the GitHub source URL and proof token.
- n8n changed the ClickUp task status to Review.

## How to read an n8n workflow

1. Start at the leftmost trigger node.
2. Follow the arrows left to right.
3. Green check = that node succeeded.
4. Red node = stop there and read the exact error.
5. Do not fix downstream nodes until the first failure is understood.

## How to test safely

1. Use a controlled test event.
2. Use a unique proof token.
3. Target an existing test task.
4. Prevent production actions.
5. Verify the destination actually changed.
6. Only then call the automation connected.

> [!warning] CURRENT HARDENING ITEM
> The proof comment was written multiple times. Before broad automation, add an idempotency guard so the same source event cannot update the same destination repeatedly.

## Credential rule

- Use secure credential cards/stores.
- Never paste API keys or tokens into AI chat.
- If there are two credentials with similar names, test access instead of guessing.
- If a credential fails, stop and identify exactly which connection is missing.

# 7. Vercel and Supabase: Production Tools

> [!tip] ONLY OPEN THESE WHEN A TASK SENDS YOU THERE
> Vercel and Supabase are technical production tools. They are not where you plan your day.

## Vercel

- Purpose: deploy websites/apps and hold production environment variables.
- After adding or changing environment variables, redeploy so the deployment picks them up.
- Environment variables are secrets/configuration; do not paste secret values into chat.
- Use Production scope for production-only credentials unless the runbook explicitly says otherwise.

## Supabase

- Purpose: database/backend.
- Keep unrelated systems in separate projects when possible.
- Do not reuse a database just because a Supabase project already exists.
- Run repository migrations against the correct project before testing application features.

## ClientVerse example

1. A dedicated Supabase project named clientverse-production was created.
2. The unrelated cv-engine project was not reused.
3. The ClientVerse lead-gateway SQL migration was run against the new project.
4. Vercel received the required production configuration.
5. The remaining closeout step is a live lead-form smoke test plus database verification.

> [!warning] SECRET SAFETY
> Do not put service-role keys, API tokens, salts, cron secrets, passwords, or private integration tokens into chat messages, screenshots, docs, or ClickUp comments.

# 8. Where Do I Go? Decision Page

| If I need to… | Go to… | Then… |
| --- | --- | --- |
| Remember what a project is for | Obsidian | Open the project/business note. |
| Know what to work on next | ClickUp | Open Today / highest priority task. |
| Record a blocker | ClickUp | Update Blocker + Next Action. |
| Capture a random thought | Obsidian | Put it in 01 Inbox. |
| Change code | GitHub | Branch → PR → checks → merge. |
| See why CI failed | GitHub | Open the failing check/log. |
| Automate repeated work | n8n | Build/test a controlled workflow. |
| Change production env vars | Vercel | Settings → Environment Variables. |
| Change database schema | Supabase | Run the approved migration. |
| Prove work is finished | ClickUp | Attach/link evidence, move to Review/Complete. |

# 9. When Something Is Not Working

> [!warning] NO-GUESSING RECOVERY PROTOCOL
> If the screen does not match the instruction, STOP. Do not click around hoping. Use the exact screen in front of you.

## Do this in order

1. State the exact tool you are in.
2. State the exact page/screen name.
3. Read the exact error text or send a screenshot.
4. Identify the first failed step.
5. Fix only that step.
6. Re-run once.
7. Record the result.

## Common problems

| Problem | What it usually means | What to do |
| --- | --- | --- |
| 404 / file not found | Wrong branch, private access, or wrong path | Verify repo + branch + permissions before rebuilding. |
| n8n red node | First real workflow failure | Read that node's exact error; do not guess downstream. |
| ClickUp task is wrong/stale | Reality changed after task creation | Update the existing task; do not duplicate. |
| Credential unauthorized | Wrong token/type/user/permissions | Verify credential type and access; do not keep generating tokens blindly. |
| Vercel change not visible | Deployment did not pick up new config | Redeploy production. |
| Supabase has wrong tables | Wrong project | Stop. Identify or create the correct project. |

# 10. Daily and Weekly Operating Cards

## Daily Start - 5 minutes

- [ ] Open Obsidian → 00 Home → Life OS.
- [ ] Read what matters today.
- [ ] Open ClickUp → LIFE-OS-OPERATIONS.
- [ ] Pick ONE Ready / In Progress P0 or P1 task.
- [ ] Do the Next Action only.

## During work

- [ ] If blocked, write the blocker immediately.
- [ ] If waiting, say who/what you are waiting on.
- [ ] If technical work changed, link GitHub evidence.
- [ ] If you discover a new idea, capture it; do not derail the current task.

## Daily close

- [ ] Update the current task status.
- [ ] Add evidence or a short progress note.
- [ ] Set the next action.
- [ ] Capture loose thoughts in Obsidian Inbox.
- [ ] Stop. Do not create a giant tomorrow list.

## Weekly reset

- [ ] Open Weekly Review in Obsidian.
- [ ] Process Inbox.
- [ ] Review ClickUp Blocked / Waiting.
- [ ] Close completed work with evidence.
- [ ] Check P0/P1 priorities.
- [ ] Confirm no duplicate projects/tasks were created.
- [ ] Review automation failures or repeated runs.

# 11. Prompt Library

> [!info] WHY THESE PROMPTS ARE SHORT
> Your best prompts should tell the agent: exact target, exact allowed action, exact prohibited action, and exact proof of success.

## ClickUp - update one task

```text
Update the existing task: [TASK NAME]
Do not create a new task.
Current verified state: [FACTS]
Set status to: [STATUS]
Next Action: [ONE ACTION]
Add evidence: [LINK/RESULT]
Do not change any other task or structure.
```

## n8n - test one automation

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

## GitHub Copilot - inspect before changing

```text
Perform a READ-ONLY audit.
Do not modify files.
Return exact file paths and evidence.
Mark unknowns UNKNOWN.
Do not guess.
Give me one next action.
```

# 12. Keep the System Clean

- Do not create a new repository unless there is a clear unique purpose.
- Do not create a new ClickUp List for every repo.
- Do not create one List per AI agent.
- Do not automate an unstable workflow.
- Do not archive/delete until unique assets and dependencies are checked.
- Do not let open PRs become fake 'progress.'
- Do not maintain two command centers. LifeOS is the control plane.

## Monthly maintenance

- [ ] Review ClickUp Portfolio Cleanup.
- [ ] Review stale PRs.
- [ ] Review archive candidates.
- [ ] Review Technology and Repository Registry.
- [ ] Review n8n duplicate-run/errors.
- [ ] Confirm Obsidian dashboards still render.
- [ ] Confirm ClickUp tasks still map to real outcomes.

# 13. Plain-English Glossary

| Term | Plain-English meaning |
| --- | --- |
| Vault | Your Obsidian folder/system of notes. |
| Repo / Repository | A GitHub project containing code/files/history. |
| Branch | A safe work lane for changes before main. |
| Pull Request (PR) | A review package asking to merge branch changes. |
| CI | Automated checks that test code/change quality. |
| Environment Variable | A configuration value kept outside the code. |
| Migration | A controlled database/schema change. |
| Webhook / Trigger | An event that starts an automation. |
| Idempotency | Protection that prevents the same event from being processed twice. |
| Control Plane | The system that tells everything else how work is organized. |
| Source of Truth | The place you trust for the authoritative version. |
| Evidence | Proof that a task/result actually happened. |

# 14. One-Page Emergency Quick Card

> [!tip] I AM OVERLOADED. WHAT DO I DO?
> 1. Stop clicking.
> 2. Open ClickUp.
> 3. Find the current task.
> 4. Read Next Action.
> 5. Do only that.
> 6. If the task is unclear, open Obsidian for context.
> 7. If code is involved, open GitHub.
> 8. If automation is involved, open n8n.
> 9. If production config/data is involved, use Vercel/Supabase.
> 10. Record evidence and stop.

## The reset phrase

> **“What is the ONE next action?”**

> [!info] FINAL RULE
> No guessing. No duplicate work. No building a new system because the current screen is confusing. Verify first, then act.

# 15. Source Notes and Canonical References

- LifeOS repository: ebyron357/LifeOS-Enterprise
- Obsidian setup: docs/OBSIDIAN_SETUP.md
- Canonical ClickUp migration plan: docs/CLICKUP_MIGRATION_PREVIEW.md
- ClickUp Space: LIFE-OS-OPERATIONS
- Verified ClickUp LifeOS task: Verify core dashboards in Obsidian
- Verified automation proof: GitHub issue #50 → n8n → ClickUp task 86e2re8eg

This manual is an owner-facing operating guide, not a replacement for repository runbooks. When a technical runbook and this guide differ on implementation details, use the current canonical repository/runbook for the technical step.
