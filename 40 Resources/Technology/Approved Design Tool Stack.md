# Approved Technology, Platform, Repository, and Goal Stack

**Status:** Canonical  
**Owner:** EAB Byron  
**Last reviewed:** 2026-07-19  
**Review cadence:** Quarterly or when a repeated limitation, new goal, security concern, or major platform change appears

## Purpose

This document is the canonical source of truth for approved tools, platforms, repositories, and controlled pilots used across LifeOS projects and goals. It replaces scattered recommendations and prevents duplicate subscriptions, disconnected experiments, unverified imports, and tools that do not advance a measurable outcome.

Every approved item must answer four questions:

1. Which goal does it advance?
2. Which project or life area will use it?
3. Which concrete problem does it solve?
4. What evidence will prove it created value?

## Operating Rules

1. Use the smallest effective stack.
2. Do not add a tool merely because it is popular, impressive, or free.
3. Every active tool must have a goal, project, owner, next action, and success measure.
4. GitHub is the source of truth for code, governed documentation, and change history.
5. Figma is the source of truth for approved interface systems.
6. Adobe Illustrator is the source of truth for production vector and print artwork.
7. Experimental repositories must be inspected before installation and tested on one controlled project.
8. AI-generated output is not complete until it passes relevant visual, accessibility, security, functional, and production quality control.
9. Replit is for rapid prototypes and demonstrations; approved production code must be preserved in GitHub.
10. Vercel is the preferred production and preview platform for supported web projects unless a project has a documented reason to use another host.
11. Manus is for delegated research, audits, browser work, and structured project execution; it does not replace the project repository or verification evidence.
12. A tool that no longer supports a current goal must move to the research watchlist or be removed.

# Strategic Goals

## Goal 1 — Generate Income and Business Growth

**Outcomes:** Increase qualified leads, booked appointments, completed orders, proposals, recurring revenue, and monetizable services.

**Projects:** ClientVerse, D’Affordable Homes, Take A Sweet Bakery, THE ALTERNATIVE, STAXX, Jasmine Parker real estate, Haitian Creole business agent.

**Success evidence:** Leads captured, response time reduced, appointments booked, orders completed, proposals sent, revenue confirmed, or a paid pilot launched.

## Goal 2 — Complete and Launch Current Projects

**Outcomes:** Move active websites, agents, packaging systems, and operating standards to verified production readiness.

**Success evidence:** Builds pass, deployments are live, P0 issues are resolved, required integrations work, documentation is current, and remaining work has an owner and next action.

## Goal 3 — Become Technically Elite in AI and Automation

**Outcomes:** Understand and build production-grade agents, cloud systems, local systems, voice workflows, integrations, evaluations, and deployment pipelines.

**Success evidence:** Deployed projects, GitHub commits, technical notes, certifications, portfolio examples, and the ability to explain the architecture in plain language.

## Goal 4 — Organize Life and Reduce Mental Load

**Outcomes:** Maintain one dependable LifeOS for projects, bills, email, calendar, goals, health, finances, decisions, and follow-ups.

**Success evidence:** A useful morning brief, current trackers, visible next actions, fewer forgotten commitments, and fast access to decisions and governing documents.

## Goal 5 — Improve Financial Control and Wealth

**Outcomes:** Track confirmed income, bills, recurring expenses, subscriptions, business profitability, and cash requirements.

**Success evidence:** Current financial trackers, fewer surprise expenses, reviewed subscriptions, and visible business profitability.

## Goal 6 — Build a Voice-First AI Environment

**Outcomes:** Speak naturally with agents across devices, receive understandable low-latency responses, capture information by voice, and access LifeOS hands-free.

**Success evidence:** Reliable speech recognition, spoken briefs, cross-device access, acceptable latency, and successful correction or interruption behavior.

## Goal 7 — Build Haitian Creole Business Technology

**Outcomes:** Deliver Haitian Creole and English customer service, lead capture, appointments, knowledge retrieval, messaging, and voice workflows.

**Success evidence:** Native-speaker testing, accurate business terminology, functional handoff, working appointments or lead flows, and a paid pilot.

## Goal 8 — Build a Reliable Agent Workforce

**Outcomes:** Standardize ChatGPT, Manus, Codex, Cursor, Claude, and other agents around checklists, evidence, verification, quality control, and canonical governing documents.

**Success evidence:** Fewer repeated instructions, fewer false completion claims, visible status, evidence-backed delivery, and reusable operating standards.

# Approved Core Platforms

## GitHub

**Status:** Approved — Canonical code and governance platform  
**Goals:** 2, 3, 4, 8  
**Use for:** Repositories, issues, pull requests, version history, Actions, governed documents, and evidence of work.  
**Success measure:** Every material project change is traceable to a commit or pull request and can be reviewed or rolled back.

## Vercel

**Status:** Approved — Preferred production web and AI platform  
**Goals:** 1, 2, 3, 4, 7  
**Use for:** Next.js deployment, preview environments, AI interfaces, production web applications, domains, logs, and environment configuration.  
**Success measure:** Correct repository-to-project mapping, successful builds, verified live deployments, and clear preview-versus-production status.

## Replit

**Status:** Approved — Prototype and learning platform  
**Goals:** 1, 3  
**Use for:** Rapid prototypes, demonstrations, educational experiments, and small internal tools.  
**Operating rule:** Production-worthy work must be synchronized to GitHub and deployed through the approved production platform.  
**Success measure:** A working prototype that can be demonstrated, evaluated, and transferred without losing source history.

## Manus

**Status:** Approved — Delegated research and execution platform  
**Goals:** 1, 2, 3, 4, 8  
**Use for:** Research, market analysis, browser workflows, audits, project plans, document production, and multi-step delegated work.  
**Operating rule:** Manus output must be saved to the project source of truth and verified independently.  
**Success measure:** Completed research or execution artifact with sources, evidence, and a clear project decision or next action.

## Codex, Cursor, Claude Code, and Compatible Coding Agents

**Status:** Approved — Repository implementation agents  
**Goals:** 2, 3, 8  
**Use for:** Code changes, testing, debugging, documentation, refactoring, and repository maintenance.  
**Operating rule:** Agents must read repository instructions, work through branches or approved workflows, run relevant checks, and provide evidence.  
**Success measure:** Verified commits, passing tests, accurate status, and reduced rework.

## Figma

**Status:** Approved — Primary interface-design source of truth  
**Goals:** 1, 2, 3  
**Use for:** Wireframes, prototypes, components, variables, design systems, flows, and developer handoff.

## Adobe Illustrator

**Status:** Approved — Primary vector and print-production source of truth  
**Goals:** 1, 2  
**Use for:** Logos, labels, packaging, dielines, vector masters, barcode placement, QR placement, and manufacturing files.

## Adobe Photoshop

**Status:** Approved — Primary raster-production tool  
**Goals:** 1, 2  
**Use for:** Photo cleanup, compositing, resizing, mockups, retouching, and optimized web imagery.

## Adobe Express and Canva

**Status:** Approved — Fast branded-content production  
**Goals:** 1, 2  
**Use for:** Flyers, postcards, social posts, presentations, invitations, and rapid branded variations.

## v0 and Figma Make

**Status:** Approved — Rapid interface concept generation  
**Goals:** 1, 2, 3  
**Use for:** Early concepts, component exploration, prototypes, and design-to-code experiments.  
**Operating rule:** Generated output must be reviewed and integrated through the project repository.

# Approved Design and Production Tools

## SuperDesign

**Status:** Approved — Use now  
**Goals:** 1, 2, 3  
**Projects:** D’Affordable Homes, ClientVerse, Take A Sweet Bakery, real-estate systems.  
**Use for:** Generate multiple wireframes and design directions before coding.  
**Success measure:** Faster design decisions and fewer redesign cycles after development begins.

## Onlook

**Status:** Approved — Use now  
**Goals:** 2, 3  
**Projects:** Supported Next.js and Tailwind projects.  
**Use for:** Visual layout, spacing, typography, and responsive refinement while preserving code.  
**Success measure:** Verified code changes that improve visual quality without bypassing GitHub.

## Figma Simple Design System

**Status:** Approved — Reference architecture  
**Goals:** 2, 3, 8  
**Use for:** Connect Figma variables, components, React implementation, Storybook, and documentation.  
**Success measure:** Reduced design-code drift and reuse of consistent component patterns.

## Adobe React Aria

**Status:** Approved — Accessible interaction foundation  
**Goals:** 1, 2, 3  
**Projects:** ClientVerse, D’Affordable Homes, real-estate portals, complex forms.  
**Success measure:** Keyboard, focus, screen-reader, and interaction behavior pass accessibility review.

## PackCAD Mockup with Blender

**Status:** Approved — Packaging presentation  
**Goals:** 1, 2  
**Projects:** THE ALTERNATIVE, ALT syrups, Bravo Paws, boxes and bottles.  
**Operating rule:** Mockups are presentation assets, not manufacturing proof.  
**Success measure:** Accurate, high-quality presentations created without changing production artwork.

## Axe or Accessibility Insights

**Status:** Approved — Required website quality control  
**Goals:** 1, 2, 3  
**Success measure:** Automated issues reviewed and manual keyboard, mobile, and visual checks documented.

## GSAP

**Status:** Approved — Conditional motion tool  
**Goals:** 1, 2, 3  
**Operating rule:** Use only when motion improves comprehension, storytelling, hierarchy, or conversion; respect reduced-motion preferences.  
**Success measure:** Motion works smoothly, does not harm performance, and has a documented user or business purpose.

# Approved Repositories and Reference Implementations

## `vercel/ai`

**Status:** Approved  
**Goals:** 1, 2, 3, 4, 7  
**Projects:** Clara, ClientVerse assistant, LifeOS assistant, Haitian Creole agent, Take A Sweet assistant, real-estate lead qualification.  
**Use for:** Provider-flexible AI interfaces, streaming, tools, structured output, and agent features.  
**Owner:** Project coding agent under GitHub review.  
**Next action:** Use on the next approved customer-facing AI implementation.  
**Success measure:** A deployed AI feature with working tools, error handling, logging, and evaluation.

## `vercel/chatbot`

**Status:** Approved — Reference template  
**Goals:** 1, 2, 3, 7  
**Projects:** Clara, LifeOS, ClientVerse, real estate, Haitian Creole prototype.  
**Use for:** Authentication, persistent conversations, database-backed chat, and production architecture.  
**Operating rule:** Use as a reference; do not copy unchanged into every project.  
**Success measure:** Reduced implementation time without unnecessary inherited features.

## `vercel/chat`

**Status:** Approved — Future multichannel foundation  
**Goals:** 1, 4, 6, 7  
**Projects:** Slack agents, WhatsApp business assistants, GitHub bots, internal notifications.  
**Success measure:** One verified agent workflow operating correctly across at least two approved channels.

## `vercel/sdk`

**Status:** Approved  
**Goals:** 2, 3, 4, 8  
**Projects:** LifeOS project-health dashboard and Vercel deployment monitoring.  
**Use for:** Projects, deployments, domains, environment variables, and deployment status.  
**Success measure:** LifeOS can identify the live deployment, connected repository, failures, and required owner action.

## `vercel-labs/knowledge-agent-template`

**Status:** Controlled pilot  
**Goals:** 3, 4, 7, 8  
**Projects:** LifeOS knowledge agent, AI Operating Standards, packaging knowledge, ClientVerse knowledge.  
**Success measure:** Accurate answers with source references across an approved document collection.

## `nextjs/deploy-replit`

**Status:** Approved — Replit reference template  
**Goals:** 1, 3  
**Use for:** Running supported Next.js prototypes in Replit.  
**Success measure:** Prototype launches successfully and can be transferred to GitHub without structural rework.

## `microsoft/skills`

**Status:** Approved — Cross-agent skills reference  
**Goals:** 3, 8  
**Projects:** AI Operating Standards and reusable agent workflows.  
**Operating rule:** Inspect individual skills before importing them.  
**Success measure:** One governed skill can be reused across multiple coding agents with consistent output.

## `abcnuts/manus-skills`

**Status:** Controlled review  
**Goals:** 2, 3, 8  
**Use for:** Manus planning, debugging, verification, browser work, and structured execution patterns.  
**Success measure:** Selected skills improve completion quality without conflicting with canonical standards.

## `GoogleCloudPlatform/agent-starter-pack`

**Status:** Approved — Learning and controlled cloud prototypes  
**Goals:** 1, 3, 7  
**Use for:** Production-oriented cloud agents, evaluation, observability, RAG, and CI/CD.  
**Success measure:** A monitored cloud agent prototype with documented cost, deployment, evaluation, and limitations.

## `enescingoz/awesome-n8n-templates`

**Status:** Approved — Workflow research library  
**Goals:** 1, 4, 5, 7  
**Projects:** Gmail organization, bills, calendar briefs, lead follow-up, ecommerce, Slack, and LifeOS capture.  
**Operating rule:** Security-review each workflow before credentials are connected.  
**Success measure:** Reduced manual steps, documented time saved, and no credential or data exposure.

## `AmplifyAutomation/n8n-templates`

**Status:** Controlled pilot  
**Goals:** 1, 7  
**Projects:** D’Affordable Homes, ClientVerse, Jasmine Parker, Take A Sweet.  
**Use for:** Speed-to-lead, appointments, virtual reception, CRM synchronization, and phone workflows.  
**Success measure:** Faster verified lead response and increased booked appointments.

## `OpenVoiceOS/ovos-core`

**Status:** Controlled technical pilot  
**Goals:** 3, 4, 6, 7  
**Use for:** Local or device-based voice-assistant research and potential Haitian Creole localization.  
**Success measure:** Reliable wake, speech recognition, response, and command execution on approved hardware.

## `RightNow-AI/openfang`

**Status:** Research watchlist  
**Goals:** 3, 4, 8  
**Use for:** Scheduled autonomous agent and local/cloud agent-OS research.  
**Operating rule:** Do not use for core operations while pre-1.0 stability and security remain unverified.

# Approved Label, Barcode, QR, and Physical-Workflow Repositories

## `metafloor/bwip-js`

**Status:** Approved  
**Goals:** 1, 2  
**Projects:** THE ALTERNATIVE, ALT syrups, Bravo Paws, STAXX, ecommerce inventory, ClientVerse asset tags.  
**Use for:** UPC, EAN, GS1, Code 128, QR, Data Matrix, and SVG barcode generation.  
**Success measure:** Correct symbols generated from verified product data and successfully scanned or validated.

## `heuer/segno`

**Status:** Approved  
**Goals:** 1, 2, 4  
**Projects:** Product COAs, bakery ordering, real-estate signs, onboarding cards, LifeOS physical labels.  
**Use for:** Standards-focused QR generation in SVG, EPS, PDF, and PNG.  
**Success measure:** QR codes scan from printed proofs and resolve to the correct approved destination.

## `bcbnz/pylabels`

**Status:** Approved — Prototype and internal printing  
**Goals:** 1, 2, 4  
**Projects:** Bakery ingredients and orders, product prototypes, mailing labels, event name tags, folders, storage, and devices.  
**Success measure:** Correct dimensions, readable output, and accurate variable data on printed sheets.

## `receiptline/receiptline`

**Status:** Controlled pilot  
**Goals:** 1, 2  
**Projects:** Bakery tickets, ecommerce pick-pack, inventory, shipping, and operational thermal labels.  
**Success measure:** Reliable thermal output on the selected printer without replacing premium consumer packaging workflows.

## `galou/inkscape_generator`

**Status:** Controlled pilot  
**Goals:** 1, 2  
**Use for:** Variable SVG label generation from approved templates.  
**Operating rule:** Illustrator remains the production master for regulated or manufacturing artwork.

# Project-to-Goal Adoption Matrix

| Project or area | Primary goals | Approved platforms and repositories | Measurable result |
|---|---|---|---|
| LifeOS | 3, 4, 5, 6, 8 | GitHub, Vercel, Vercel SDK, knowledge-agent pilot, n8n, OpenVoiceOS pilot | Morning brief, current trackers, visible project health, voice capture |
| ClientVerse | 1, 2, 3, 7 | Vercel AI SDK, Chatbot, Chat, n8n, Google Agent Starter Pack | Qualified leads, paid automation services, faster delivery |
| D’Affordable Homes | 1, 2 | Figma, SuperDesign, Vercel, Chatbot, n8n, Segno | Leads captured, appointments booked, accessible production site |
| Jasmine Parker real estate | 1, 2 | Vercel SDK, Chatbot, n8n, Segno, pylabels | Live site stability, lead response, open-house operations |
| Take A Sweet Bakery | 1, 2 | Replit prototype, Vercel production, n8n, pylabels, ReceiptLine pilot, Segno | Online orders, payment readiness, correct product and order labels |
| THE ALTERNATIVE and ALT | 1, 2 | Illustrator, Photoshop, PackCAD, Blender, bwip-js, Segno | Manufacturing-ready artwork and verified barcode/QR assets |
| Bravo Paws | 1, 2 | Illustrator, PackCAD, bwip-js, Segno, pylabels | Correct production label, COA access, lot and prototype labels |
| Haitian Creole agent | 1, 3, 6, 7 | Vercel AI, Chat, Google Agent Starter Pack, OpenVoiceOS pilot | Native-speaker-approved text or voice pilot with business workflow |
| AI Operating Standards | 3, 8 | GitHub, Microsoft Skills, selected Manus Skills | Consistent agent execution and evidence-backed completion |
| Financial organization | 4, 5 | Gmail workflows, n8n research, LifeOS trackers | Confirmed income and bills tracked with fewer manual steps |

# Required Record for Every Future Tool or Repository

Every future entry must include:

- Exact name or repository
- Platform category
- Approval status
- Primary goal
- Exact project or life area
- Problem solved
- Priority: now, next, later, or watchlist
- Cost and infrastructure implications
- Complexity
- Security and privacy risk
- Owner
- Next action
- Success measure
- Last reviewed date

# Explicitly Not Approved

- Adding tools without tying them to a current goal.
- Importing an entire skills or template repository without inspecting selected files.
- Duplicating general-purpose website generators.
- Allowing Replit, Manus, or visual editors to become an untracked source of truth.
- Connecting credentials to community automation templates before security review.
- Treating AI-generated design, code, legal copy, health guidance, packaging, or financial classifications as verified without the required review.
- Maintaining conflicting tool lists across projects.

# Review and Change Control

Any future change must replace this document with a complete updated version. The replacement must preserve all still-approved guidance, merge approved changes, remove duplicates, update statuses and dates, reorganize sections when needed, and keep this file as the single canonical technology, platform, repository, and goal inventory.