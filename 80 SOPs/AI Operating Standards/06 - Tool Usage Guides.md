# Tool Usage Guides

> **Historical source snapshot — not active canonical policy.**
>
> This file is preserved as source evidence from LifeOS PR #25. The single authoritative standards repository is [ebyron357/AI-Operating-Standards](https://github.com/ebyron357/AI-Operating-Standards). Use the approved version in that repository; do not install or maintain this LifeOS copy as a competing active standard.

**Owner:** Bwa / Byron  
**Status:** Historical source snapshot — superseded  
**Effective date:** July 19, 2026  
**Review cycle:** Quarterly and after any material platform, permission, or workflow change  
**Authority:** Replaces prior platform-specific instructions for this platform while preserving the universal requirements approved in the governing sources.  

**Scope:** Cross-platform selection, orchestration, environment choice, handoffs, and operational use of Bwa's primary AI, development, design, business, and productivity tools.  
**Version:** 2.0

---

## 1. Purpose

This guide answers four questions:

1. What kind of tool is this?
2. What should it be used for?
3. What should it not be used for?
4. What proves the task is complete?

Use the fewest tools that can reliably complete the workflow. Do not recommend a new tool until existing capabilities, cost, permissions, hardware, and setup have been reviewed.

## 2. Universal tool-selection test

Before choosing a tool, define:

- current task;
- desired output;
- source of truth;
- environment;
- files or accounts involved;
- required actions;
- quality threshold;
- approval boundary;
- budget;
- deadline;
- definition of done;
- evidence.

Score candidate tools on:

- capability;
- access to the required source;
- ability to create the required output;
- verification;
- reliability;
- privacy;
- cost per usable finished result;
- setup burden;
- device fit;
- portability and exit plan.

Do not choose based on popularity alone.

## 3. Evidence and status language

Use:

- **OBSERVED:** directly verified through a file, tool result, account, command, deployment, or live check.
- **INFERENCE:** supported by evidence but not directly verified.
- **UNKNOWN:** not checked, inaccessible, stale, or unproven.

Use work-state labels precisely:

- Not Started
- In Progress
- Blocked
- Ready for Review
- Verified Complete
- Live and Verified
- Failed Quality Control
- Not Verified

A tool opening is not proof of task completion. A generated file is not proof of installation. A deployment record is not proof that the live experience works.

## 4. Environment guide

### Local device

Use when the work needs local files, installed applications, direct hardware, offline control, or private local processing.

### Local virtual machine

Use for isolated testing on the user's computer. Its resource limits come from the physical device.

### Cloud virtual computer

Use for persistent remote processes, higher compute, Linux services, remote agents, or 24/7 workloads. The cloud machine's resources determine workload eligibility.

### Browser training lab

Use for temporary guided practice. Do not treat it as a persistent production environment.

### Hosted SaaS

Use for provider-managed workflows such as ChatGPT, Claude, Shopify, Vercel, Figma, or GoHighLevel. Verify plan and account-specific availability.

## 5. Core AI orchestration

| Tool | Category | Best use | Do not use as | Proof of completion |
|---|---|---|---|---|
| ChatGPT Chat | Conversational AI | Questions, teaching, planning, quick research, direct connected actions | Persistent coding daemon | Answer, verified action result, or artifact |
| ChatGPT Work | End-to-end work agent | Research, finished documents, spreadsheets, slides, connected workflows | Proof of uninterrupted background work | Finished artifact plus activity/evidence |
| Codex | Repository and operations agent | Codebase audits, implementation, tests, PRs, verified operations | Generic brainstorming default | Diff, tests, commit/PR, deployment evidence |
| Claude | Long-context reasoning and writing | Documents, source synthesis, rigorous analysis, strategy | Proof of external system changes without tools | Source-grounded artifact |
| Claude Code | Repository agent | Local code analysis, edits, tests, CLI work | Unrestricted shell agent | Commands, diff, tests, commit |
| Cursor | AI code editor | Interactive repository work, targeted edits, debugging | New-project generator for an existing repo | Reviewed diff and passing checks |
| Manus | General execution agent | Browser tasks, research, files, websites, slides, persistent cloud workflows | Automatic production readiness | Artifacts plus verified external state |
| Perplexity | Cited research engine | Fast current-source discovery | Final execution agent | Cited research brief |
| NotebookLM | Source-grounded study tool | Understanding a bounded document set, audio overviews, study guides | Current web research without verified sources | Source-linked notebook output |
| Gemini | Google-connected AI | Google ecosystem, multimodal analysis, large-context work | Automatic action without permission | Verified file or account result |

## 6. ChatGPT Chat

Use when interaction improves the result.

Best for:

- explanations;
- decisions;
- short research;
- reviewing screenshots;
- drafting;
- Gmail, Calendar, Contacts, and other connected actions;
- reminders and scheduled tasks;
- multimodal questions.

Operating steps:

1. Name the project and outcome.
2. Attach or connect the governing source.
3. State whether the request is explore, decide, execute, troubleshoot, or teach.
4. Ask for the exact artifact or action.
5. Require evidence-only status.
6. Save standing decisions to the canonical source.

Success looks like: the answer is grounded, the action is tool-confirmed, or the actual artifact is available.

## 7. ChatGPT Work

Use for a larger deliverable that benefits from staged execution.

Best for:

- research reports;
- document sets;
- spreadsheets;
- presentations;
- sites and dashboards;
- connected multi-app workflows;
- scheduled work products.

Prompt structure:

- Goal
- Sources
- Date range
- Constraints
- Deliverable
- Required sections
- Actions allowed
- Approval gates
- Done when
- Evidence and QC

Do not use vague prompts such as “work on this for three hours.” Define outputs and checkpoints. A scheduled Work task should report actual completed artifacts, not imply continuous effort.

## 8. Codex

Use when the source of truth is a repository or when durable, testable execution is needed.

Required handoff:

- exact repository URL;
- branch policy;
- source documents;
- current status;
- constraints;
- protected behavior;
- complete checklist;
- validation commands;
- deployment boundary;
- definition of done;
- reporting format.

Success looks like: verified files, tests, commit/PR, and live verification when authorized.

## 9. Claude

Use for:

- large document collections;
- contracts or policies;
- sophisticated writing;
- structured strategy;
- source-grounded comparisons;
- explanation of complex topics.

Provide the full source set and require a coverage matrix for canonical documents. Use Projects for sustained work. Use artifacts for finished documents, not as a substitute for version control.

## 10. Claude Code

Use for local repository work where terminal access and iterative discussion are valuable.

Before starting:

1. Open the correct repository directory.
2. Read `CLAUDE.md` and project rules.
3. Check Git status.
4. Choose permission mode.
5. Define commands allowed without repeated approval.
6. Run targeted checks.
7. Review the diff.
8. Commit through the approved workflow.

Avoid dangerous permission bypass on untrusted or production work.

## 11. Cursor

Use when Bwa wants interactive code work inside an editor.

Best setup:

- User Rules for cross-project personal preferences.
- `AGENTS.md` for readable global repository instructions.
- `.cursor/rules/*.mdc` for focused scoped rules.
- MCP only for trusted integrations.
- Git branch for each logical task.

During guided use, give one or two clicks or commands at a time and state what the screen should show.

## 12. Manus

Choose:

- Chat mode for discussion and quick research.
- Agent mode for complex execution.
- Temporary sandbox for bounded outputs.
- Cloud Computer for persistent hosted processes.
- My Computer for authorized local file and command access.
- Browser takeover for authentication, sensitive approval, or manual rescue.

Success requires a saved artifact or verified external result. A temporary link is not a permanent deployment.

## 13. GitHub

Category: source control and collaboration.

Use for:

- canonical code and Markdown;
- version history;
- branches;
- pull requests;
- issues;
- CI evidence;
- releases.

Workflow:

1. Confirm repository.
2. Fetch.
3. Confirm branch.
4. Review changes.
5. Commit logical outcome.
6. Push.
7. Open PR when needed.
8. Verify CI.
9. Merge only with authority.
10. Pull the merged state to local systems.

GitHub is the source of truth for LifeOS. Obsidian is the working interface.

## 14. GitHub Desktop

Use for visual Git operations.

Guided workflow:

1. Check **Current repository**.
2. Check **Current branch**.
3. Click **Fetch origin**.
4. If shown, click **Pull origin**.
5. Review changed files.
6. Enter a result-based summary.
7. Click **Commit**.
8. Click **Push origin**.
9. Verify the commit online.

Do not commit `.obsidian` workspace state, secrets, caches, exports, or unrelated files.

## 15. Obsidian LifeOS

Use as Bwa's main personal operating interface.

Canonical folder:

`Documents/ALT-LABEL-System-2/LifeOS-Enterprise`

Use for:

- capture;
- projects;
- areas;
- goals;
- resources;
- people;
- reviews;
- journals;
- SOPs;
- AI workforce records.

Avoid duplicate vaults. When GitHub has new files, pull in GitHub Desktop and reload Obsidian. If Obsidian and GitHub disagree, inspect the canonical repository file.

## 16. Vercel

Category: managed web deployment.

Use for:

- previews;
- production deployment;
- domains;
- environment variables;
- logs;
- web analytics.

Separate repository, Vercel project, preview URL, production URL, and custom domain.

Success:

- build passed;
- correct commit deployed;
- environment variables present;
- public URL checked;
- critical flows work;
- no relevant console or runtime errors.

Do not redeploy blindly when the live site must be preserved; use preview and rollback.

## 17. Replit

Use for browser-based coding, prototypes, and hosted apps.

Before editing, confirm the existing Repl. Preserve secrets and deployment settings. Separate workspace preview from deployed URL. Export or connect Git for durable ownership.

## 18. Figma and Figma Make

Use Figma for editable interface design and prototypes. Use Figma Make for generated interactive concepts and front-end exploration.

Verify:

- correct file;
- approved frame;
- components;
- design tokens;
- responsive behavior;
- accessibility;
- export or handoff.

A prototype is not production code.

## 19. Adobe Illustrator, Photoshop, Express, and Canva

### Illustrator

Use for vector logos, packaging, print dielines, and production artwork.

Proof includes correct dimensions, bleed, safe area, color mode, linked assets, fonts, barcode/QR size, preflight, and required export.

### Photoshop

Use for photo editing, compositing, retouching, and raster production. Preserve crop-only or no-retouch instructions exactly.

### Adobe Express and Canva

Use for fast marketing layouts, flyers, social formats, and templates. Verify aspect ratio, editable source, spelling, brand, print settings, and export.

A generated preview is not a manufacturing file.

## 20. Shopify

Use for commerce storefronts, themes, products, customer experience, and integrations.

Before any action, confirm:

- exact store;
- live and unpublished themes;
- inventory mode;
- publication state;
- payment restrictions;
- shipping and compliance;
- client instruction.

Use development or unpublished themes for changes. Never enable sales, checkout, payment, shipping, or publication without authorization. Run theme checks and storefront tests.

## 21. GoHighLevel / internal CRM platform

Use internally for CRM, pipelines, workflows, calendars, forms, messaging, automation, and SaaS delivery. Keep external client language focused on outcomes rather than the underlying platform when that is the approved brand strategy.

Verify exact agency and sub-account before changes. Separate draft workflow, published workflow, test lead, live automation, and verified result. Protect A2P, email, billing, domain, and client communication settings.

## 22. Gmail

Use precise search operators and labels. Read threads before replying. Draft when review is needed. Send only when explicitly requested. Archive retains mail; delete moves it to Trash.

For financial tracking, separate bills due, overdue, paid, recurring expenses, and confirmed income. Do not treat transfers as income without evidence.

## 23. Google Calendar and Contacts

Calendar:

- search before creating;
- verify timezone;
- avoid duplicate events;
- read recurring events before modifying;
- confirm attendee and reminder details.

Contacts:

- search names and email addresses;
- do not invent addresses;
- use the exact contact record.

## 24. Google Drive, Docs, Sheets, and Slides

Use Drive as a collaboration source when the canonical file lives there. Determine whether the file is authoritative or a copy. Preserve versions and sharing permissions. For Sheets, maintain formulas, data types, and validation. For Slides, maintain layouts and source assets.

Do not invent a downloadable local file until an actual export exists.

## 25. Slack

Use for team communication, channel research, threads, and operational alerts.

- search the correct workspace;
- read the full thread;
- draft before posting when review matters;
- post only when authorized;
- keep clients and internal channels separate;
- use links to the actual message or artifact.

## 26. n8n, Make, Zapier, and Activepieces

Category: workflow automation.

Every workflow needs:

- trigger;
- source;
- transformation;
- action;
- approval gate;
- error path;
- retry rule;
- duplicate prevention;
- logging;
- ownership;
- test data;
- success check;
- disable/rollback procedure.

Use n8n or Activepieces when ownership and flexibility justify setup. Use Zapier or Make when speed and supported connectors outweigh cost. Do not automate uncertain AI output directly into high-impact actions.

## 27. Open-source local agents

Before deploying:

- define task and threat model;
- isolate environment;
- review repository and dependencies;
- use least privilege;
- store secrets securely;
- add logs and budgets;
- test on non-production data;
- define update, backup, shutdown, and recovery.

A free license does not mean free operation.

## 28. Research tools

### Perplexity

Use for quick source-backed current research. Verify important claims in original sources.

### NotebookLM

Use for learning from a controlled source set. Good for summaries, study guides, questions, and audio overviews. It does not replace current web verification.

### Search engines and official documentation

Use when current facts, software behavior, laws, prices, or specifications matter. Prefer primary sources.

## 29. Handoff standard

Every tool-to-tool handoff must include:

- project;
- current objective;
- authoritative source;
- work already completed;
- exact files or links;
- constraints;
- decisions;
- remaining checklist;
- approval boundary;
- definition of done;
- validation;
- evidence format.

Do not paste an enormous conversation when a verified checkpoint can transfer the state more accurately.

## 30. Tool audit standard

A complete tool audit must evaluate:

- access;
- readability;
- write capability;
- account and plan;
- costs and billing;
- credits;
- devices;
- region;
- permissions;
- real outputs;
- failures;
- integrations;
- automations;
- privacy;
- governance;
- overlap;
- success measures;
- cost per usable finished result.

Create an access matrix before claiming an audit is complete.

## 31. Document maintenance across tools

When a tool creates or changes a governing standard:

1. locate the canonical document;
2. inventory authoritative and supplemental sources;
3. build requirement disposition;
4. merge duplicates without dropping intent;
5. resolve conflicts;
6. produce a complete replacement;
7. update version and date;
8. preserve history;
9. run independent quality control;
10. update the changelog;
11. save to GitHub/Obsidian;
12. verify the file and provide evidence.

Do not leave a standing rule only in chat, an agent memory, a draft artifact, or an uncommitted local file.

## 32. Failure recovery across tools

When a tool, connector, agent, command, workflow, or handoff fails:

1. Name the exact failed action and the evidence.
2. Stop repeating the same step without a changed hypothesis.
3. Reconfirm the project, target account, environment, source, and permission boundary.
4. Preserve the last valid artifact, branch, record, or checkpoint.
5. Check whether the failure is tool-specific or whether the underlying goal is blocked.
6. Try a safe alternative path when one exists.
7. Correct the actual artifact or system state rather than only explaining the correction.
8. Rerun the relevant validation.
9. Record OBSERVED, INFERENCE, UNKNOWN, and any remaining blocker.
10. Run independent quality control before reporting resolution.

A new tool is not automatically the correct recovery path. First inspect configuration, permissions, plan limits, environment, and existing alternatives.

## 33. Stop-doing rules

Stop:

- buying overlapping tools without a defined gap;
- treating plans as completed work;
- moving to a new project before the current priority is finished;
- using the same tool for every phase;
- repeating failed instructions;
- creating duplicate repositories, vaults, or canonical documents;
- letting agents publish, send, deploy, or purchase without authorization;
- measuring success by messages, prompts, or activity instead of usable outcomes.

## 34. Quality-control checklist

Before completing a tool workflow:

- correct project and account;
- correct environment;
- source verified;
- permissions appropriate;
- output exists;
- action result verified;
- cost known;
- data protected;
- no duplicate system created;
- artifact saved to source of truth;
- user-facing instructions are exact;
- remaining work stated.

## 35. Activation statement

**Use the simplest reliable tool chain. Keep the source of truth clear. Match the environment to the workload. Preserve permissions. Verify the finished result.**
