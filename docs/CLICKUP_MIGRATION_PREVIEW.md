# LifeOS → ClickUp Migration Plan

**Status:** READ-ONLY CANONICAL PLAN — no ClickUp Space, Folder, List, Task, custom field, or automation has been created from this document.
**Document date:** 2026-08-10 (revised following owner decisions on packaging systems, Web Vault Portal classification, Copilot/AI agents, ClientVerse Public Platform repository identity, legacy folder structure, n8n, and the Technology and Repository Registry follow-up)

This document is the canonical migration plan for populating the existing ClickUp Space `LIFE-OS-OPERATIONS`. It preserves the complete migration analysis performed against the `ebyron357/LifeOS-Enterprise` repository, updated to reflect explicit owner decisions. This is a full replacement of the prior version of this document, not an appendix or patch. Nothing in this document authorizes ClickUp changes on its own — it is a plan ready for execution once ClickUp write access is verified; all seven original owner decisions, including the ClientVerse repository identity, are now resolved.

---

## Executive Summary

LifeOS-Enterprise is a single Obsidian vault repository plus a companion Next.js "read-only web portal," not a portfolio of many active client repositories. It tracks three businesses (LifeOS, ClientVerse, TradeIQ) and references packaging-brand product systems through `PROJECT_REPO_REGISTRY.md`. Three additional active vault projects exist under `10 Projects/` (Build AI Consultant Portfolio, Build YouTube to Knowledge Engine, Operationalize Content-to-Lead Service) that build repeatable automated/semi-automated workflows.

Following owner review, all seven original open decisions are now **resolved**:

1. **Packaging/product systems (12oz, ALT Syrup, Bravo Paws)** — approved to migrate into **Product Systems** as three separate Lists/projects, even though no canonical vault Project/Business note yet exists for them. Creating those missing vault notes is tracked as follow-up work, not a migration blocker.
2. **Web Vault Portal** — approved to classify under **Core Systems** as an internal operating/control surface, not a customer-facing product.
3. **Copilot/AI agents** — approved to classify the agents themselves under **Automation**, tracked as a single simple List rather than one List per agent. Governance/rules/policy documentation about the agents remains separate, reference-only documentation.
4. **ClientVerse Public Platform repository identity — RESOLVED.** The owner has confirmed the canonical repository is `ebyron357/clientverse` (private, existing repo). There is no separate "ClientVerse Store Builds" repository; the vault project previously tracked under that name maps to this confirmed repository. CRM / GoHighLevel integration is not yet connected — this is planned follow-up work, not a migration blocker.
5. **Legacy flat folder structure** — approved with a safety rule: the PARA/numbered structure (`00 Home` … `90 Archive`) is the standard going forward; legacy flat folders must be reviewed for unique content and then moved into an archive/review path — never deleted or silently discarded.
6. **n8n** — approved as an official part of the LifeOS automation ecosystem, classified under **Automation**. It is a real orchestration platform, not merely experimental — but individual n8n workflows still carry their own maturity phase (Planning/Development/Testing/Production/Maintenance) and must not be assumed production-ready as a set.
7. **Technology and Repository Registry follow-up** — approved as a required P1 review, scheduled before the overall portfolio migration can be considered fully closed.

No decisions from the original owner review remain unresolved. See "Newly Discovered Issues" below for items surfaced during this update that are separate from the original seven decisions.

Recommendation: migrate the vault-tracked projects and the now-approved system/automation/product assets as ClickUp Lists/Tasks per the mapping below; treat governance and reference material as documentation only; migrate ClientVerse Public Platform using the confirmed repository; track CRM/GoHighLevel integration as a planned follow-up task, not a blocker; and complete the Technology and Repository Registry P1 review before declaring the portfolio migration closed.

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

- **LifeOS Enterprise (this repository) = control plane / operating system.** It is the single source of vault structure, metadata standards, dashboards, agent definitions, and the read-only web portal that renders the vault. It defines *what* work exists and *how* it should be tracked, but it is not itself a task tracker.
- **GitHub = code, technical evidence, and repository source of truth.** All executable code (the Web Vault Portal, the OpenRouter integration, packaging-brand production repos, client delivery repos) lives in Git repositories. Commits, PRs, and CI checks are the record of technical truth.
- **ClickUp = work execution, visibility, priorities, blockers, and outcomes.** ClickUp is where day-to-day task assignment, status tracking, priority, blockers, and human work coordination happen. ClickUp does not replace the vault's Markdown notes as the description of a project's *intent* — it operationalizes the *doing* of that intent.
- **n8n = automation and orchestration layer.** n8n is an approved, official part of the LifeOS automation ecosystem (Decision 6). It is treated as a real platform, not a hypothetical or purely experimental tool. However, this status applies to the *platform*, not to every individual workflow — each n8n workflow must be tracked with its own maturity phase (Planning, Development, Testing, Production, Maintenance) so that unfinished workflows are never implied to be production-ready.
- **AI / Copilot agents = Automation layer.** The Copilot custom agents (`.github/agents/*.agent.md`) and the AI role personas (`AI/*.md`) are approved to live under Automation (Decision 3). Governance, rules, policies, and standards describing how these agents should behave may remain represented as reference documentation (e.g., under Core Systems or as linked reference material), but the agents themselves — as an operating capability — belong under Automation.
- **Product repositories = focused product delivery systems.** Each packaging/product brand (12oz, ALT Syrup, Bravo Paws) and each software product (TradeIQ) is tracked as its own Product Systems List, not merged into a single catch-all list.
- **Client repositories = focused client delivery systems.** Each client-facing delivery project (Charlotte Real Estate System, ClientVerse Public Platform) is tracked under Client Delivery, using its confirmed canonical repository.

---

## ClickUp Folder Mapping

### Core Systems

- **LifeOS Enterprise (the vault/system itself)** — belongs here because it is the meta-system: command center, dashboards, metadata schema, templates, and validation scripts that everything else depends on. It is not a client or product deliverable.
- **Governance & Metadata Standards** (`architecture/METADATA_SCHEMA.md`, `docs/LifeOS_Specification_v1.md`, `docs/CANONICAL_LIVE_STATUS.md`, `docs/CURRENT_STATE_AUDIT.md`) — belongs here because these are the standards that govern how every other system records status.
- **Agent Governance & Standards (documentation only)** — belongs here as reference documentation describing rules/policies for how Copilot/AI agents should operate. This is distinct from the agents themselves, which are tracked under Automation per Decision 3.
- **Web Vault Portal (Next.js app)** — **RESOLVED (Decision 2):** classified under Core Systems. It is an internal LifeOS operating/control surface (renders the vault, hosts the Command Center, dashboards, and interactive operations) and is explicitly not a customer-facing product, even though it is shipped and versioned (v1.0.0, deployed to Vercel).

### Client Delivery

- **Charlotte Real Estate System** — approved client outcome under the ClientVerse business; live site with explicit production-integration blockers recorded in the vault.
- **ClientVerse Public Platform — RESOLVED (Decision 4).** Canonical GitHub repository is `ebyron357/clientverse` (confirmed by owner, private repo, exists). This is the ClientVerse public website / lead-acquisition platform. This project was previously tracked in the vault under `Projects/ClientVerse Store Builds.md`; that vault note describes the same delivery work now confirmed to map to this repository. There is no separate "ClientVerse Store Builds" repository. CRM / GoHighLevel integration is **not yet fully connected** — this is planned follow-up implementation work, tracked as its own task, and does **not** block migrating this project into ClickUp.
- **ClientVerse (business umbrella)** — the parent business record grouping the two client projects above; represented as the parent List context, not a duplicate task.

### Product Systems

- **TradeIQ** — approved product outcome; a standalone software product (trading intelligence) with its own business and project record, distinct from client delivery work.
- **ALTERNATIVE 12oz — RESOLVED (Decision 1).** Tracked as its own separate List/project under Product Systems. Canonical active repo per `PROJECT_REPO_REGISTRY.md`: `ebyron357/12oz`. No vault Project/Business note currently exists — creating one is tracked as follow-up work, not a migration blocker.
- **ALT Syrup — RESOLVED (Decision 1).** Tracked as its own separate List/project under Product Systems. Canonical active repo per `PROJECT_REPO_REGISTRY.md`: `ebyron357/alt-syrup-labels` (status: ACTIVE / RECOVERY — final release files not confirmed in hand). No vault Project/Business note currently exists — creating one is tracked as follow-up work.
- **Bravo Paws — RESOLVED (Decision 1).** Tracked as its own separate List/project under Product Systems. Canonical active repo per `PROJECT_REPO_REGISTRY.md`: `ebyron357/ebyron357-BravoPaws-Official`. No vault Project/Business note currently exists — creating one is tracked as follow-up work.
- **Shared Packaging Infrastructure** — per Decision 1, shared packaging infrastructure (e.g., barcode generation, shared brand asset tooling referenced in `40 Resources/Technology/Technology and Repository Registry.md`) may remain tracked separately from the three product-specific Lists above; it is not merged into any single product's List.

### Automation

- **OpenRouter Integration / LifeOS CLI** (`integrations/openrouter/`) — an implemented, working automation/integration component, so it qualifies as an approved automation system.
- **Vault-tracked Automation Backlog Ideas** (`10 Projects/Build AI Consultant Portfolio.md`, `10 Projects/Build YouTube to Knowledge Engine.md`, `10 Projects/Operationalize Content-to-Lead Service.md`) — active projects that build repeatable automated/semi-automated pipelines.
- **Capture Processing Workflow** (`workflows/CAPTURE_PROCESSING_WORKFLOW.md`) — documented process, not yet exercised end to end.
- **Copilot / AI Agents — RESOLVED (Decision 3).** The actual Copilot custom agents (14 `.agent.md` files) and AI role personas (`AI/*.md`) are tracked under Automation as a single simple List, not one List per agent. Additional per-agent Lists should only be created if a genuine future operational need justifies it.
- **n8n — RESOLVED (Decision 6).** Classified under Automation as an official, real automation/orchestration platform — not experimental or hypothetical. Individual workflows are tracked with their own maturity phase (Planning, Development, Testing, Production, Maintenance); the platform-level approval does not imply any specific workflow is production-ready.

### Portfolio Cleanup

- **Legacy Folder Archive & Review — RESOLVED WITH SAFETY RULE (Decision 5).** The PARA/numbered structure (`00 Home` … `90 Archive`) is the approved standard going forward. Legacy flat folders (`Businesses/`, `Projects/`, `AI/`, `Automations/`, `Command Center/`, `Dashboards/`, `Knowledge/`, `Learning/`, `People/`, `Resources/`, `SOPs/`, `Tools/`, `URLs/`) must not remain mixed indefinitely into active operational views, but must **not be deleted**. Each legacy folder must be reviewed for unique information, links, assets, or operational dependencies before being moved into an archive/review path. History must be preserved.
- **Duplicate/archive GitHub repos** per `PROJECT_REPO_REGISTRY.md`: `ALT-Label-System`, `alternative-packaging-system`, `alternative-passionFruit-production`, `alternative-lychee-sweet-tea`, `ALT-Syrup-Label-System`, `Bravo-Labels-`, `Bravofinal` — explicitly marked "archive/reference" and "do not use as active" by the registry's own governance rule.
- **Technology and Repository Registry P1 Review — RESOLVED as required follow-up (Decision 7).** A dedicated review of `40 Resources/Technology/Technology and Repository Registry.md` is required before the overall portfolio migration can be considered fully closed (see "Recommended Execution Order," Phase 8).

---

## Exact Lists to Create

> Every List below is proposed only. No ClickUp List has been created.

### Core Systems Folder

**List: LifeOS Foundation**
- Folder: Core Systems
- Purpose: Track validation and stabilization of the vault/control-plane itself.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (root, `architecture/`, `docs/`, `templates/`, `99 Templates/`, `AGENTS.md`, `workflows/CAPTURE_PROCESSING_WORKFLOW.md`)
- Classification: ACTIVE
- Priority: P0 (Urgent)
- Current state: Foundation complete per `docs/CANONICAL_LIVE_STATUS.md`; visual Obsidian validation still open per `Projects/LifeOS Enterprise.md` checklist.
- Immediate next action: Open the vault in Obsidian and verify all core dashboards render visually; resolve any P0/P1 defects found.
- Evidence: `Businesses/LifeOS.md` KPI table; `Projects/LifeOS Enterprise.md` Validation Checklist; `docs/CANONICAL_LIVE_STATUS.md`.

**List: Governance & Docs**
- Folder: Core Systems
- Purpose: Reference-only tracking of standards documents; not actionable work.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`architecture/METADATA_SCHEMA.md`, `docs/LifeOS_Specification_v1.md`, `docs/CANONICAL_LIVE_STATUS.md`, `docs/CURRENT_STATE_AUDIT.md`)
- Classification: MAINTAIN
- Priority: Normal
- Current state: Complete/stable documentation; no open task lists inside the files themselves.
- Immediate next action: None — link as reference only.
- Evidence: File contents are specifications/status records with no unchecked action items.

**List: Agent Governance & Standards**
- Folder: Core Systems
- Purpose: Track maintenance of the governance rules, policies, and standards that describe how Copilot/AI agents should operate. This is distinct from the agents themselves (see Automation → Copilot / AI Agents).
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`.github/agents/*.agent.md` as reference documentation, `AI/*.md`)
- Classification: MAINTAIN
- Priority: Low
- Current state: Active and current (14 agent definition files present, 4 AI role files present).
- Immediate next action: None identified at this time; update only if governance standards change.
- Evidence: Directory listing of `.github/agents/` (14 files) and `AI/` (4 files: Automation Advisor, Chief of Staff, Librarian, Project Manager).

**List: Web Portal**
- Folder: Core Systems (RESOLVED — Decision 2)
- Purpose: Track ongoing evolution of the read-only Next.js web portal over the vault as an internal operating/control surface.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`app/`, `components/`, `lib/`, `tests/`, `package.json`)
- Classification: ACTIVE
- Priority: High
- Current state: Shipped v1.0.0, deployed to Vercel; CHANGELOG documents active recent work (Workspace OS V1, Interactive Operations V2, Voice V1).
- Immediate next action: Per `docs/CANONICAL_LIVE_STATUS.md` activation table — supply `LIFEOS_WRITE_ENABLED`/`LIFEOS_WRITE_SECRET`/`LIFEOS_GITHUB_TOKEN` to activate draft-PR persistence, and `LIFEOS_VOICE_ENABLED` to activate the Voice Console, if those capabilities are wanted.
- Evidence: `package.json` version `1.0.0`; `CHANGELOG.md` `[1.0.0]` entry; `docs/CANONICAL_LIVE_STATUS.md` "Activation state" table.

### Client Delivery Folder

**List: ClientVerse Program**
- Folder: Client Delivery
- Purpose: Parent tracking context for the ClientVerse business; not a task itself.
- GitHub repository/repositories: n/a (business-level record: `Businesses/ClientVerse.md`)
- Classification: ACTIVE
- Priority: P0 (Urgent)
- Current state: Active business with two active projects and one open next action (reusable handoff checklist).
- Immediate next action: Create reusable handoff checklist.
- Evidence: `Businesses/ClientVerse.md` frontmatter `status: active`, `priority: P0`.

**List: Charlotte Real Estate System**
- Folder: Client Delivery
- Purpose: Track the client real estate delivery project.
- GitHub repository/repositories: `ebyron357/charlotte-real-estate-system`
- Classification: ACTIVE
- Priority: P0 (Urgent)
- Current state: Live site; production integrations unverified.
- Immediate next action: Confirm environment variables and lead routing.
- Evidence: `Projects/Charlotte Real Estate System.md` (`status: active`, `blocker: Production integrations need final verification`).

**List: ClientVerse Public Platform** (RESOLVED — Decision 4)
- Folder: Client Delivery
- Purpose: Track the ClientVerse public website / lead-acquisition platform delivery project. Previously tracked in the vault as "ClientVerse Store Builds"; the canonical repository has now been confirmed and no separate Store Builds repository exists.
- GitHub repository/repositories: `ebyron357/clientverse` (private, confirmed canonical by owner 2026-08-10).
- Classification: ACTIVE
- Priority: P0 (Urgent) — the underlying delivery work remains active/blocked on credentials regardless of the repository question, which is now resolved.
- Current state: Client store/website workflow active; demo catalog fallback exists; production credentials still needed; CRM / GoHighLevel integration not yet connected (planned follow-up, not a blocker).
- Immediate next action: Complete credential workflow and connect production settings. Track CRM/GoHighLevel integration as a separate planned task (see Tasks section) — do not treat it as blocking this List's migration.
- Blocker: "Credentials and final catalog are not fully available" (repository identity is no longer a blocker).
- Evidence: `Projects/ClientVerse Store Builds.md` (`status: waiting`, `waiting_on: API credentials`); `PROJECT_REPO_REGISTRY.md` "Other Active Project Repos" table (`ebyron357/clientverse` entry, confirmed 2026-08-10).

### Product Systems Folder

**List: TradeIQ Product**
- Folder: Product Systems
- Purpose: Track TradeIQ feature roadmap and MVP definition.
- GitHub repository/repositories: `ebyron357/tradeiq-command-center`
- Classification: ACTIVE
- Priority: P1 (High)
- Current state: Feature prioritization started; consolidated roadmap needed.
- Immediate next action: Reconcile current feature plan against competitor app feature sets.
- Evidence: `Projects/TradeIQ.md` frontmatter `status: active`, `priority: P1`; task list.

**List: ALTERNATIVE 12oz** (RESOLVED — Decision 1)
- Folder: Product Systems
- Purpose: Track the ALTERNATIVE 12 oz beverage labels production system as its own separate product List.
- GitHub repository/repositories: `ebyron357/12oz`
- Classification: ACTIVE
- Priority: Not yet rated in the vault — recommend owner assigns a native ClickUp priority at List creation.
- Current state: ACTIVE per `PROJECT_REPO_REGISTRY.md`; contains production system, SKU files, brand assets, codes, exports, release scripts, and release dashboard.
- Immediate next action: Finish ALTERNATIVE 12 oz beverage print readiness (per `PROJECT_REPO_REGISTRY.md` "Current Focus Order," item 3). **Follow-up (not a blocker):** create a canonical `Projects/ALTERNATIVE 12oz.md` vault note.
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table.

**List: ALT Syrup** (RESOLVED — Decision 1)
- Folder: Product Systems
- Purpose: Track the ALT syrup labels production system as its own separate product List.
- GitHub repository/repositories: `ebyron357/alt-syrup-labels`
- Classification: ACTIVE / RECOVERY
- Priority: Not yet rated in the vault — recommend owner assigns a native ClickUp priority at List creation.
- Current state: "Final release files are not confirmed in hand" per `PROJECT_REPO_REGISTRY.md`.
- Immediate next action: Recover or rebuild ALT syrup final files (per `PROJECT_REPO_REGISTRY.md` "Current Focus Order," item 2). **Follow-up (not a blocker):** create a canonical `Projects/ALT Syrup.md` vault note.
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table.

**List: Bravo Paws** (RESOLVED — Decision 1)
- Folder: Product Systems
- Purpose: Track the Bravo Paws labels production system as its own separate product List.
- GitHub repository/repositories: `ebyron357/ebyron357-BravoPaws-Official`
- Classification: ACTIVE
- Priority: Not yet rated in the vault — recommend owner assigns a native ClickUp priority at List creation.
- Current state: ACTIVE per `PROJECT_REPO_REGISTRY.md`; contains current Bravo requirements, project status, asset inventory, and Illustrator automation scripts.
- Immediate next action: Wrap Bravo Paws labels (per `PROJECT_REPO_REGISTRY.md` "Current Focus Order," item 1). **Follow-up (not a blocker):** create a canonical `Projects/Bravo Paws.md` vault note.
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table.

**List: Shared Packaging Infrastructure** (RESOLVED — Decision 1, may remain separate)
- Folder: Product Systems
- Purpose: Track shared tooling/infrastructure used across packaging brands (e.g., barcode generation) that is not specific to any single product.
- GitHub repository/repositories: Not a dedicated repo — referenced via `40 Resources/Technology/Technology and Repository Registry.md` (e.g., `metafloor/bwip-js` for barcode generation across "THE ALTERNATIVE, ALT syrups, Bravo Paws, STAXX").
- Classification: MAINTAIN
- Priority: Not yet rated.
- Current state: Approved — Next per the registry.
- Immediate next action: Build one verified SVG barcode generation test (per registry entry).
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` `metafloor/bwip-js` row.

### Automation Folder

**List: Integrations**
- Folder: Automation
- Purpose: Maintain the OpenRouter multi-model LLM router integration used by LifeOS tooling.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`integrations/openrouter/`)
- Classification: MAINTAIN
- Priority: Low
- Current state: Present and appears functional (own `package.json`, README, `lib/router.js`, `lib/client.js`, `lifeos-cli.js`, `.env.example`).
- Immediate next action: None identified from repository evidence; track for ongoing maintenance only.
- Evidence: Directory listing of `integrations/openrouter/`.

**List: Automation Backlog**
- Folder: Automation
- Purpose: Track the three active vault projects that build repeatable automated/semi-automated pipelines.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`10 Projects/Build AI Consultant Portfolio.md`, `10 Projects/Build YouTube to Knowledge Engine.md`, `10 Projects/Operationalize Content-to-Lead Service.md`)
- Classification: ACTIVE (all three)
- Priority: P0 (Build AI Consultant Portfolio; Operationalize Content-to-Lead Service) / P1 (Build YouTube to Knowledge Engine)
- Current state: See individual tasks below.
- Immediate next action: See per-project next actions below.
- Evidence: Frontmatter of each of the three files.

**List: Workflows**
- Folder: Automation
- Purpose: Track the documented capture-processing workflow.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`workflows/CAPTURE_PROCESSING_WORKFLOW.md`)
- Classification: REVIEW REQUIRED (not yet exercised end to end)
- Priority: Normal
- Current state: Documented but "not yet verified" as exercised end to end.
- Immediate next action: Exercise the capture-processing workflow end to end and record the result.
- Evidence: `Businesses/LifeOS.md` KPI table.

**List: Copilot / AI Agents** (RESOLVED — Decision 3)
- Folder: Automation
- Purpose: Track the actual Copilot custom agents and AI role personas as a single, simple operational List. Do not create one List per agent unless a future operational need justifies it.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`.github/agents/*.agent.md`, `AI/*.md`)
- Classification: ACTIVE
- Priority: Low
- Current state: 14 Copilot agents and 4 AI role personas active and current.
- Immediate next action: None identified from repository evidence; track for ongoing maintenance only. Split into per-agent Lists only if operational complexity requires it later.
- Evidence: Directory listing of `.github/agents/` (14 files) and `AI/` (4 files).

**List: n8n Automation Platform** (RESOLVED — Decision 6)
- Folder: Automation
- Purpose: Track n8n as an official, approved automation/orchestration platform within the LifeOS ecosystem. This List tracks the platform-level adoption; individual workflows are tracked as separate tasks with their own maturity phase.
- GitHub repository/repositories: n/a within this repository — n8n itself is external tooling referenced in `40 Resources/Technology/Technology and Repository Registry.md` and `40 Resources/Content Services/Content Services Tool Stack.md`. No n8n workflow files currently exist in this repository.
- Classification: ACTIVE (platform-level) — individual workflows remain at Planning/Development/Testing/Production/Maintenance phase as applicable; do not assume any specific workflow is production-ready.
- Priority: P1 (per registry entry for the ClientVerse/lead-response use case)
- Current state: Registry lists `AmplifyAutomation/n8n-templates` at "Controlled Pilot" status for a bounded ClientVerse/D'Affordable Homes/Jasmine Parker lead-response use case; no workflow has yet passed an end-to-end sandbox test.
- Immediate next action: Review speed-to-lead and appointment workflows from `AmplifyAutomation/n8n-templates`; build and validate one sandbox workflow through to a passing end-to-end test without exposing production data, then advance that workflow's individual phase from Testing toward Production.
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` row for `AmplifyAutomation/n8n-templates`; `40 Resources/Content Services/Content Services Tool Stack.md` automation tool references.

### Portfolio Cleanup Folder

**List: Legacy Folder Archive & Review** (RESOLVED WITH SAFETY RULE — Decision 5)
- Folder: Portfolio Cleanup
- Purpose: Review each legacy flat folder for unique information, links, assets, or operational dependencies, then move reviewed content into an archive/review path. Nothing is deleted.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`Projects/`, `Businesses/`, `AI/`, `Automations/`, `Command Center/`, `Dashboards/`, `Knowledge/`, `Learning/`, `People/`, `Resources/`, `SOPs/`, `Tools/`, `URLs/` vs. `00 Home/`…`90 Archive/`)
- Classification: REVIEW REQUIRED
- Priority: Normal
- Current state: Both folder sets exist in parallel; `Projects/LifeOS Enterprise.md` explicitly lists migrating legacy Projects into `10 Projects` as a pending next action.
- Immediate next action: Per-folder review: confirm no unique content, links, assets, or dependencies remain only in the legacy location; then move into an archive/review path (e.g., `90 Archive/`) while preserving history. Do not delete.
- Evidence: `Projects/LifeOS Enterprise.md` next_action frontmatter.

**List: Archive Candidate Repos**
- Folder: Portfolio Cleanup
- Purpose: Track review/archival of the 7 named duplicate GitHub repos.
- GitHub repository/repositories: `ebyron357/ALT-Label-System`, `ebyron357/alternative-packaging-system`, `ebyron357/alternative-passionFruit-production`, `ebyron357/alternative-lychee-sweet-tea`, `ebyron357/ALT-Syrup-Label-System`, `ebyron357/Bravo-Labels-`, `ebyron357/Bravofinal`
- Classification: ARCHIVE CANDIDATE (see "Archive Safety" section — none should be deleted without verification)
- Priority: Low
- Current state: Explicitly marked "archive/reference" and "Do Not Use As Active Unless Specifically Needed" in the registry.
- Immediate next action: Verify no unique assets are missing before archiving or renaming (per `PROJECT_REPO_REGISTRY.md` Current Focus Order, item 4).
- Evidence: `PROJECT_REPO_REGISTRY.md` "Do Not Use As Active Unless Specifically Needed" section and "Current Focus Order" section.

**List: Technology and Repository Registry P1 Review** (RESOLVED as required follow-up — Decision 7)
- Folder: Portfolio Cleanup
- Purpose: Perform a dedicated review of `40 Resources/Technology/Technology and Repository Registry.md` to identify any systems, repositories, or dependencies not yet represented in this ClickUp migration.
- GitHub repository/repositories: `ebyron357/LifeOS-Enterprise` (`40 Resources/Technology/Technology and Repository Registry.md`)
- Classification: REVIEW REQUIRED
- Priority: P1 (High)
- Current state: Registry contains numerous additional P0/P1 rows (e.g., `vercel/ai`, `vercel/sdk`, Axe/Accessibility Insights, `metafloor/bwip-js`) not yet individually evaluated for ClickUp migration beyond what has already been extracted into this document.
- Immediate next action: Conduct the P1 review before declaring the overall portfolio migration fully closed (see "Recommended Execution Order," Phase 8).
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` full priority queue table.

---

## Tasks to Create Later

> These are the only initial tasks directly supported by repository evidence. No tasks have been created in ClickUp.

**Task: Validate LifeOS core dashboards in Obsidian**
- ClickUp List: LifeOS Foundation
- Objective: Confirm all core dashboards render correctly when the vault is opened in Obsidian.
- Current State: Not yet verified.
- Next Action: Open the vault, enable required plugins, verify dashboard queries render without errors.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: All core dashboards render; Dataview/Bases queries resolve without errors.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `Projects/LifeOS Enterprise.md` Validation Checklist; `Businesses/LifeOS.md` KPI table.

**Task: Resolve P0/P1 runtime defects found during visual validation**
- ClickUp List: LifeOS Foundation
- Objective: Fix any defects discovered while validating dashboards in Obsidian.
- Current State: Not yet assessed.
- Next Action: Complete dashboard validation task first, then triage and fix defects found.
- Blocker: Depends on completion of dashboard validation.
- Waiting On: Dashboard validation task.
- Success Criteria: Zero P0/P1 foundation defects remain.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `Businesses/LifeOS.md` KPI table.

**Task: Exercise capture-processing workflow end to end**
- ClickUp List: Workflows
- Objective: Process one Inbox item through the documented capture-processing workflow.
- Current State: Documented but not yet exercised.
- Next Action: Process one Inbox item end to end and record the result.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: One successful capture-to-processing cycle recorded.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Normal
- Evidence: `workflows/CAPTURE_PROCESSING_WORKFLOW.md`; `Businesses/LifeOS.md` KPI table.

**Task: Confirm production environment variables and lead routing (Charlotte Real Estate System)**
- ClickUp List: Charlotte Real Estate System
- Objective: Verify production database URL, CRM webhook, retry cron, form submissions, and local market list.
- Current State: Live; production integrations unverified.
- Next Action: Confirm database URL; confirm CRM webhook; confirm retry cron; verify form submissions; verify local market list.
- Blocker: "Production integrations need final verification."
- Waiting On: None recorded beyond internal verification.
- Success Criteria: All 5 sub-checks confirmed.
- GitHub Repository: `ebyron357/charlotte-real-estate-system`
- Native ClickUp Priority: Urgent
- Evidence: `Projects/Charlotte Real Estate System.md` Tasks list.

**Task: Complete credential workflow for ClientVerse Public Platform**
- ClickUp List: ClientVerse Public Platform
- Objective: Confirm app setup, obtain API token, add environment variables, confirm demo fallback remains safe, run a live smoke test.
- Current State: Client store/website workflow active; demo catalog fallback exists; production credentials still needed.
- Next Action: Complete credential workflow and connect production settings.
- Blocker: "Credentials and final catalog are not fully available."
- Waiting On: API credentials.
- Success Criteria: Live smoke test passes after products exist.
- GitHub Repository: `ebyron357/clientverse`
- Native ClickUp Priority: Urgent
- Evidence: `Projects/ClientVerse Store Builds.md` Tasks list; `PROJECT_REPO_REGISTRY.md` "Other Active Project Repos" table.

**Task: Connect CRM / GoHighLevel integration for ClientVerse Public Platform — PLANNED / INTEGRATION REQUIRED**
- ClickUp List: ClientVerse Public Platform
- Objective: Connect the ClientVerse public website to the CRM / GoHighLevel integration for lead capture and routing.
- Current State: Not yet fully connected. This is expected future implementation work, not a defect.
- Next Action: Scope and implement the CRM/GHL connection as its own milestone once the credential workflow above is complete.
- Blocker: None — this task does **not** block the ClickUp migration or the creation of the ClientVerse Public Platform List.
- Waiting On: Prioritization by owner.
- Success Criteria: Website lead-capture forms verified to route into CRM / GoHighLevel.
- GitHub Repository: `ebyron357/clientverse`
- Native ClickUp Priority: Normal (planned follow-up, not an active blocker)
- Evidence: Owner clarification (2026-08-10); `Projects/ClientVerse Store Builds.md`.

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

**Task: Finish ALTERNATIVE 12 oz print readiness**
- ClickUp List: ALTERNATIVE 12oz
- Objective: Complete print-readiness work for the ALTERNATIVE 12 oz beverage labels.
- Current State: ACTIVE production system with SKU files, brand assets, codes, exports, release scripts, and release dashboard.
- Next Action: Finish ALTERNATIVE 12 oz beverage print readiness (registry Current Focus Order item 3).
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Print-ready state confirmed.
- GitHub Repository: `ebyron357/12oz`
- Native ClickUp Priority: High
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table and "Current Focus Order."

**Task: Recover or rebuild ALT syrup final release files**
- ClickUp List: ALT Syrup
- Objective: Recover or rebuild the final release files for ALT syrup labels.
- Current State: ACTIVE / RECOVERY — final release files not confirmed in hand.
- Next Action: Recover or rebuild ALT syrup final files (registry Current Focus Order item 2).
- Blocker: Final release files not confirmed in hand.
- Waiting On: N/A
- Success Criteria: Final release files confirmed and in hand.
- GitHub Repository: `ebyron357/alt-syrup-labels`
- Native ClickUp Priority: Urgent
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table.

**Task: Wrap Bravo Paws labels**
- ClickUp List: Bravo Paws
- Objective: Complete the Bravo Paws labels production wrap.
- Current State: ACTIVE; current requirements, project status, asset inventory, and Illustrator automation scripts present.
- Next Action: Wrap Bravo Paws labels (registry Current Focus Order item 1).
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Labels wrapped/complete per registry definition.
- GitHub Repository: `ebyron357/ebyron357-BravoPaws-Official`
- Native ClickUp Priority: Urgent
- Evidence: `PROJECT_REPO_REGISTRY.md` "Packaging Projects" table and "Current Focus Order."

**Task: Create canonical LifeOS vault notes for packaging brands** (follow-up, not a blocker)
- ClickUp List: ALTERNATIVE 12oz / ALT Syrup / Bravo Paws (one sub-task per product)
- Objective: Create `Projects/*.md` and/or `Businesses/*.md` vault notes for the three packaging brands so they are represented in the vault consistent with other tracked projects.
- Current State: No vault notes currently exist; only `PROJECT_REPO_REGISTRY.md` entries.
- Next Action: Draft one Project note per brand using the existing template and registry evidence.
- Blocker: None — explicitly does not block the ClickUp migration (Decision 1).
- Waiting On: N/A
- Success Criteria: One vault Project note exists per packaging brand.
- GitHub Repository: `ebyron357/LifeOS-Enterprise` (vault notes only)
- Native ClickUp Priority: Low
- Evidence: `PROJECT_REPO_REGISTRY.md`.

**Task: Complete LifeOS Enterprise Evidence Package (AI Consultant Portfolio)**
- ClickUp List: Automation Backlog
- Objective: Structural audit, dashboard screenshots, architecture diagram, one before-and-after workflow, one measurable operational result, privacy-safe export review, walkthrough outline.
- Current State: Active; candidate classification and flagship case-study selection already complete.
- Next Action: Complete the LifeOS Enterprise Evidence Package.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Evidence package complete and usable as a flagship case study input.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `10 Projects/Build AI Consultant Portfolio.md`; due date 2026-10-31.

**Task: Process one pilot YouTube video through the manual capture workflow**
- ClickUp List: Automation Backlog
- Objective: Process one public captioned YouTube video through the manual pilot workflow and record every failure, correction, and useful output.
- Current State: Active; no pilot yet run.
- Next Action: Run Pilot 1 (public captioned tutorial) using NotebookLM.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Transcript import, extracted resources, course outline, SOP, checklist, flashcards, quiz, and action items all verified for one pilot video.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: High
- Evidence: `10 Projects/Build YouTube to Knowledge Engine.md`; due date 2026-08-15.

**Task: Select pilot offer, niche, and campaign for Content-to-Lead Service**
- ClickUp List: Automation Backlog
- Objective: Select one pilot offer, one target niche, and one controlled campaign to run through the complete content-to-lead workflow.
- Current State: Active; pilot not yet selected.
- Next Action: Select one pilot offer, one target niche, and one controlled campaign.
- Blocker: None recorded.
- Waiting On: Not recorded.
- Success Criteria: Pilot niche/offer selected and Days 1–2 plan items completed.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Urgent
- Evidence: `10 Projects/Operationalize Content-to-Lead Service.md`; due date 2026-08-15.

**Task: Build and validate one n8n sandbox workflow for ClientVerse lead response**
- ClickUp List: n8n Automation Platform
- Objective: Review speed-to-lead and appointment workflows from `AmplifyAutomation/n8n-templates`; build and validate one sandbox workflow end to end.
- Current State: Controlled Pilot status; individual workflow phase = Planning.
- Next Action: Move the workflow from Planning to Development to Testing; do not mark Production until it passes an end-to-end test without exposing production data.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: One sandbox workflow passes an end-to-end test without exposing production data.
- GitHub Repository: n/a (external template repo `AmplifyAutomation/n8n-templates`, referenced only)
- Native ClickUp Priority: High
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` row for `AmplifyAutomation/n8n-templates`.

**Task: Review legacy flat folders for unique content before archiving**
- ClickUp List: Legacy Folder Archive & Review
- Objective: For each legacy flat folder (`Businesses/`, `Projects/`, `AI/`, `Automations/`, `Command Center/`, `Dashboards/`, `Knowledge/`, `Learning/`, `People/`, `Resources/`, `SOPs/`, `Tools/`, `URLs/`), verify no unique content, links, assets, or dependencies exist that are missing from the corresponding PARA/numbered location.
- Current State: Not yet reviewed folder-by-folder.
- Next Action: Complete a per-folder review checklist before any move to archive.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Each legacy folder is either confirmed fully migrated (safe to move to archive/review path) or its unique content is identified and migrated first.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: Normal
- Evidence: `Projects/LifeOS Enterprise.md` next_action frontmatter.

**Task: Conduct Technology and Repository Registry P1 review**
- ClickUp List: Technology and Repository Registry P1 Review
- Objective: Review all P0/P1 rows in `40 Resources/Technology/Technology and Repository Registry.md` and determine whether any additional systems/repositories/dependencies require their own ClickUp List or task beyond what is already captured in this document.
- Current State: Not yet reviewed as a dedicated pass.
- Next Action: Conduct the review before the overall portfolio migration is considered fully closed.
- Blocker: None recorded.
- Waiting On: N/A
- Success Criteria: Every P0/P1 registry row is either mapped to an existing ClickUp List/task or explicitly logged as a new follow-up item.
- GitHub Repository: `ebyron357/LifeOS-Enterprise`
- Native ClickUp Priority: High
- Evidence: `40 Resources/Technology/Technology and Repository Registry.md` full table.

Do NOT create sample tasks or placeholder tasks beyond the ones listed above — every task above is backed by an explicit, currently-open next_action or unchecked checklist item found in the repository (or is an owner-approved follow-up per the decisions above).

---

## Do Not Migrate

- **Legacy flat folders as separate content from the PARA structure** — Reason: per Decision 5, these are being consolidated into the numbered structure; they are handled through the "Legacy Folder Archive & Review" List/task, not migrated as independent, ongoing active content.
- **`ALT-Label-System`, `alternative-packaging-system`, `alternative-passionFruit-production`, `alternative-lychee-sweet-tea`** — Reason: explicitly marked archive/reference and "focus noise" in `PROJECT_REPO_REGISTRY.md`; the canonical active repo for this work is `ebyron357/12oz`. Tracked only as ARCHIVE CANDIDATE, not migrated as active work.
- **`ALT-Syrup-Label-System`** — Reason: explicitly superseded by `ebyron357/alt-syrup-labels` per the registry.
- **`Bravo-Labels-`, `Bravofinal`** — Reason: explicitly superseded by `ebyron357/ebyron357-BravoPaws-Official` per the registry.
- **`architecture/`, `docs/`, `templates/`, `99 Templates/` content in general** — Reason: reference/governance documentation, not actionable deliverables; only the two specific validation tasks already listed (dashboard validation, defect resolution) are actionable.
- **README.md index files** (e.g., `Automations/README.md`, `Tools/README.md`, `SOPs/README.md`, `URLs/README.md`, `Knowledge/README.md`, `Learning/README.md`, `People/README.md`, `Resources/README.md`, `90 Archive/README.md`) — Reason: folder-purpose descriptions with no project content of their own; remain documentation.
- **Agent governance/rules/policy documentation as if it were the agents themselves** — Reason: per Decision 3, documentation describing agent standards is reference material (tracked under Core Systems → Agent Governance & Standards); it should not be duplicated as Automation tasks. Only the agents-as-a-capability belong under Automation.
- **One ClickUp List per individual Copilot agent** — Reason: per Decision 3, keep the implementation simple; do not create 14+ separate Lists unless a future operational need justifies it.
- **Any repository consolidation, renaming, or archival action merging ClientVerse Public Platform (`ebyron357/clientverse`) with a separate CRM/GoHighLevel repository** — Reason: no evidence confirms the public website and CRM are the same system; the CRM/GHL integration is planned follow-up work, not a repository merge.
- **Treating n8n workflows as production-ready by default** — Reason: per Decision 6, n8n the platform is approved, but individual workflows must be tracked at their own maturity phase; none should be marked Production without passing an end-to-end test.
- **The OpenRouter integration's internal library files individually** (`lib/router.js`, `lib/client.js`, `lib/errors.js`, `lib/env.js`) — Reason: implementation details of one integration, already represented by the single "Integrations" List item.
- **Deleting any legacy folder, archive-candidate repo, or duplicate system** — Reason: per Decision 5 and the Archive Safety rules below, nothing is deleted; items move only into ARCHIVE CANDIDATE / REVIEW REQUIRED states pending verification.

---

## Archive Safety

Every archive or cleanup recommendation in this document must use one of the following states — nothing is ever automatically deleted:

- **ACTIVE** — currently in use, tracked as ongoing work.
- **MAINTAIN** — stable, low-effort tracking only (e.g., Governance & Docs, Integrations, Copilot/AI Agents List).
- **REVIEW REQUIRED** — needs owner or maintainer review before a final classification or action can be taken (e.g., Legacy Folder Archive & Review, Technology and Repository Registry P1 Review, Capture Processing Workflow).
- **ARCHIVE CANDIDATE** — proposed for archival, pending verification (e.g., the 7 named duplicate/legacy repos, legacy flat folders once reviewed).
- **DELETE CANDIDATE** — reserved for items that, after full verification, are confirmed to contain no unique value; none are currently designated DELETE CANDIDATE in this document.

Before any item advances from ARCHIVE CANDIDATE toward removal, the following must be verified and documented:

- Unique assets (files, designs, code not present elsewhere)
- Source files (original, non-duplicated production files)
- Client deliverables (anything delivered to or referenced by a client)
- Deployment information (live URLs, hosting configuration, environment variables)
- Credentials documentation (even if the credentials themselves are not stored in the repo)
- Repository history (commit history, issues, PRs of historical value)
- Links/dependencies (anything else in the vault or other repos that references this item)

No repository, folder, or note referenced in this document should be deleted as a result of this migration plan.

---

## Human Decisions Required

Decisions 1 through 7 from the owner review are now **RESOLVED** and have been incorporated throughout this document (see Executive Summary and the relevant Folder Mapping / List entries above). They are retained here only as a record of resolution, not as open questions:

- ~~Packaging/product systems classification~~ — RESOLVED (Decision 1): Product Systems, three separate Lists, missing vault notes are follow-up work.
- ~~Web Vault Portal classification~~ — RESOLVED (Decision 2): Core Systems.
- ~~Copilot/AI agents classification~~ — RESOLVED (Decision 3): Automation, single simple List.
- ~~ClientVerse repository identity~~ — RESOLVED (Decision 4): canonical repository confirmed by owner as `ebyron357/clientverse` (ClientVerse Public Platform). No separate "ClientVerse Store Builds" repository exists. CRM/GoHighLevel integration is planned follow-up work, not a migration blocker.
- ~~Legacy folder structure~~ — RESOLVED WITH SAFETY RULE (Decision 5): PARA is standard; legacy content reviewed then archived, never deleted.
- ~~n8n classification~~ — RESOLVED (Decision 6): Automation, official platform; workflow-level maturity phases still apply.
- ~~Technology and Repository Registry follow-up~~ — RESOLVED as required (Decision 7): scheduled as Phase 8 P1 review.

### No Remaining Unresolved Decisions

All seven original owner decisions are resolved. See "Newly Discovered Issues" below for items surfaced during this update that require future attention but do not block the ClickUp migration.

### Newly Discovered Issues (not part of the original seven — kept separate per instructions)

- **Priority for the three packaging-brand Lists is unrated.** No `priority` field exists anywhere in the vault or registry for 12oz, ALT Syrup, or Bravo Paws; a native ClickUp Priority must be assigned by the owner at List-creation time rather than inferred.
- **Depth of the Technology and Repository Registry.** The registry contains many more P0/P1 rows (e.g., `vercel/ai`, `vercel/sdk`, Axe/Accessibility Insights) beyond the ones already surfaced in this document; the Phase 8 review (Decision 7) is the correct place to resolve this, but it is called out here explicitly so it is not mistaken for already being fully covered.
- **Shared Packaging Infrastructure scope is not fully defined.** Decision 1 permits shared packaging infrastructure to remain separate from the three product-specific Lists, but the vault does not clearly enumerate everything that counts as "shared" versus "product-specific" — this may need a short scoping pass when the Phase 8 registry review occurs.
- **CRM / GoHighLevel integration for ClientVerse Public Platform is not yet connected.** This is confirmed planned follow-up implementation work, not a defect and not a migration blocker. It is tracked as its own task (see "Task: Connect CRM / GoHighLevel integration for ClientVerse Public Platform"). No separate CRM repository has been identified in the vault or registry; if one exists, it should be confirmed by the owner rather than assumed.

---

## Recommended Execution Order

**Phase 1: LifeOS and canonical portfolio stabilization**
Validate LifeOS core dashboards in Obsidian; resolve P0/P1 defects; exercise the capture-processing workflow end to end. This phase stabilizes the control plane before other work is layered on top of it.

**Phase 2: ClickUp hierarchy and core operating structure**
Create the `LIFE-OS-OPERATIONS` Space's five Folders' Lists for Core Systems (LifeOS Foundation, Governance & Docs, Agent Governance & Standards, Web Portal) and apply the custom fields and status model defined below, establishing the operating structure before populating client/product/automation work.

**Phase 3: ClientVerse and core business systems**
Confirm the ClientVerse business-level handoff checklist next action; establish the ClientVerse Program List as the parent context for client delivery work.

**Phase 4: Client delivery systems**
Confirm production environment variables and lead routing for Charlotte Real Estate System. For ClientVerse Public Platform, progress the credential workflow using the confirmed repository (`ebyron357/clientverse`); track the CRM/GoHighLevel integration as its own planned task without letting it block the migration.

**Phase 5: Product / packaging systems**
Progress the three separate packaging Lists (ALTERNATIVE 12oz, ALT Syrup, Bravo Paws) per their individual next actions; progress TradeIQ's feature reconciliation; create the follow-up vault notes for the packaging brands as time allows (non-blocking).

**Phase 6: Automation and n8n integration**
Track the OpenRouter integration for maintenance; progress the three Automation Backlog projects; track the Copilot/AI Agents List as maintenance; build and validate the first n8n sandbox workflow, advancing it through Planning → Development → Testing before any Production designation.

**Phase 7: Legacy cleanup and archive review**
Review each legacy flat folder for unique content, links, assets, or dependencies; move confirmed-migrated folders into an archive/review path while preserving history; review the 7 named duplicate/legacy GitHub repos for unique assets before any archival action — do not delete anything.

**Phase 8: Technology and Repository Registry P1 review and final portfolio reconciliation**
Conduct the dedicated review of `40 Resources/Technology/Technology and Repository Registry.md`; reconcile any additional systems/repositories/dependencies discovered against the existing ClickUp structure; only after this phase should the overall portfolio migration be considered fully closed.

---

## ClickUp Field Mapping

Use ClickUp's **native Priority** field (Urgent / High / Normal / Low) for all tasks — do not create a custom priority field.

Define the following custom fields on the Space (or on each relevant Folder/List, per ClickUp configuration norms):

**Project Health**
- Type: Dropdown
- Options: Green, Yellow, Red, Unknown

**GitHub Repository**
- Type: URL
- Note: Populate with the confirmed canonical repository for each List (e.g., `ebyron357/clientverse` for ClientVerse Public Platform). Leave blank rather than guessing for any future item whose repository identity has not been explicitly confirmed.

**Current Phase**
- Type: Dropdown
- Options: Discovery, Planning, Development, Testing, Production, Maintenance
- Note: For n8n workflows specifically, use this field at the individual-workflow level, not at the platform/List level, so that platform-level approval (Decision 6) is never confused with any single workflow's readiness.

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

## Final Migration Checklist

- [ ] Confirm this document (`docs/CLICKUP_MIGRATION_PREVIEW.md`) reflects the owner's approved decisions (1 through 7, all resolved).
- [ ] Confirm the existing `LIFE-OS-OPERATIONS` Space and its 5 existing folders (Core Systems, Client Delivery, Product Systems, Automation, Portfolio Cleanup) are the correct, final target — do not create a new Space.
- [ ] Create the ClientVerse Public Platform List using the confirmed canonical repository `ebyron357/clientverse`; do not create a separate "ClientVerse Store Builds" repository record.
- [ ] Track the CRM/GoHighLevel integration for ClientVerse Public Platform as its own planned task; do not treat it as a blocker to migration.
- [ ] Create the Lists specified in "Exact Lists to Create," one Folder at a time, following the Recommended Execution Order (Phase 1 → Phase 8).
- [ ] Create ALTERNATIVE 12oz, ALT Syrup, and Bravo Paws as three separate Lists under Product Systems — do not combine them.
- [ ] Create the Copilot/AI Agents List as a single List under Automation — do not create one List per agent.
- [ ] Classify the Web Portal List under Core Systems.
- [ ] Apply the custom fields specified in "ClickUp Field Mapping" at the Space level so they are available to every List.
- [ ] Apply the exact Status Model specified above — no additional statuses.
- [ ] Create only the tasks specified in "Tasks to Create Later" — do not add placeholder or sample tasks.
- [ ] Set native ClickUp Priority and the custom fields on each task as it is created, using the evidence recorded above.
- [ ] Track n8n workflows individually by Current Phase (Planning/Development/Testing/Production/Maintenance); do not mark the n8n platform-level List itself as "Production" in a way that implies every workflow is production-ready.
- [ ] Complete the legacy-folder review (Phase 7) before moving any legacy content into an archive path; preserve history; do not delete anything.
- [ ] Complete the Technology and Repository Registry P1 review (Phase 8) before declaring the portfolio migration fully closed.
- [ ] After ClickUp structure is created, cross-link each ClickUp task back to its GitHub evidence file/path for traceability.
- [ ] Do not migrate any item listed under "Do Not Migrate."
