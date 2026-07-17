---
type: resource
status: approved
source: LifeOS requirements
author: LifeOS
topic: Codex engineering package
created: 2026-07-16
review_date: 2026-07-23
tags:
  - resource
  - codex
  - engineering-package
  - ai-consulting
  - certification
---

# Codex Package — AI Consultant Career Module

## Feature ID

`LIFEOS-CAREER-001`

## Objective

Integrate a market-aligned AI consulting career, certification, portfolio, and professional-proof tracking system into the **existing Obsidian LifeOS repository**.

## Critical Context

This repository is currently an Obsidian vault, not a Next.js application. Preserve the canonical numbered vault structure, existing note types, native Bases approach, and non-destructive migration policy.

Do **not**:

- scaffold a new web application inside this vault;
- replace the existing LifeOS architecture;
- create a second source of truth;
- add a large plugin dependency;
- invent a new note type when `resource`, `project`, `area`, or `goal` fits;
- alter unrelated files;
- claim employer demand without evidence.

## Existing Inputs

- `20 Areas/AI Consulting Career.md`
- `10 Projects/Build AI Consultant Portfolio.md`
- `40 Resources/AI Consulting/AI Consultant Certification Tracker.md`
- `40 Resources/AI Consulting/AI Portfolio Showcase Plan.md`
- `40 Resources/AI Consulting/Codex Package - AI Portfolio Showcase System.md`
- `architecture/METADATA_SCHEMA.md`
- `00 Home/Personal Dashboard.md`
- `00 Home/Life OS.md`
- `scripts/audit-vault.ps1`

## Required Implementation

### 1. Add a Certification Resource Template

Create:

`99 Templates/Certification.md`

Use `type: resource` and the existing global property rules. Include these reporting properties:

```yaml
---
type: resource
status: planned
source:
author:
topic: certification
provider:
credential:
track:
priority: P1
start_date:
target_exam_date:
actual_exam_date:
exam_cost:
training_cost:
renewal_date:
study_hours_planned:
study_hours_completed: 0
progress: 0
practice_score:
credential_url:
verification_url:
portfolio_artifact:
market_signal:
evidence_source:
evidence_status: Unverified
next_action:
created:
review_date:
tags:
  - resource
  - certification
---
```

The body must contain:

- Purpose
- Why this credential matters
- Skills measured
- Market evidence
- Study plan
- Portfolio artifact
- Exam readiness checklist
- Pass/fail result
- Credential verification
- Renewal plan
- Lessons learned
- Decision: continue, replace, defer, or reject

### 2. Extend the Metadata Contract Without Creating a New Type

Update:

`architecture/METADATA_SCHEMA.md`

Add a subsection titled `Certification Resource Extension` under Resource. Document the approved properties listed above.

Add controlled values:

- certification status: `researching`, `planned`, `studying`, `scheduled`, `passed`, `expired`, `deferred`, `rejected`;
- evidence status: `Verified`, `Partially Verified`, `Unverified`, `Blocked by Missing Access`, `Requires Account Inspection`, `Requires Live Testing`.

Keep global `status` compatible with the existing schema. Use a separate property such as `credential_status` if necessary to avoid conflicting with global status values.

### 3. Create Individual Credential Records

Create these files under `40 Resources/AI Consulting/Certifications/`:

1. `Microsoft AI Transformation Leader AB-731.md`
2. `Google Cloud Generative AI Leader.md`
3. `AWS Certified AI Practitioner AIF-C01.md`
4. `Microsoft AI Agent Builder Associate AB-620.md`
5. `IAPP Artificial Intelligence Governance Professional.md`

Populate only verified public facts from official provider sources. Mark unknown personal fields blank. Do not mark enrollment, exam dates, study progress, or passed status without evidence.

Required initial decisions:

- AB-731: primary, planned, P0.
- Google Generative AI Leader: planned, P1.
- AWS AI Practitioner: planned, P1.
- AB-620: conditional, P2, requires two working agent builds.
- IAPP AIGP: conditional, P2, requires a documented ROI or target opportunity.

### 4. Create a Native Obsidian Base

Create:

`00 Home/Bases/AI Consultant Certifications.base`

Filter to Markdown resources where:

- `type == "resource"`;
- `topic == "certification"`;
- certification tag or AI-consulting relationship is present.

Display columns:

- file name;
- provider;
- credential track;
- credential status;
- priority;
- target exam date;
- progress;
- practice score;
- exam cost;
- portfolio artifact;
- evidence status;
- next action;
- review date.

Provide at least these views:

1. Active Certification Plan
2. Credentials Needing Review
3. Passed Credentials
4. Deferred or Rejected Credentials

Use valid Obsidian Bases syntax already used by this repository. Validate the file renders in Obsidian.

### 5. Add the Career Command Section to the Personal Dashboard

Update:

`00 Home/Personal Dashboard.md`

Add a section after `Current Focus`:

```markdown
## AI Consultant Career

- [[20 Areas/AI Consulting Career|AI Consulting Career Area]]
- [[10 Projects/Build AI Consultant Portfolio|Build AI Consultant Portfolio]]
- [[40 Resources/AI Consulting/AI Consultant Certification Tracker|Certification Strategy and Scorecard]]
- [[40 Resources/AI Consulting/AI Portfolio Showcase Plan|AI Portfolio Showcase Plan]]
- [[40 Resources/AI Consulting/Codex Package - AI Consultant Career Module|Codex Career Engineering Package]]
- [[40 Resources/AI Consulting/Codex Package - AI Portfolio Showcase System|Codex Portfolio Engineering Package]]

![[00 Home/Bases/AI Consultant Certifications.base]]
![[00 Home/Bases/AI Portfolio Showcase.base]]
```

Do not remove existing dashboard content.

### 6. Add Monthly Market-Demand Review Support

Create:

`99 Templates/AI Certification Market Review.md`

Use `type: resource` and include:

- search date;
- roles reviewed;
- organizations reviewed;
- recurring skills;
- recurring platform requirements;
- certifications mentioned;
- governance frameworks mentioned;
- frequency counts;
- evidence URLs;
- confidence;
- recommended roadmap change;
- approval decision;
- next review date.

Do not automate web scraping in Sprint 1. The workflow must first be tested manually and documented. This follows the repository rule: do not automate an unstable workflow.

### 7. Add Portfolio Proof Tracking

Create:

`40 Resources/AI Consulting/AI Consultant Portfolio Proof Register.md`

Track:

- artifact;
- context label;
- business problem;
- skill demonstrated;
- credential relationship;
- evidence location;
- privacy or permission status;
- publish status;
- result metric;
- evidence status;
- review date.

Seed it with:

- AI Readiness Assessment;
- AI Opportunity Scoring Matrix;
- Executive AI Adoption Roadmap;
- Workflow Transformation Case Study;
- Working AI Agent Demonstration;
- Responsible AI Starter Policy;
- AI Inventory and Risk Register;
- Consultant Capability Statement.

Extend this proof register using the requirements in `Codex Package - AI Portfolio Showcase System.md`. Do not create a duplicate register.

### 8. Implement the Portfolio Showcase System

Execute the LifeOS-vault phase of:

`40 Resources/AI Consulting/Codex Package - AI Portfolio Showcase System.md`

This includes:

- AI Portfolio Case Study template;
- metadata extensions;
- eight candidate case-study records;
- AI Portfolio Showcase Base;
- Portfolio Command Index;
- Personal Dashboard integration;
- safe public-export specification;
- content-repurposing template.

Do not execute the future public-site phase until the target repository is identified and implementation is authorized.

## Validation

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-vault.ps1
```

Then manually verify in Obsidian:

1. `00 Home/Personal Dashboard.md` opens without broken embeds.
2. The certification Base renders.
3. The portfolio showcase Base renders.
4. Each credential appears in the appropriate view.
5. Each seeded portfolio candidate appears and remains private until approved.
6. Existing dashboards and links remain functional.
7. No duplicate template folder or duplicate note type was introduced.
8. Every active record has a next action and review date where required.

## Tests and Checks

- Structural audit passes.
- Markdown frontmatter is valid YAML.
- All internal links resolve.
- Base filters return the expected five credential records.
- Portfolio Base returns the expected eight candidate records.
- No unrelated files changed.
- No secrets or private credentials committed.
- Mobile Obsidian view remains usable.

## Documentation Updates

Update:

- `docs/LifeOS_Specification_v1.md` — add AI Consultant Career under Personal/Executive Growth capabilities.
- `README.md` — add the career tracker to Key Files only if it becomes a primary navigation asset.
- Add a short change note under the repository's existing release-note mechanism; if none exists, create `docs/CHANGELOG.md` without inventing release claims.

## Acceptance Criteria

The feature is complete when Bwa can open the Personal Dashboard and answer in under one minute:

- Which AI credential should be worked on now?
- What is the next study action?
- What does the credential cost?
- What portfolio artifact must be built with it?
- Which credentials are planned, studying, passed, deferred, or rejected?
- Which market evidence supports the roadmap?
- Which three portfolio candidates are strongest?
- Which proof is missing or blocked by permission?
- Which proof is ready to publish?
- What public asset should be produced next?

## Commit Strategy

Use logical commits:

1. `add AI consultant career templates and schema`
2. `add certification records and Bases tracker`
3. `add portfolio case study system and candidate records`
4. `integrate AI career and portfolio trackers into dashboard`
5. `add market review, public export, and portfolio proof documentation`

Open a draft pull request. Do not merge until the structural audit and Obsidian rendering checks pass.