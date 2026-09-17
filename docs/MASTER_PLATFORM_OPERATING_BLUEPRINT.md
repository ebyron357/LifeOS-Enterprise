# LifeOS Master Platform Operating Blueprint

**Status:** CANONICAL CANDIDATE — OWNER REVIEW REQUIRED  
**Version:** 1.2  
**Date:** 2026-09-07  
**Owner:** Emmanuel Byron  
**Supersedes:** Version 1.1 candidate dated 2026-09-07 and Version 1.0 dated 2026-08-26  
**Purpose:** Define the permanent operating architecture for the user's AI engineering, business, monetization, cognitive-support, knowledge-intake, execution, quality-control, learning, and automation environment.

---

## 1. Core Principle

LifeOS is not another project. It is the human command center above all projects.

The system exists to reduce cognitive load, preserve continuity, prevent duplicated work, turn discoveries and conversations into verified execution, and let specialized agents carry reversible work while maintaining evidence, safety, owner control, and reusable knowledge.

The operating loop is:

> **Discover → Capture → Classify → Evaluate → Own → Execute → Check → Prove → Learn → Teach → Automate → Measure → Close**

For implementation work, that expands to:

> **Discover → Capture → Classify → Evaluate → Adapt → Build → Test → Audit → Evidence → Approve → Deploy → Verify → Learn → Update the Playbook**

Every material tool, repository, video, document, agent, marketplace, workflow, opportunity, decision, failure, lesson, or idea enters this system.

---

## 2. Permanent Operating Rules

### 2.1 Nothing important lives only in conversation

Anything important discovered or decided in chat, voice, Slack, meetings, files, or agent work must become one or more durable objects:

- Task
- Decision
- Blocker
- Resource
- Tool
- Repository
- Skill candidate
- Lesson
- SOP
- Automation candidate
- Evidence
- ROI item
- Memory item
- Execution Card
- Capability record

If a material item remains only in conversation, the operating loop is incomplete.

### 2.2 Source of truth beats memory

Memory preserves what happened. The source of truth defines what is currently correct.

When two authoritative-looking sources conflict:

> **STOP → FLAG THE CONFLICT → RESOLVE THE CANONICAL SOURCE → THEN EXECUTE**

Agents do not guess through source-of-truth conflicts.

### 2.3 One task has one accountable owner

Every meaningful work item has one accountable owner. Other agents may research, review, test, or advise, but they do not independently change the same work unless ownership is deliberately reassigned.

### 2.4 Evidence beats activity

An agent saying “done,” a deployment existing, a build passing, or a page looking right is not completion by itself. The required outcome must exist and evidence must prove it.

### 2.5 No orphan discoveries

No tool, repository, resource, idea, or lesson is saved without a disposition or an explicit review state. “Bookmark it and forget it” is not an operating state.

### 2.6 Every material effort must connect to value

Every significant activity should connect to at least one of:

- generates revenue
- unlocks revenue
- protects revenue
- saves time
- reduces cost
- reduces risk
- reduces cognitive load
- creates reusable knowledge or IP
- creates a proven organizational capability

Work with no clear value requires explicit strategic justification before consuming significant resources.

---

## 3. Canonical Layer Model

### Layer 1 — LifeOS Human Command Center

LifeOS is the front door. It must answer at a glance:

- What needs attention now?
- What is making money?
- What can make money next?
- What is blocked?
- What is running autonomously?
- What needs owner judgment?
- What changed while the owner was away?
- Where did work stop?
- What is the one next action?
- What evidence supports the current status?
- What useful resources were discovered?
- Which resources deserve implementation?
- What was learned and standardized?

LifeOS must not become a second code repository, task system, observability platform, or duplicate command center.

### Layer 2 — Platform Capabilities

Capabilities installed once and reused across projects include, where appropriate:

- GitHub standards
- implementation-agent workflows
- centralized audit and release gates
- Vercel deployment standards
- Supabase/Postgres patterns
- n8n automation
- browser QA
- security scanning
- evidence capture
- observability
- agent orchestration
- shared design QA
- cognitive-support tooling
- marketplace intelligence
- Universal Resource Intelligence
- reusable skills and lessons

A platform capability should not be rebuilt separately inside every project when it can be inherited.

### Layer 3 — Project Template / Golden Baseline

Every new software project should inherit a reusable baseline containing, where applicable:

- repository structure
- issue templates
- pull request template
- labels
- project board conventions
- CI
- test framework
- browser smoke tests
- accessibility checks
- security checks
- audit hooks
- evidence conventions
- documentation skeleton
- environment-variable checklist
- deployment checklist
- rollback checklist
- agent instructions
- playbook location
- closeout checklist

### Layer 4 — Individual Projects

Project-specific features remain inside their own repositories. Project-specific functionality moves into the platform layer only after deliberate generalization, evidence, and approval.

---

## 4. Architecture Classification

Before implementation, every new capability, repository, MCP, agent, workflow, component, automation, or reusable knowledge asset is classified as:

### PLATFORM
Improves how many projects are built, tested, operated, documented, learned from, monetized, or managed.

### TEMPLATE
Should be inherited by new projects but does not need to run as a global service.

### PROJECT
Solves a unique requirement for one project.

Architecture classification is separate from resource disposition. Example: a resource may be `PLATFORM` in relevance while its disposition is `EXTRACT`.

No material implementation begins until the architecture classification is recorded.

---

## 5. Universal Resource Intelligence

### 5.1 Purpose

LifeOS owns useful resources from discovery through final disposition and, when approved, verified implementation.

The owner experience should be:

> **FIND IT → DROP IT → USE THE RESULT**

Everything between capture and a usable result belongs to Resource Intelligence.

### 5.2 Intake surfaces

Approved intake surfaces may include:

- LifeOS Capture / Inbox
- Slack intake channel or approved Slack command
- browser/share extension when implemented
- direct upload
- approved email intake
- manual LifeOS entry

Slack is an optional front door, not the permanent database. A capture surface must never claim durable processing when the item exists only in browser-local state.

### 5.3 Supported resource types

At minimum:

- GitHub repositories
- YouTube videos
- webpages/articles
- PDFs and uploaded documents
- screenshots/images when appropriate
- software tools/applications
- courses
- social posts/threads
- prompts
- research papers
- products/services
- ideas/internal notes

### 5.4 Canonical Resource record

Every resource creates or updates one durable Resource record with at least:

- Resource ID
- title/name
- original source / exact URL or file reference
- canonicalized source identity
- resource type
- date added
- submitted-through surface
- submitter when relevant
- processing status
- architecture classification: `PLATFORM / TEMPLATE / PROJECT`
- disposition: `ADOPT / ADAPT / EXTRACT / WATCH / ARCHIVE / REJECT`
- related projects/areas
- summary
- problem solved
- target users
- proven capabilities
- possible capabilities
- unverified claims
- value mapping / ROI connection
- current-stack overlap
- risks
- licensing/reuse constraints
- dependencies/costs/credentials
- generated assets
- implementation owner/agent
- next action
- evidence requirement
- evidence
- last reviewed date
- duplicate/superseded links

### 5.5 Processing states

Use:

- NEW
- PROCESSING
- NEEDS REVIEW
- APPROVED
- IMPLEMENTATION
- COMPLETED
- WATCH
- ARCHIVED
- REJECTED

A resource is not `COMPLETED` merely because it was summarized.

### 5.6 Standard analysis

Every resource answers:

1. What is this, in plain English?
2. What problem does it actually solve?
3. Who is it for?
4. What can it demonstrably do?
5. What is only possible or claimed but unverified?
6. Where could it improve an active project, platform capability, money lane, learning goal, or operation?
7. What current tool/workflow does it overlap with?
8. What would adoption cost in implementation effort, maintenance, credentials, API spend, licensing, vendor lock-in, security/privacy, and cognitive load?
9. What is the evidence-based disposition?
10. What exact next action, owner, QC method, and evidence are required?

Initial summaries should be concise; durable assets may be detailed.

### 5.7 Value mapping and prioritization

Evaluate whether the resource can:

- improve an active project
- replace/simplify an existing tool
- eliminate manual work
- reduce cost/API/agent usage
- reduce cognitive load
- create a reusable platform capability
- become a client service
- become a product/template/marketplace opportunity
- generate/protect revenue
- improve LifeOS
- improve reliability/security/QA

High-value, low-complexity items move first. Resources with no clear business, risk, cognitive, learning, or capability value move to low priority or rejection.

### 5.8 Disposition engine

Every processed resource receives one primary disposition:

#### ADOPT
Use substantially as-is because it fits current architecture and provides clear value.

#### ADAPT
Use as a foundation/reference but modify it to LifeOS/project standards.

#### EXTRACT
Do not install the original system. Extract useful architecture, components, processes, prompts, techniques, or knowledge.

#### WATCH
Potentially useful but not valuable, mature, or timely enough for implementation now.

#### ARCHIVE
Retain as durable reference with no active execution work.

#### REJECT
Do not use because value is too low or risk, duplication, complexity, licensing, maintenance cost, or cognitive burden is unacceptable.

Disposition may change later when evidence changes.

### 5.9 GitHub repository processor

Inspect, where relevant:

- purpose/problem solved
- architecture
- languages/frameworks
- dependencies/external services
- license/reuse obligations
- recent maintenance
- releases
- issues/PRs
- contributors/community health
- documentation/install complexity
- tests/CI
- security/dependency concerns
- overlap with current stack
- cognitive/business value

Then:

1. classify `PLATFORM / TEMPLATE / PROJECT`;
2. assign disposition;
3. preserve licensing requirements;
4. map services/credentials/costs;
5. create an implementation blueprint only when justified;
6. route work to the best available executor;
7. isolate/test before adoption;
8. browser-test when applicable;
9. run security/dependency checks;
10. run independent audit/release assurance when applicable;
11. capture evidence;
12. update the capability/tool registry and playbook.

Repositories are never copied blindly.

### 5.10 YouTube processor

A YouTube resource is not processed when only summarized. Extract, where supported and lawful:

- main idea
- important claims
- techniques
- tools mentioned
- processes/demonstrations
- warnings
- examples
- actionable steps
- useful timestamp/source evidence

Generate only materially useful assets: How-To, SOP, Skill, Prompt, Checklist, Tool record, or Implementation blueprint.

Never fabricate transcripts, URLs, demonstrations, usage results, or claims. Preserve provenance and copyright/privacy boundaries.

### 5.11 Article, PDF, course, and generic-document processor

Extract relevant principles, facts, frameworks, procedures, tools, examples, warnings, research, and recommendations. Then decide whether the durable output should be a Knowledge Note, SOP, Skill, How-To, Prompt, Checklist, Playbook, Tool record, or implementation project.

### 5.12 Asset Factory standards

#### Skill
A repeatable agent capability containing:

- name
- purpose
- trigger
- prerequisites
- required inputs
- allowed tools
- procedure
- decision rules
- stop conditions
- required output
- QC
- verification/evidence

A skill remains **Draft** until another agent uses it, the intended outcome works, and QC passes.

#### How-To
A human-facing guide containing:

- goal
- prerequisites
- one-action-per-step instructions
- what the user should see
- common mistakes/failure branch
- completion check

#### SOP
An operational repeatable process containing:

- purpose
- trigger
- owner
- prerequisites
- procedure
- exception handling
- QC
- evidence requirements
- definition of completion

#### Implementation blueprint
Contains:

- objective
- business reason
- target platform/project
- architecture
- required services/accounts/credentials
- data flow
- implementation steps
- assigned agent
- human-only steps
- tests
- acceptance criteria
- rollback
- evidence requirements
- final completion definition

#### Prompt / Checklist / Tool record
Prompts and checklists must be reusable rather than chat-specific. Tool records preserve purpose, category, cost/pricing when relevant, open-source/license state, approved use cases, projects using it, setup requirements, alternatives, strengths/weaknesses, status, and review date.

### 5.13 Duplicate and staleness gate

Before creating a new record, check where possible:

- exact URL
- canonical URL
- GitHub repository identity
- video ID
- tool/product name
- file hash
- semantic title/topic similarity

If an existing record represents the same resource, update the canonical record rather than create a competitor.

Periodically identify:

- dead tools
- abandoned repositories
- changed pricing/licensing
- replaced products
- stale instructions
- duplicate SOPs/prompts/checklists
- superseded workflows/documents
- duplicated exported files

Never delete a likely duplicate until unique content, history, credentials documentation, source artwork, deployment configuration, or client deliverables have been checked.

### 5.14 Execution router

Select the best currently approved executor rather than hard-code one vendor:

- ChatGPT: orchestration, research, connected systems, specifications, knowledge organization
- Codex: repository implementation, tests, debugging, engineering
- Claude Code: large-repository analysis, architecture/refactoring, engineering
- Cursor: repo-local autonomous/iterative implementation
- Replit: runnable implementation/browser-test environments
- Manus or another approved autonomous agent: broad multi-step research/execution
- Human owner: credentials, payments, contracts, legal approval, MFA, irreversible or consequential judgment

### 5.15 Ownership and completion

**System owner:** LifeOS Resource Intelligence.

A resource remains owned until final disposition and any approved implementation is either verified complete or explicitly blocked/archived.

A handoff to another agent does not end Resource Intelligence ownership.

A resource is complete only when all applicable conditions are satisfied:

- source captured
- duplicate check completed
- resource classified
- core knowledge extracted
- relevance/value evaluated
- disposition recorded
- useful durable assets generated
- canonical records created/updated
- owner and next action recorded when implementation is justified
- QC/evidence rule recorded
- implementation evidence captured when applicable
- final status recorded

### 5.16 Resource-review cadence

Recurring resource review should:

1. find unprocessed/stalled items across approved intake surfaces;
2. rank by current-project/platform/business impact;
3. process highest-value items;
4. generate missing durable assets only when not redundant;
5. detect duplicates/stale records;
6. update current execution lanes rather than create parallel plans;
7. surface owner decisions only when materially necessary;
8. leave low-value noise unreported.

### 5.17 Human approval boundary

Human approval is required when adoption introduces material spending, credentials/account ownership, production-deployment risk, legal/licensing implications, destructive actions, security/privacy impact, or major architecture replacement.

Reversible research, classification, drafting, analysis, and safe implementation preparation should continue autonomously when authorized.

### 5.18 First end-to-end acceptance gate

Universal Resource Intelligence is not operational merely because `/inbox` accepts browser-local notes.

The first accepted pilot must prove:

1. submit a controlled external resource;
2. persist one canonical Resource record;
3. detect source type;
4. perform source-specific analysis;
5. classify `PLATFORM / TEMPLATE / PROJECT`;
6. assign disposition;
7. generate only warranted durable assets;
8. route implementation when justified;
9. capture evidence;
10. make the result searchable/resumable;
11. avoid duplicate records on resubmission;
12. preserve approval controls.

Until this gate passes, Resource Intelligence remains **NOT VERIFIED COMPLETE**.

---

## 6. Execution Control System

### 6.1 Execution Card

Every meaningful work item receives one control record containing:

- Title — plain-English work description
- Why — business/cognitive/risk reason
- Outcome — exact required result
- Owner — one accountable owner
- Tool/Agent — executor
- Source of Truth — canonical repo/document/design/record
- Allowed work
- Do Not Touch boundaries
- Step-by-step sequence
- Current Step
- Blocker / Waiting On
- Next Action
- QC method
- Evidence required
- ROI/value category
- Status

Suggested execution statuses:

- Idea
- Research
- Approved
- Executing
- Blocked
- QC
- Ready for Owner
- Production
- Standardized
- Automated
- Done

### 6.2 Agent Work Order

Every meaningful agent assignment states:

- Objective
- Business Purpose
- Source of Truth
- Allowed Work
- Do Not Touch
- Required Steps
- Required QC
- Required Evidence
- Stop Conditions
- Expected Output
- ROI Connection

Agents must report evidence and unresolved blockers, not merely activity.

### 6.3 Follow-through rule

No meaningful conversation or work session ends with only:

- “good idea”
- “look into it”
- “save this repo”
- “we should do that”
- “agent says done”

Every material item must receive, as applicable:

- Decision
- Owner
- Next action
- Due trigger/review trigger
- QC method
- Evidence of done

If these are missing, the item remains open.

### 6.4 Checkpoint / interruption recovery

Whenever work pauses, record:

- last completed step
- current state
- blocker
- exact next action
- accountable owner
- source of truth
- what not to repeat
- evidence already collected
- skill/lesson/SOP candidates

A project may be `Idea`, `Planned`, `Active`, `Blocked`, `Paused`, `Maintenance`, `Done`, or `Archived`. Waiting does not mean canceled, and every idea does not automatically become an active burden.

---

## 7. Continuous QC, Observability, and Verification

### 7.1 Continuous QC

QC runs throughout the lifecycle:

> Plan → requirement check → execute → work check → commit → code check → build → build check → deploy → production check → monitor → recheck

Use:

- real-time QC
- milestone QC
- independent verification
- recurring/overnight QC where configured

Normal software tests remain required even when AI evaluation tools are used.

### 7.2 Observability

Where practical, capture:

- prompt/instruction
- task/work order
- agent
- tool calls
- model/provider
- failures
- cost
- latency
- outcome
- traces
- evidence links

An observability system supports diagnosis; it does not replace source-of-truth records or project evidence.

### 7.3 Independent verification

> Agent claim → independent check → evidence → PASS / FAIL

Builders do not certify their own work by assertion.

### 7.4 Evidence-based status

Valid evidence may include:

- commit SHA
- pull request
- CI result
- browser screenshot/video
- route crawl
- test logs
- deployment ID
- deployed SHA
- webhook event
- database record
- API response
- audit ID
- artifact manifest
- owner verification

Allowed verification states:

- NOT STARTED
- IN PROGRESS
- BLOCKED
- READY FOR AUDIT
- FAILED AUDIT
- READY FOR OWNER
- READY FOR MERGE
- READY FOR DEPLOYMENT
- VERIFIED COMPLETE

### 7.5 Priority model for failures

- **P0 Critical:** production or business operation broken
- **P1 Launch blocker:** prevents launch/client delivery
- **P2 Important:** must be corrected but workaround exists
- **P3 Improvement:** useful but not blocking

A recurring operations brief should surface critical failures, owner decisions, verified passes, revenue blockers, emerging risks, and the first next action—not a wall of low-value status.

---

## 8. Knowledge, Memory, Learning, and Capability

### 8.1 Memory architecture

Use a stack rather than one memory system:

- Durable storage / structured project records
- AI memory layer where approved
- Project memory
- Agent memory
- Decision Library
- Failure Library
- Skills Library
- Capability Map
- LifeOS retrieval/display layer

Memory never overrides the current canonical source of truth.

### 8.2 Decision Library

Each material decision records:

- decision
- date
- reason
- owner
- affected project/platform area
- evidence/context
- what it supersedes
- current status

This prevents superseded decisions from resurfacing as current rules.

### 8.3 Failure Library

Each significant failure records:

- problem
- symptom
- root cause
- fix
- prevention
- related project
- related skill
- related SOP
- automation created or proposed
- evidence

The operating objective is to avoid paying for the same failure twice.

### 8.4 Skill creation pipeline

> Successful procedure → capture steps → remove project-specific noise → add prerequisites → add failure modes → add QC → add evidence → create `SKILL.md` → test with another agent → improve if needed → approve/version → add to Skills Library

A skill is not approved because it was written. It remains Draft until repeatability is demonstrated.

### 8.5 Human lesson pipeline

A substantial solved problem should ask: **What did we learn?**

A useful lesson records:

- what happened
- why it mattered
- root cause
- tool/process used
- what the tool actually does
- step-by-step fix
- common mistakes
- how to recognize the problem next time
- how to verify success

### 8.6 Teaching Guide standard

When useful, turn a lesson into teachable material containing prerequisites, plain-English explanation, one step at a time, expected result after each step, failure branch, QC, final test, and key lesson.

Possible outputs include internal training, employee onboarding, agent instructions, tutorials, content, Veteran Hub training, course material, and paid educational content.

### 8.7 Project Output Standard

A major completed project should be reviewed for these outputs:

1. Business Result
2. Evidence
3. QC Record
4. Decisions
5. Failures / Lessons
6. AI Skill
7. Human Lesson
8. Teaching Guide
9. SOP
10. Automation Review
11. ROI Record

Generate only the outputs that provide durable value; do not create documents for their own sake.

### 8.8 SOP pipeline

Not every lesson becomes an SOP.

> Lesson → repeatable process → QC → approval → SOP → version control → required use

### 8.9 Automation review

Every closeout asks:

> **What part of this should never require a human again?**

Candidates may include status checks, repo monitoring, report generation, task routing, brief generation, skill drafting, incident classification, deployment checks, and evidence collection.

### 8.10 Capability Map

Track what the organization can reliably do. A capability becomes **Proven** only after it is tested, produces the intended outcome, passes QC, and has reusable instructions/evidence.

---

## 9. Builder → Examiner Separation

### Builder

Typical builders include Cursor, Replit Agent, Claude Code, Codex, and specialized project agents.

Builder responsibilities:

- implementation
- refactoring
- integrations
- tests
- repair loops
- migration
- browser interaction where supported
- structured evidence production

### Examiner

For web projects, the ClientVerse Website Audit / Release Assurance system is the independent examiner where applicable. It should verify build integrity, route coverage, HTTP status, links, forms, browser smoke, console/network errors, accessibility, responsive behavior, typography/design consistency, SEO/structured data, performance, security, evidence freshness, and deployment identity.

Desired assurance proof:

> **Known-good candidate → APPROVED → controlled defect → BLOCKED → repair → fresh APPROVED evidence**

---

## 10. GitHub Cognitive-Friendly Standard

Every maintained repository should move toward the same navigation standard.

### Issue types

- Bug
- Feature
- Integration
- Production blocker
- Research
- External credential action
- QA finding
- Security finding
- Documentation
- Monetization opportunity

### Labels

- P0 Critical
- P1 High
- P2 Normal
- P3 Low
- NOW
- NEXT
- LATER
- BLOCKED
- OWNER ACTION
- AGENT ACTION
- EXTERNAL
- QA
- SECURITY
- MONEY
- DOCUMENTATION
- COGNITIVE

### Minimum views

- Now
- Next
- Later
- Blocked
- Needs Owner
- Agent Running
- Ready for Audit
- Ready for Merge
- Revenue / Monetization

The user should not have to mentally reconstruct a repository. It should surface current state, owner, agent, blocker, next action, evidence, and definition of done.

---

## 11. Cognitive Tools Division

Cognitive support is a first-class platform lane. Evaluate tools by whether they:

- reduce choices
- reduce repeated reading
- preserve state
- improve recall
- lower context switching
- make next action obvious
- support voice
- support interruption/resumption
- make errors recoverable
- reduce visual overload
- improve confidence in completion

Required UX patterns where practical:

- one current action
- Now / Next / Later
- progress indicators
- visible blocked state
- large readable typography
- strong contrast
- reduced-motion compatibility
- voice controls where useful
- safe undo/cancel/recovery
- persistent checkpoints
- resume summaries
- concise AI summaries
- clear evidence links

Cognitive-tool candidates enter Universal Resource Intelligence before adoption.

---

## 12. Money and Opportunity System

### 12.1 Money Dashboard

Revenue lanes remain visible at the LifeOS front door. Each lane should show:

- lane name
- status
- revenue to date
- active pipeline
- expected value
- next action
- assigned agent
- owner action required
- automation coverage
- blockers
- repeatability score
- playbook link

### 12.2 Priority opportunity lanes

Where relevant:

- Shopify services/apps/themes/templates/recurring services
- websites
- ClientVerse services
- audits/release assurance
- GoHighLevel ecosystem products
- marketplace apps/templates
- auctions
- affiliate content
- TikTok affiliate workflows
- job/gig opportunities
- digital products
- training/certification opportunities
- veteran opportunities
- other validated recurring-revenue ecosystems

### 12.3 Marketplace Intelligence & Product Studio

Maintain a permanent platform-level business lane that asks:

> **Is there a reusable product, template, app, agent, integration, extension, workflow, or service that could be sold repeatedly?**

Relevant ecosystems may include Shopify, GoHighLevel, Vercel, GitHub, Slack, Figma, Canva, Adobe, WordPress, browsers, automation ecosystems, and AI-agent ecosystems.

Opportunity work includes scanning reviews, complaints, feature requests, forums, price bands, competitor gaps, and platform constraints; writing ranked opportunity briefs; and handing approved opportunities to implementation agents.

External resources discovered during this work enter Universal Resource Intelligence first.

### 12.4 Shopify lane

Maintain both a learning progression and a reusable workforce. Learning should cover merchant fundamentals, themes/Liquid/CLI, app architecture/APIs/webhooks/auth/billing, checkout extensibility/Functions/customer accounts/Flow, marketplace rules, analytics, AI/agentic commerce, agency operations, repeatable deployment, and productized services.

Potential agent roles include Store Builder, Theme/Brand, Product Catalog, Content, SEO, Conversion, QA, Integration, Analytics, Maintenance, Opportunity Scout, App Product Manager, App Builder, and Marketplace QA.

### 12.5 Auction lane

Use:

> Discover → normalize → research → estimate all-in cost → estimate value → score risk → prioritize → owner decision → track result → learn

Never hide buyer premiums, fees, taxes, shipping/transport, title issues, condition uncertainty, or platform restrictions.

### 12.6 Side-hustle opportunity engine

Maintain a continuously refreshed opportunity database rather than a static list. Record source, category, payout, time-to-cash, effort, skill, capital, recurring potential, automation potential, risk, deadline, execution link, agent fit, owner action, and status.

Prioritize fast qualification, low startup cost, short delivery cycle, reusable templates, high automation potential, repeat business, and fit with proven capabilities.

### 12.7 Affiliate automation lane

Use a compliant loop:

> find offers → validate rules → score opportunity → collect factual information → create compliant concepts/assets → render when appropriate → publish through approved channels → track performance → identify winners → iterate → document learnings

Never fabricate product claims, reviews, results, or personal usage.

---

## 13. Tool Roles, Guardrails, and Approval Boundaries

### 13.1 Tool roles

- **LifeOS:** executive interface and continuity layer
- **ClickUp:** execution truth, ownership, next action, blocker, evidence where used
- **GitHub:** engineering truth, code, branches, PRs, CI, technical evidence, skills
- **Slack:** alerts, exceptions, approvals/decisions needed; not permanent project truth
- **n8n:** approved automation/event transport
- **Google Drive / durable file storage:** durable documents/memory where used
- **Vercel:** deployment/runtime configuration
- **Supabase/Postgres:** application data and schema where used
- **Observability/evaluation tools:** supporting telemetry/QC, not source-of-truth replacements

Agents should retrieve actual state through approved connectors/APIs where practical instead of requiring repeated manual copy/paste.

### 13.2 Human approval boundaries

Agents should execute as much reversible work as possible. Human approval remains required for consequential actions including:

- merges when governance requires approval
- production deployment when not pre-authorized
- destructive production-data changes
- secrets/credentials/MFA
- billing/spending
- contracts
- legal communications
- regulated claims
- financial transactions
- irreversible publishing
- customer/client-impacting actions when not pre-authorized
- external credential enrollment

A blocker caused by one of these is labeled **OWNER ACTION**, not disguised as unfinished engineering.

### 13.3 Guardrails

Agents must not:

- merge protected/canonical work outside approval policy
- delete production data without authorization
- redesign approved assets outside scope
- spend outside authorized limits
- overwrite governing documentation without version control
- self-certify independently verified status
- invent secrets, facts, evidence, business results, or source content

---

## 14. Living Playbooks and Journey Documentation

### 14.1 Living Playbook Standard

Every mature operating lane requires one living playbook with:

1. Purpose
2. Definition of Done
3. Inputs
4. Outputs
5. Tools
6. Agents
7. Human approval points
8. Step-by-step workflow
9. Automation map
10. KPIs
11. Failure modes
12. Troubleshooting
13. Evidence requirements
14. Security/compliance boundaries
15. Cost controls
16. Lessons learned
17. Change history
18. Quick-start version
19. Detailed technical runbook

When an approved operating rule changes, retrieve the current canonical document, merge the approved change, remove duplicates, reorganize when needed, and replace the prior file with one complete updated version. Incremental fragments do not become competing sources of truth.

### 14.2 Journey Documentation

Capture where practical:

- major decisions
- milestones
- architecture changes
- failed attempts
- lessons learned
- before/after evidence
- release evidence
- important commits
- project launches
- workflow improvements
- new automation capabilities
- business experiments
- revenue milestones
- owner reflections chosen for preservation
- cognitive-load improvements

This history should be convertible into timelines, case studies, lessons, technical/business retrospectives, training material, presentations, articles, and future long-form content. Public sharing is optional; internal capture is default.

---

## 15. Project Closeout Standard

Every software project uses the same high-level closeout sequence where applicable:

1. Identify canonical branch/repository.
2. Reconcile competing branches/PRs.
3. Install from clean state.
4. Typecheck.
5. Lint.
6. Unit tests.
7. Integration tests.
8. Build.
9. Browser smoke.
10. Responsive QA.
11. Accessibility QA.
12. Typography/design-consistency QA.
13. Link/route crawl.
14. Form/API validation.
15. Security scan.
16. Performance checks.
17. SEO/structured-data checks where applicable.
18. External-provider tests where credentials exist.
19. Independent/central audit.
20. Evidence pack.
21. Resolve findings.
22. Re-audit fresh candidate.
23. Owner approval where required.
24. Merge.
25. Deploy.
26. Verify exact production SHA/version.
27. Production smoke.
28. Record business result.
29. Record QC and decisions.
30. Capture failures/lessons.
31. Review Skill / Teaching Guide / SOP candidates.
32. Review automation opportunity.
33. Record ROI/value.
34. Update playbook and journey log.
35. Close only when the required outcome exists and evidence proves it.

Typical engineering progression:

> Coded → Tested → Previewed → Deployed → Production Verified → Documented → Knowledge Captured → Closed

No project is complete because code exists, an agent finished, a deployment happened, tests passed, or a page looks good.

---

## 16. Current Reusable Platform Build Queue

Current project priorities live in current LifeOS project/portfolio data rather than this governing document. This section defines reusable platform work, not a frozen nightly queue.

### P0 — Shared intelligence and control

- implement Universal Resource Intelligence and durable external-resource intake
- create platform capability registry
- create cognitive-tool registry/scoring model
- create marketplace opportunity registry
- create money-lane dashboard model
- create unified living-playbook template
- create journey-log model
- establish durable Decision and Failure libraries
- expose checkpoint/resume state clearly

### P0 — Shared GitHub/agent execution standard

- issue templates
- PR template
- consistent labels/views
- evidence fields
- definition-of-done fields
- owner/agent conventions
- resume/checkpoint convention
- Execution Card pattern
- Agent Work Order pattern
- reusable closeout skill
- independent verification pattern

### P0 — Reusable audit/release assurance

- productionize ClientVerse Website Audit
- onboard real candidates
- store durable evidence
- expose APPROVED/BLOCKED/FAIL state to LifeOS
- prove controlled-defect detection and fresh approval after repair

### P1 — Learning and operations automation

- recurring repository/project health monitoring
- incident/failure capture
- skill-candidate generation
- project-to-lesson workflow
- automation opportunity review
- concise operations brief

### P1 — Opportunity engines

- marketplace intelligence
- Shopify opportunity scouting
- auction discovery/scoring
- job/gig scanning
- affiliate opportunity scanning

### Persistent agent roles to establish as justified

- Resource Intake / Processing Agent
- Repository Scout
- Capability Evaluator
- Adaptation Engineer
- Documentation/Playbook Agent
- Cognitive Tools Scout
- Marketplace Product Scout
- Auction Analyst
- Opportunity Scout
- Release Auditor

---

## 17. Non-Negotiable Rules

1. **One canonical source of truth per concern.**
2. **Nothing material exists only in conversation.**
3. **No duplicate command centers.**
4. **Platform capabilities are installed once whenever practical.**
5. **Every new capability/resource is classified Platform / Template / Project before implementation.**
6. **Every processed resource receives ADOPT / ADAPT / EXTRACT / WATCH / ARCHIVE / REJECT.**
7. **Resource Intelligence owns submitted resources through final disposition and verified implementation or explicit stop.**
8. **Browser-local capture is never represented as durable canonical processing.**
9. **Duplicate resources update the canonical record rather than create competing records.**
10. **One task has one accountable owner.**
11. **Source-of-truth conflicts stop execution until resolved.**
12. **Every meaningful work item has an exact next action, QC method, and evidence rule.**
13. **Builders do not self-certify.**
14. **Evidence beats activity reports.**
15. **Skill drafts remain Draft until another agent proves repeatability and QC.**
16. **Every mature lane gets one living playbook.**
17. **Approved operating-rule changes replace the full governing document; incremental fragments do not become a second source of truth.**
18. **Money lanes remain visible at the front of LifeOS.**
19. **Cognitive-load reduction and interruption recovery are product requirements.**
20. **Agents preserve state and resumability.**
21. **Credential/approval blockers are labeled honestly.**
22. **Autonomy is encouraged for reversible work; consequential actions stay approval-gated.**
23. **Do not build a custom replacement before evaluating mature existing systems.**
24. **Do not install multiple competing tools without a measurable reason.**
25. **Do not allow two repositories or documents to remain equally canonical.**
26. **Do not delete likely duplicates until unique assets/history are verified.**
27. **Completed work should create reusable learning when material.**
28. **Every closeout reviews what should be automated.**
29. **Every significant effort connects to revenue, savings, risk reduction, cognitive benefit, or reusable capability/IP.**
30. **Every material workflow should become easier the second time it is performed.**

---

## 18. Success Condition

This operating system succeeds when the owner can return after an interruption or difficult day and immediately see:

- the most important money opportunity
- the single most important current action
- what agents completed
- what failed
- what is blocked
- what needs owner judgment
- what can continue autonomously
- the evidence supporting each status
- the canonical playbook for any mature lane
- the checkpoint required to resume without reconstruction
- useful resources recently discovered
- their classification and disposition
- where generated SOPs, skills, how-to guides, prompts, checklists, tool records, and implementation blueprints live
- what was learned from completed work
- which capabilities are proven versus still Draft/experimental

LifeOS should carry memory, repetition, intake triage, QA, follow-through, learning capture, and routine execution so human energy is reserved for judgment, creativity, relationships, and consequential decisions.
