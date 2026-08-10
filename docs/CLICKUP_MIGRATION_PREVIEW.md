# LifeOS → ClickUp Migration Plan

**Status:** READ-ONLY PREVIEW — no ClickUp Space, Folder, List, Task, custom field, or automation has been created from this document.
**Document date:** 2026-08-10

This document is the canonical migration plan for populating the existing ClickUp Space `LIFE-OS-OPERATIONS`. It preserves the complete migration analysis performed against the `ebyron357/LifeOS-Enterprise` repository. Nothing in this document authorizes ClickUp changes on its own — it is a plan to be executed only after explicit owner approval.

---

## Executive Summary

LifeOS-Enterprise is a single Obsidian vault repository plus a companion Next.js "read-only web portal," not a portfolio of many active client repositories. It tracks three businesses (LifeOS, ClientVerse, TradeIQ) and references packaging-brand projects only through `PROJECT_REPO_REGISTRY.md` — those brands have no corresponding vault Project or Business note. Three additional active vault projects exist under `10 Projects/` (Build AI Consultant Portfolio, Build YouTube to Knowledge Engine, Operationalize Content-to-Lead Service) that were not fully classified in the original preview pass; they are now incorporated below with full evidence.

Most repository content is documentation/governance (architecture specs, docs, agent standards, templates) rather than discrete deliverables, and should remain documentation rather than become ClickUp work items. Genuine client/product work for packaging brands lives in *other* GitHub repositories referenced from the registry, not inside this repository.

Recommendation: migrate the vault-tracked projects and a small set of system/automation assets as ClickUp Lists/Tasks; treat governance and reference material as documentation only; flag packaging-brand repos, duplicate/archive repos, and several folder/classification ambiguities for owner decision before any ClickUp task creation.

---

## Source of Truth

Repository:
`ebyron357/LifeOS-Enterprise`

ClickUp destination:
`LIFE-OS-OPERATIONS` (existing Space — do not create a new Space)

Existing ClickUp folders (do not create new folders beyond these five):
1. Core Systems
2. Client Delivery
3. Product Systems
4. Automation
5. Portfolio Cleanup

---

## Canonical Operating Model

- **LifeOS Enterprise (this repository) = operating/control plane.** It is the single source of vault structure, metadata standards, dashboards, agent definitions, and the read-only web portal that renders the vault. It defines *what* work exists and *how* it should be tracked, but it is not itself a task tracker.
- **GitHub = code and technical source of truth.** All executable code (the Next.js portal, the OpenRouter integration, packaging-brand production repos, client delivery repos such as `charlotte-real-estate-system`, `tradeiq-command-center`, `project-reconstruction`) lives in Git repositories. Commits, PRs, and CI checks are the record of technical truth.
- **ClickUp = execution and work-management layer.** ClickUp is where day-to-day task assignment, status tracking, priority, blockers, and human work coordination happen. ClickUp does not replace the vault's Markdown notes as the description of a project's *intent* — it operationalizes the *doing* of that intent.
- **n8n = automation/orchestration layer.** n8n is currently a **proposed/pilot** automation tool referenced in `40 Resources/Technology/Technology and Repository Registry.md` (`AmplifyAutomation/n8n-templates`, status "Controlled Pilot") and `40 Resources/Content Services/Content Services Tool Stack.md` (listed alongside Make/Zapier/Activepieces/Huginn as automation options). No n8n workflows currently exist as implemented, running automation in this repository — it is evaluated but not adopted. It should be tracked in ClickUp's Automation folder as a pilot/evaluation item, not as a live automation system.

---

## ClickUp Folder Mapping

### Core Systems

- **LifeOS Enterprise (the vault/system itself)** — belongs here because it is the meta-system: command center, dashboards, metadata schema, templates, and validation scripts that everything else depends on. It is not a client or product deliverable.
- **Governance & Metadata Standards** (`architecture/METADATA_SCHEMA.md`, `docs/LifeOS_Specification_v1.md`, `docs/CANONICAL_LIVE_STATUS.md`, `docs/CURRENT_STATE_AUDIT.md`) — belongs here because these are the standards that govern how every other system records status; they are referenced by, not separate from, the LifeOS control plane.
- **AI Agent Standards** (`.github/agents/*.agent.md`, `AI/*.md`) — belongs here because these define reusable operating standards (14 Copilot agents + 4 AI role personas) used across all work, not a single deliverable.
- **Web Vault Portal (Next.js app)** — belongs here (with an owner-decision flag) because it is shared infrastructure that renders the vault; it is deployed (v1.0.0, `https://lifeos-enterprise.vercel.app`) but scoped to internal/operational use rather than being sold as a product.

### Client Delivery

- **Charlotte Real Estate System** — approved client outcome under the ClientVerse business; live site with explicit production-integration blockers recorded in the vault.
- **ClientVerse Store Builds** — approved client outcome under ClientVerse; explicitly blocked/waiting on API credentials per vault record.
- **ClientVerse (business umbrella)** — the parent business record grouping the two client projects above; represented as the parent List context, not a duplicate task.

### Product Systems

- **TradeIQ** — approved product outcome; a standalone software product (trading intelligence) with its own business and project record, distinct from client delivery work.
- **Packaging Brand Projects (12 oz, ALT syrup, Bravo Paws)** — flagged as pending owner confirmation. They are described as active/active-recovery in `PROJECT_REPO_REGISTRY.md`, and referenced again in `40 Resources/Technology/Technology and Repository Registry.md` (barcode/commercialization work for "THE ALTERNATIVE, ALT syrups, Bravo Paws, STAXX"), but have no vault Project or Business note, so they cannot yet be treated as canonical Product Systems entries without owner confirmation.

### Automation

- **OpenRouter Integration / LifeOS CLI** (`integrations/openrouter/`) — an implemented, working automation/integration component (has its own `package.json`, README, and library code), so it qualifies as an approved automation system.
- **Vault-tracked Automation Backlog Ideas** (`10 Projects/Build AI Consultant Portfolio.md`, `10 Projects/Build YouTube to Knowledge Engine.md`, `10 Projects/Operationalize Content-to-Lead Service.md`) — these are active projects with full frontmatter (status, priority, owner, next_action, due dates) and detailed execution plans; they involve building repeatable automated/semi-automated workflows (portfolio evidence pipeline, YouTube-to-knowledge pipeline, content-to-lead pipeline) and are approved for Automation tracking based on this evidence.
- **Capture Processing Workflow** (`workflows/CAPTURE_PROCESSING_WORKFLOW.md`) — documented process, not yet exercised end to end per `Businesses/LifeOS.md`; belongs here as a workflow reference, not a separate product.
- **n8n (pilot/evaluation)** — proposed automation orchestration layer, currently at "Controlled Pilot" / research status per `40 Resources/Technology/Technology and Repository Registry.md`; no implemented workflow exists yet.
- **Copilot Custom Agents (14) as tooling** — alternate classification to Core Systems, flagged as ambiguous; included here only as a cross-reference, not a duplicate entry (see Human Decisions Required).

### Portfolio Cleanup

- **Legacy vault folder duplication** — the numbered PARA structure (`00 Home` … `90 Archive`) duplicates legacy flat folders (`Businesses/`, `Projects/`, `AI/`, `Automations/`, `Command Center/`, `Dashboards/`, `Knowledge/`, `Learning/`, `People/`, `Resources/`, `SOPs/`, `Tools/`, `URLs/`). `Projects/LifeOS Enterprise.md` itself lists "migrate remaining legacy Projects into 10 Projects" as a pending next action — this is unresolved internal cleanup, not new work.
- **Duplicate/archive GitHub repos** per `PROJECT_REPO_REGISTRY.md`: `ALT-Label-System`, `alternative-packaging-system`, `alternative-passionFruit-production`, `alternative-lychee-sweet-tea`, `ALT-Syrup-Label-System`, `Bravo-Labels-`, `Bravofinal` — explicitly marked "archive/reference" and "do not use as active" by the registry's own governance rule ("One project = one active GitHub repo").
- **Consolidation work** — reconciling the `Projects/` (flat) vs. `10 Projects/` (PARA) note sets so the same project is not represented twice.

---

## Exact Lists to Create

> Every List below is proposed only. No ClickUp List has been created.

### Core Systems Folder

**List: LifeOS Foundation**
- Folder: Core Systems
- Purpose: Track validation and stabilization of the vault/control-plane itself.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (root, `architecture/`, `docs/`, `templates/`, `99 Templates/`, `AGENTS.md`, `workflows/CAPTURE_PROCESSING_WORKFLOW.md`)
- Classification: Active
- Priority: P0 (Urgent)
- Current state: Foundation complete per `docs/CANONICAL_LIVE_STATUS.md` ("V1.0 is built, merged, deployed, and operational"); visual Obsidian validation still open per `Projects/LifeOS Enterprise.md` checklist.
- Immediate next action: Open the vault in Obsidian and verify all core dashboards render visually; resolve any P0/P1 defects found (per `Projects/LifeOS Enterprise.md` open checklist items).
- Evidence: `Businesses/LifeOS.md` KPI table ("Core dashboards validated in Obsidian — Not yet verified"); `Projects/LifeOS Enterprise.md` Validation Checklist (3 of 8 items unchecked); `docs/CANONICAL_LIVE_STATUS.md`.

**List: Governance & Docs**
- Folder: Core Systems
- Purpose: Reference-only tracking of standards documents; not actionable work.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`architecture/METADATA_SCHEMA.md`, `docs/LifeOS_Specification_v1.md`, `docs/CANONICAL_LIVE_STATUS.md`, `docs/CURRENT_STATE_AUDIT.md`)
- Classification: Maintenance
- Priority: Normal
- Current state: Complete/stable documentation; no open task lists inside the files themselves.
- Immediate next action: None — link as reference only.
- Evidence: File contents are specifications/status records with no unchecked action items.

**List: Agent Standards**
- Folder: Core Systems
- Purpose: Track maintenance of the 14 Copilot custom agents and 4 AI role personas as shared standards.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`.github/agents/*.agent.md`, `AI/*.md`)
- Classification: Maintenance
- Priority: Low
- Current state: Active and current (14 agent files present, 4 role files present).
- Immediate next action: None identified at this time; create tasks only if an agent definition needs an update.
- Evidence: Directory listing of `.github/agents/` (14 files) and `AI/` (4 files: Automation Advisor, Chief of Staff, Librarian, Project Manager).

**List: Web Portal**
- Folder: Core Systems (pending owner confirmation — see Human Decisions Required)
- Purpose: Track ongoing evolution of the read-only Next.js web portal over the vault.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`app/`, `components/`, `lib/`, `tests/`, `package.json`)
- Classification: Active
- Priority: High
- Current state: Shipped v1.0.0, deployed to Vercel; CHANGELOG documents active recent work (Workspace OS V1, Interactive Operations V2, Voice V1).
- Immediate next action: Per `docs/CANONICAL_LIVE_STATUS.md` activation table — supply `LIFEOS_WRITE_ENABLED`/`LIFEOS_WRITE_SECRET`/`LIFEOS_GITHUB_TOKEN` to activate draft-PR persistence, and `LIFEOS_VOICE_ENABLED` to activate the Voice Console, if those capabilities are wanted.
- Evidence: `package.json` version `1.0.0`; `CHANGELOG.md` `[1.0.0]` entry; `docs/CANONICAL_LIVE_STATUS.md` "Activation state" table listing Draft-PR persistence and Voice Console as implemented-but-inactive.

### Client Delivery Folder

**List: ClientVerse Program**
- Folder: Client Delivery
- Purpose: Parent tracking context for the ClientVerse business; not a task itself.
- GitHub repository/repositories: n/a (business-level record: `Businesses/ClientVerse.md`)
- Classification: Active
- Priority: P0 (Urgent)
- Current state: Active business with two active projects and one open next action (reusable handoff checklist).
- Immediate next action: Create reusable handoff checklist (per `Businesses/ClientVerse.md` Next Action).
- Evidence: `Businesses/ClientVerse.md` frontmatter `status: active`, `priority: P0`; "Next Action: Create reusable handoff checklist."

**List: ClientVerse Client Sites**
- Folder: Client Delivery
- Purpose: Track the two concrete client delivery projects (Charlotte Real Estate System, ClientVerse Store Builds).
- GitHub repository/repositories: `ebyron357/charlotte-real-estate-system`; ClientVerse Store Builds repo not explicitly named in the vault (referenced in `PROJECT_REPO_REGISTRY.md` as possibly `ebyron357/project-reconstruction` for "Staxx / Shopify client work" — unconfirmed, see Human Decisions Required)
- Classification: Active (Charlotte Real Estate System) / Waiting (ClientVerse Store Builds)
- Priority: P0 (Urgent) for both
- Current state: Charlotte Real Estate System — live site, production integrations unverified. ClientVerse Store Builds — blocked on API credentials and final catalog.
- Immediate next action: Charlotte — confirm environment variables and lead routing. Store Builds — complete credential workflow and connect production settings.
- Evidence: `Projects/Charlotte Real Estate System.md` (`status: active`, `blocker: Production integrations need final verification`); `Projects/ClientVerse Store Builds.md` (`status: waiting`, `waiting_on: API credentials`).

### Product Systems Folder

**List: TradeIQ Product**
- Folder: Product Systems
- Purpose: Track TradeIQ feature roadmap and MVP definition.
- GitHub repository/repositories: `ebyron357/tradeiq-command-center`
- Classification: Active
- Priority: P1 (High)
- Current state: Feature prioritization started; consolidated roadmap needed.
- Immediate next action: Reconcile current feature plan against competitor app feature sets (per `Projects/TradeIQ.md` Next Action).
- Evidence: `Projects/TradeIQ.md` frontmatter `status: active`, `priority: P1`; task list (must-have features, differentiators, MVP vs v2, data sources, build phases).

**List: Packaging Brands** (proposed — does not yet exist as a vault Project/Business note)
- Folder: Product Systems
- Purpose: Track physical product label/packaging production systems.
- GitHub repository/repositories: `ebyron357/12oz` (ALTERNATIVE 12 oz beverage labels), `ebyron357/alt-syrup-labels` (ALT syrup labels), `ebyron357/ebyron357-BravoPaws-Official` (Bravo Paws labels)
- Classification: **Requires owner decision** — evidence exists only at the repo-registry level, not modeled in the vault.
- Priority: Unrated (no priority set anywhere in the vault for these)
- Current state: Per `PROJECT_REPO_REGISTRY.md` — 12oz: ACTIVE; ALT syrup labels: ACTIVE / RECOVERY ("final release files are not confirmed in hand"); Bravo Paws: ACTIVE.
- Immediate next action: Owner must confirm these are still active before any ClickUp project/task is created; if confirmed, add corresponding vault Project notes first for consistency with the rest of the operating model.
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table; `40 Resources/Technology/Technology and Repository Registry.md` line referencing barcode/commercialization work for "THE ALTERNATIVE, ALT syrups, Bravo Paws, STAXX."

### Automation Folder

**List: Integrations**
- Folder: Automation
- Purpose: Maintain the OpenRouter multi-model LLM router integration used by LifeOS tooling.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`integrations/openrouter/`)
- Classification: Maintenance
- Priority: Low
- Current state: Present and appears functional (own `package.json`, `README.md`, `lib/router.js`, `lib/client.js`, `lifeos-cli.js`, `.env.example`).
- Immediate next action: None identified from repository evidence; track for ongoing maintenance only.
- Evidence: Directory listing of `integrations/openrouter/`.

**List: Automation Backlog**
- Folder: Automation
- Purpose: Track the three active vault projects that build repeatable automated/semi-automated pipelines.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`10 Projects/Build AI Consultant Portfolio.md`, `10 Projects/Build YouTube to Knowledge Engine.md`, `10 Projects/Operationalize Content-to-Lead Service.md`)
- Classification: Active (all three)
- Priority: P0 (Build AI Consultant Portfolio; Operationalize Content-to-Lead Service) / P1 (Build YouTube to Knowledge Engine)
- Current state: See individual tasks below — each has a due date, next action, and detailed execution plan.
- Immediate next action: See per-project next actions below.
- Evidence: Frontmatter of each of the three files (all `type: project`, `status: active`, with `priority`, `owner: Bwa`, `due_date`, `next_action` fields populated).

**List: Workflows**
- Folder: Automation
- Purpose: Track the documented capture-processing workflow.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`workflows/CAPTURE_PROCESSING_WORKFLOW.md`)
- Classification: Cleanup/Validation
- Priority: Normal
- Current state: Documented but "not yet verified" as exercised end to end.
- Immediate next action: Exercise the capture-processing workflow end to end and record the result (per `Businesses/LifeOS.md` KPI table).
- Evidence: `Businesses/LifeOS.md` KPI row "Capture workflow exercised end to end — Not yet verified — Pending."

**List: n8n Automation Pilot**
- Folder: Automation
- Purpose: Track evaluation of n8n as the automation/orchestration layer.
- GitHub repository/repositories: n/a — no n8n workflow files exist in this repository; referenced only in resource/tool-stack documents.
- Classification: Research/Cleanup (pilot evaluation, not implemented)
- Priority: P1 (per registry entry for the ClientVerse/lead-response use case)
- Current state: "Controlled Pilot" status per registry; no sandbox workflow has been built yet.
- Immediate next action: Review speed-to-lead and appointment workflows using `AmplifyAutomation/n8n-templates`; one sandbox workflow must pass end-to-end test without exposing production data (per registry's own completion evidence criterion).
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` row for `AmplifyAutomation/n8n-templates`.

**List: AI Agent Tooling** (owner-decision alternate to "Agent Standards" under Core Systems)
- Folder: Automation (ambiguous — see Human Decisions Required)
- Purpose: Same content as "Agent Standards" above; listed here only to flag the classification conflict, not as a separate migration target.
- GitHub repository/repositories: `.github/agents/`
- Classification: Maintenance
- Priority: Low
- Current state: Active/current.
- Immediate next action: Owner must choose one folder (Core Systems or Automation) to avoid duplicate tracking.
- Evidence: Same 14 `.agent.md` files cited above.

### Portfolio Cleanup Folder

**List: Legacy Folder Migration**
- Folder: Portfolio Cleanup
- Purpose: Reconcile the flat legacy folders against the numbered PARA structure so the same project/business is not tracked twice.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`Projects/`, `Businesses/`, `AI/`, `Automations/`, `Command Center/`, `Dashboards/`, `Knowledge/`, `Learning/`, `People/`, `Resources/`, `SOPs/`, `Tools/`, `URLs/` vs. `00 Home/`…`90 Archive/`)
- Classification: Cleanup
- Priority: Normal
- Current state: Both folder sets exist in parallel; `Projects/LifeOS Enterprise.md` explicitly lists migrating legacy Projects into `10 Projects` as a pending (unchecked) next action.
- Immediate next action: Migrate remaining legacy Projects into `10 Projects` (per `Projects/LifeOS Enterprise.md` Next Action list).
- Evidence: `Projects/LifeOS Enterprise.md` next_action frontmatter: "...then migrate remaining legacy Projects into 10 Projects when convenient."

**List: Archive Candidate Repos**
- Folder: Portfolio Cleanup
- Purpose: Track review/archival of the 7 named duplicate GitHub repos.
- GitHub repository/repositories: `ebyron357/ALT-Label-System`, `ebyron357/alternative-packaging-system`, `ebyron357/alternative-passionFruit-production`, `ebyron357/alternative-lychee-sweet-tea`, `ebyron357/ALT-Syrup-Label-System`, `ebyron357/Bravo-Labels-`, `ebyron357/Bravofinal`
- Classification: Cleanup/Archive
- Priority: Low
- Current state: Explicitly marked "archive/reference" and "Do Not Use As Active Unless Specifically Needed" in the registry.
- Immediate next action: "Archive or rename duplicate repos only after confirming no unique assets are missing" (per `PROJECT_REPO_REGISTRY.md` Current Focus Order, item 4).
- Evidence: `PROJECT_REPO_REGISTRY.md` "Do Not Use As Active Unless Specifically Needed" section and "Current Focus Order" section.

---

## Tasks to Create Later

> These are the only initial tasks directly supported by repository evidence. No tasks have been created in ClickUp.

**Task: Validate LifeOS core dashboards in Obsidian**
- ClickUp List: LifeOS Foundation
- Objective: Confirm all core dashboards (Daily Command Center, Weekly Review, Monthly Review, Executive Dashboard) render correctly when the vault is opened in Obsidian.
- Current State: Not yet verified.
- Next Action: Open the repository as an Obsidian vault, enable required plugins, verify dashboard queries render without errors.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: All core dashboards render; Dataview/Bases queries resolve without errors (per `Projects/LifeOS Enterprise.md` Validation Checklist).
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `Projects/LifeOS Enterprise.md` unchecked items: "Open the vault in Obsidian and verify all core dashboards render visually."; `Businesses/LifeOS.md` KPI "Core dashboards validated in Obsidian — Not yet verified."

**Task: Resolve P0/P1 runtime defects found during visual validation**
- ClickUp List: LifeOS Foundation
- Objective: Fix any defects discovered while validating dashboards in Obsidian.
- Current State: Not yet assessed — defects not yet known because visual validation has not occurred.
- Next Action: Complete the dashboard validation task above first, then triage and fix any defects found.
- Blocker: Depends on completion of dashboard validation.
- Waiting On: Dashboard validation task.
- Success Criteria: Zero P0/P1 foundation defects remain (per `Projects/LifeOS Enterprise.md` Definition of Done).
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `Businesses/LifeOS.md` KPI "P0/P1 foundation defects — Not yet assessed in Obsidian — Pending."

**Task: Exercise capture-processing workflow end to end**
- ClickUp List: Workflows
- Objective: Process one Inbox item through the documented capture-processing workflow to confirm it works in practice.
- Current State: Workflow is documented but not yet exercised.
- Next Action: Process one Inbox item end to end and record the result.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: One successful capture-to-processing cycle recorded (per `Businesses/LifeOS.md` KPI target: "1 successful cycle").
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Normal
- Evidence: `workflows/CAPTURE_PROCESSING_WORKFLOW.md`; `Businesses/LifeOS.md` KPI table.

**Task: Confirm production environment variables and lead routing (Charlotte Real Estate System)**
- ClickUp List: ClientVerse Client Sites
- Objective: Verify production database URL, CRM webhook, retry cron, form submissions, and local market list.
- Current State: Website is live; SEO/privacy work and build validation exist from prior work; production integrations unverified.
- Next Action: Confirm database URL; confirm CRM webhook; confirm retry cron; verify form submissions; verify local market list.
- Blocker: "Production integrations need final verification."
- Waiting On: None recorded beyond internal verification.
- Success Criteria: All 5 sub-checks (database URL, CRM webhook, retry cron, form submissions, market list) confirmed.
- GitHub Repository: `ebyron357/charlotte-real-estate-system`
- Native ClickUp Priority: Urgent
- Evidence: `Projects/Charlotte Real Estate System.md` Tasks list and Blocker field.

**Task: Complete credential workflow for ClientVerse Store Builds**
- ClickUp List: ClientVerse Client Sites
- Objective: Confirm app setup, obtain API token, add environment variables, confirm demo fallback remains safe, and run a live smoke test.
- Current State: Client store workflow active; demo catalog fallback exists; production credentials still needed.
- Next Action: Complete credential workflow and connect production settings.
- Blocker: "Credentials and final catalog are not fully available."
- Waiting On: API credentials.
- Success Criteria: Live smoke test passes after products exist, per the 5-item task list in the source note.
- GitHub Repository: Not explicitly named in the vault (see Human Decisions Required — possibly `ebyron357/project-reconstruction`)
- Native ClickUp Priority: Urgent
- Evidence: `Projects/ClientVerse Store Builds.md` Tasks list, `waiting_on: API credentials`.

**Task: Reconcile TradeIQ feature plan against competitor apps**
- ClickUp List: TradeIQ Product
- Objective: List must-have features, list advanced differentiators, map MVP vs. v2, identify required data sources, define build phases.
- Current State: Feature prioritization started; consolidated roadmap needed.
- Next Action: Reconcile the current feature plan against competitor app feature sets.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: All 5 listed sub-tasks completed.
- GitHub Repository: `ebyron357/tradeiq-command-center`
- Native ClickUp Priority: High
- Evidence: `Projects/TradeIQ.md` Tasks list.

**Task: Complete LifeOS Enterprise Evidence Package (AI Consultant Portfolio)**
- ClickUp List: Automation Backlog
- Objective: Structural audit, dashboard screenshots, architecture diagram, one before-and-after workflow, one measurable operational result, privacy-safe export review, and walkthrough outline.
- Current State: Active; candidate classification and flagship case-study selection already complete (checked items in source note).
- Next Action: Complete the LifeOS Enterprise Evidence Package as described above.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Evidence package complete and usable as a flagship case study input.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `10 Projects/Build AI Consultant Portfolio.md` frontmatter `next_action` field; due date 2026-10-31.

**Task: Process one pilot YouTube video through the manual capture workflow**
- ClickUp List: Automation Backlog
- Objective: Process one public captioned YouTube video through the manual pilot workflow and record every failure, correction, and useful output.
- Current State: Active; core flow and success criteria documented; no pilot yet run.
- Next Action: Run Pilot 1 (public captioned tutorial) using NotebookLM.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Transcript import, extracted resources, course outline, SOP, checklist, flashcards, quiz, and action items all verified for one pilot video.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: High
- Evidence: `10 Projects/Build YouTube to Knowledge Engine.md` frontmatter `next_action` field; due date 2026-08-15.

**Task: Select pilot offer, niche, and campaign for Content-to-Lead Service**
- ClickUp List: Automation Backlog
- Objective: Select one pilot offer, one target niche, and one controlled campaign to run through the complete content-to-lead workflow.
- Current State: Active; 14-day implementation plan documented; pilot not yet selected.
- Next Action: Select one pilot offer, one target niche, and one controlled campaign.
- Blocker: Field present in frontmatter but left blank (no blocker text recorded).
- Waiting On: Not recorded.
- Success Criteria: Pilot niche/offer selected and Days 1–2 (Offer and Pipeline) plan items completed.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `10 Projects/Operationalize Content-to-Lead Service.md` frontmatter `next_action` field; due date 2026-08-15.

**Task: Review n8n templates for a bounded ClientVerse lead-response pilot**
- ClickUp List: n8n Automation Pilot
- Objective: Review speed-to-lead and appointment workflows from `AmplifyAutomation/n8n-templates` for D'Affordable Homes, ClientVerse, and Jasmine Parker use cases.
- Current State: Controlled Pilot status; not yet implemented.
- Next Action: Review speed-to-lead and appointment workflows.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: One sandbox workflow passes an end-to-end test without exposing production data.
- GitHub Repository: n/a (external template repo `AmplifyAutomation/n8n-templates`, referenced only)
- Native ClickUp Priority: High
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` row for `AmplifyAutomation/n8n-templates`.

Do NOT create sample tasks or placeholder tasks beyond the ones listed above — every task above is backed by an explicit, currently-open next_action or unchecked checklist item found in the repository.

---

## Do Not Migrate

- **Legacy flat folders as separate content from the PARA structure** (`Businesses/`, `Projects/`, `AI/`, `Automations/`, `Command Center/`, `Dashboards/`, `Knowledge/`, `Learning/`, `People/`, `Resources/`, `SOPs/`, `Tools/`, `URLs/`) — Reason: these are being actively migrated into the numbered structure (`10 Projects/`, `20 Areas/`, etc.) per the repository's own recorded next action; migrating both sets into ClickUp would create duplicate work items describing the same project.
- **`ALT-Label-System`, `alternative-packaging-system`, `alternative-passionFruit-production`, `alternative-lychee-sweet-tea`** — Reason: explicitly marked as archive/reference and "focus noise" in `PROJECT_REPO_REGISTRY.md`; the canonical active repo for this work is `ebyron357/12oz`.
- **`ALT-Syrup-Label-System`** — Reason: explicitly superseded by `ebyron357/alt-syrup-labels` per the registry.
- **`Bravo-Labels-`, `Bravofinal`** — Reason: explicitly superseded by `ebyron357/ebyron357-BravoPaws-Official` per the registry.
- **`architecture/`, `docs/`, `templates/`, `99 Templates/` content in general** — Reason: these are reference/governance documentation, not actionable deliverables; only the two specific validation tasks listed above (dashboard validation, defect resolution) are actionable and have been included as tasks.
- **README.md index files** (e.g., `Automations/README.md`, `Tools/README.md`, `SOPs/README.md`, `URLs/README.md`, `Knowledge/README.md`, `Learning/README.md`, `People/README.md`, `Resources/README.md`, `90 Archive/README.md`) — Reason: these are folder-purpose descriptions ("Store automation records here...") with no project content of their own; they should remain documentation.
- **`.github/agents/*.agent.md` and `AI/*.md` as active "experiments"** — Reason: these are stable, in-use standards, not experiments; they may warrant a Maintenance-classified reference list (see above) but should not be treated as active project work requiring task tracking.
- **n8n as an implemented automation system** — Reason: no n8n workflow exists in this repository; it is a tool under evaluation ("Controlled Pilot" / research status). It should be tracked as a pilot-evaluation item only, not migrated as if it were live automation infrastructure.
- **The OpenRouter integration's internal library files individually** (`lib/router.js`, `lib/client.js`, `lib/errors.js`, `lib/env.js`) — Reason: these are implementation details of one integration, already represented by the single "Integrations" List item; they should not be split into separate ClickUp tasks without a specific defect or feature request.

---

## Human Decisions Required

- Should the packaging brand projects (12oz, ALT syrup, Bravo Paws) be onboarded into ClickUp now, given they have no vault Project/Business note — only `PROJECT_REPO_REGISTRY.md` entries?
- Does the Web Vault Portal (Next.js app) belong in **Core Systems** or **Product Systems**? (It is shared infrastructure but is also a shipped, versioned product.)
- Do the 14 Copilot custom agents belong in **Core Systems** (as a standard) or **Automation** (as tooling)? Choose one to avoid duplicate tracking between the "Agent Standards" and "AI Agent Tooling" Lists proposed above.
- What is the actual GitHub repository for **ClientVerse Store Builds**? `PROJECT_REPO_REGISTRY.md` tentatively maps "Staxx / Shopify client work" to `ebyron357/project-reconstruction`, but this is not confirmed as the same project referenced in `Projects/ClientVerse Store Builds.md`.
- Are the legacy flat folders (`Businesses/`, `Projects/`, `AI/`, `Automations/`, etc.) fully superseded by the numbered PARA structure, or still authoritative for some content? This affects whether any additional items are hiding in the legacy folders that were not surfaced by this review.
- Should n8n be tracked as a formal Automation-folder pilot now, or deferred until a specific project (e.g., ClientVerse lead response) is ready to test it?
- Is `40 Resources/Technology/Technology and Repository Registry.md` itself a live, currently-maintained priority queue that should generate additional ClickUp tasks beyond the ones already extracted here (e.g., `vercel/ai`, `vercel/sdk`, accessibility tooling, barcode generation)? This document contains many more P0/P1 rows not yet individually evaluated for ClickUp migration and may warrant a dedicated follow-up review.

Do not silently resolve any of the above; each requires explicit owner confirmation before proceeding.

---

## ClickUp Field Mapping

Use ClickUp's **native Priority** field (Urgent / High / Normal / Low) for all tasks — do not create a custom priority field.

Define the following custom fields on the Space (or on each relevant Folder/List, per ClickUp configuration norms):

**Project Health**
- Type: Dropdown
- Options: Green, Yellow, Red, Unknown

**GitHub Repository**
- Type: URL

**Current Phase**
- Type: Dropdown
- Options: Discovery, Planning, Development, Testing, Production, Maintenance

**Blocker**
- Type: Text

**Waiting On**
- Type: Text

**Next Action**
- Type: Text

**Next Milestone**
- Type: Date

**Production Ready**
- Type: Dropdown
- Options: Not Started, In Progress, Ready, Blocked, Complete

**Evidence / Verification**
- Type: URL

**Owner**
- Type: People

---

## Status Model

Use exactly the following ClickUp statuses (no additions or substitutions):

- Not Started
- Ready
- In Progress
- Blocked
- Waiting
- Review
- Complete

---

## Recommended Execution Order

**Phase 1: LifeOS and portfolio stabilization**
Validate LifeOS core dashboards in Obsidian; resolve P0/P1 defects; exercise the capture-processing workflow end to end; resolve the legacy-folder-vs-PARA-structure migration. This phase stabilizes the control plane before other work is layered on top of it.

**Phase 2: ClientVerse and core platform releases**
Track the Web Vault Portal's ongoing evolution (pending the Core Systems vs. Product Systems decision) and confirm the ClientVerse business-level handoff checklist next action.

**Phase 3: Client delivery**
Confirm production environment variables and lead routing for Charlotte Real Estate System; complete the credential workflow and production smoke test for ClientVerse Store Builds.

**Phase 4: Product/packaging delivery**
Reconcile the TradeIQ feature plan against competitor apps; resolve the packaging-brand owner decision and, if approved, onboard 12oz / ALT syrup / Bravo Paws.

**Phase 5: Automation**
Track the OpenRouter integration for maintenance; progress the three Automation Backlog projects (AI Consultant Portfolio, YouTube to Knowledge Engine, Content-to-Lead Service) against their documented next actions; evaluate the n8n pilot for a bounded ClientVerse lead-response use case.

**Phase 6: Portfolio cleanup**
Archive or rename the 7 named duplicate/legacy GitHub repos only after confirming no unique assets are missing, per the registry's own "Current Focus Order."

---

## Final Migration Checklist

- [ ] Confirm this document (`docs/CLICKUP_MIGRATION_PREVIEW.md`) reflects the owner's understanding of the current portfolio.
- [ ] Resolve all items under "Human Decisions Required" before creating any ClickUp Folders/Lists.
- [ ] Confirm the existing `LIFE-OS-OPERATIONS` Space and its 5 existing folders (Core Systems, Client Delivery, Product Systems, Automation, Portfolio Cleanup) are the correct, final target — do not create a new Space.
- [ ] Create the Lists specified in "Exact Lists to Create," one Folder at a time, starting with Core Systems (Phase 1).
- [ ] Apply the custom fields specified in "ClickUp Field Mapping" at the Space level so they are available to every List.
- [ ] Apply the exact Status Model specified above — no additional statuses.
- [ ] Create only the tasks specified in "Tasks to Create Later" — do not add placeholder or sample tasks.
- [ ] Set native ClickUp Priority and the custom fields (Project Health, GitHub Repository, Current Phase, Blocker, Waiting On, Next Action, Next Milestone, Production Ready, Evidence/Verification, Owner) on each task as it is created, using the evidence recorded above.
- [ ] Follow the Recommended Execution Order (Phase 1 → Phase 6); do not start Phase 2+ work in ClickUp before Phase 1 stabilization tasks are at least in progress.
- [ ] Do not migrate any item listed under "Do Not Migrate."
- [ ] Re-review `40 Resources/Technology/Technology and Repository Registry.md` in a follow-up pass before treating it as fully covered by this document (see final bullet under Human Decisions Required).
- [ ] After ClickUp structure is created, cross-link each ClickUp task back to its GitHub evidence file/path for traceability.
