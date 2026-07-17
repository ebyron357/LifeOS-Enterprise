---
type: resource
status: approved
source: LifeOS requirements
author: LifeOS
topic: Codex engineering package
created: 2026-07-16
updated: 2026-07-16
review_date: 2026-07-23
tags:
  - resource
  - codex
  - engineering-package
  - ai-consulting
  - portfolio
  - case-study
---

# Codex Package — AI Portfolio Showcase System

## Feature ID

`LIFEOS-PORTFOLIO-002`

## Objective

Implement a complete evidence-based AI consulting portfolio management and showcase system inside the **existing Obsidian LifeOS vault**, while preparing a separate specification for a future public portfolio website.

## Critical Context

LifeOS is the private source of truth. The public portfolio is a controlled publishing surface.

Do not:

- scaffold a web application inside the LifeOS repository;
- expose private notes, secrets, client data, credentials, or internal URLs;
- present demonstrations or internal ventures as paid client results;
- invent results, metrics, permissions, testimonials, or project status;
- duplicate the portfolio proof register defined by `LIFEOS-CAREER-001`;
- create a new note type when `resource` is sufficient;
- change unrelated vault files;
- select a public-site framework before inspecting the actual target repository.

## Existing Inputs

- `10 Projects/Build AI Consultant Portfolio.md`
- `20 Areas/AI Consulting Career.md`
- `40 Resources/AI Consulting/AI Portfolio Showcase Plan.md`
- `40 Resources/AI Consulting/AI Consultant Certification Tracker.md`
- `40 Resources/AI Consulting/Codex Package - AI Consultant Career Module.md`
- `architecture/METADATA_SCHEMA.md`
- `00 Home/Personal Dashboard.md`
- `scripts/audit-vault.ps1`

## Required Implementation — LifeOS Vault

### 1. Create the AI Portfolio Case Study Template

Create:

`99 Templates/AI Portfolio Case Study.md`

Use `type: resource` and `topic: ai-portfolio-case-study`.

Required frontmatter:

```yaml
---
type: resource
status: draft
source:
author: Bwa
topic: ai-portfolio-case-study
project:
area: "[[20 Areas/AI Consulting Career]]"
context_type:
ownership_status:
permission_status:
privacy_status:
case_study_status: candidate
publish_status: private
primary_capability:
secondary_capabilities:
credential_relationship:
evidence_status: Unverified
evidence_location:
result_metric:
result_value:
result_unit:
public_url:
github_url:
demo_url:
video_url:
substack_url:
linkedin_url:
portfolio_score: 0
next_action:
created:
updated:
review_date:
tags:
  - resource
  - ai-consulting
  - portfolio
  - case-study
---
```

Required body sections:

1. Executive Summary
2. Context and Disclosure
3. Business Problem
4. Baseline and Measurement Method
5. Constraints and Risks
6. Before Workflow
7. Solution Architecture
8. Models, Platforms, Tools, APIs, MCP Servers, and Connectors
9. Human Approval, Permissions, Retry, and Fallback
10. Implementation
11. Testing and Evaluation
12. Verified Results
13. Evidence Register
14. What Did Not Work
15. Limitations
16. Next Improvement
17. Public Asset Checklist
18. Repurposing Checklist
19. Call to Action
20. Review and Approval

### 2. Extend the Metadata Contract

Update:

`architecture/METADATA_SCHEMA.md`

Under Resource, add a subsection titled `AI Portfolio Case Study Extension`.

Document these controlled values:

#### `context_type`

- personal
- internal-venture
- client-approved
- nonprofit
- research
- demonstration
- open-source

#### `ownership_status`

- owned
- shared
- client-owned
- open-source
- unknown

#### `permission_status`

- approved
- pending
- not-required
- denied
- unknown

#### `privacy_status`

- public-safe
- sanitized
- confidential
- restricted
- review-required

#### `case_study_status`

- candidate
- selected
- gathering-evidence
- drafting
- review
- ready-to-publish
- published
- paused
- rejected
- archived

#### `publish_status`

- private
- internal-review
- approved
- scheduled
- published
- update-required
- retired

Add validation rules:

- no case study may be `ready-to-publish` or `published` when evidence status is Unverified;
- no client-owned record may be published without `permission_status: approved`;
- no confidential or restricted record may be published;
- every selected case study must have a next action and review date;
- every published case study must have at least one canonical public URL;
- result claims require an evidence location and measurement method.

### 3. Seed Candidate Case Study Records

Create records under:

`40 Resources/AI Consulting/Portfolio/Case Studies/`

Create:

1. `LifeOS Enterprise Case Study.md`
2. `ClientVerse AI Operations Case Study.md`
3. `TradeIQ AI Product Architecture Case Study.md`
4. `Shopify AI Systems Case Study.md`
5. `Charlotte Real Estate AI Platform Case Study.md`
6. `AI Education Initiative Case Study.md`
7. `AI Agent Demonstration Case Study.md`
8. `AI Readiness and Adoption Toolkit Case Study.md`

Rules:

- initialize all records as `candidate` and `private`;
- populate only facts already supported by repository evidence or approved source documentation;
- leave unknown metrics and permissions blank;
- use the context labels from the showcase plan;
- add explicit warnings to records requiring client permission;
- do not claim production status without live verification;
- do not claim paid-client outcomes unless evidence explicitly supports that claim.

### 4. Create the Portfolio Proof Base

Create:

`00 Home/Bases/AI Portfolio Showcase.base`

Filter to Markdown resources where:

- `type == "resource"`;
- `topic == "ai-portfolio-case-study"`.

Display:

- file name;
- context type;
- primary capability;
- case-study status;
- permission status;
- privacy status;
- evidence status;
- result metric;
- portfolio score;
- publish status;
- public URL;
- next action;
- review date.

Required views:

1. Flagship Candidates
2. Selected Flagships
3. Missing Evidence
4. Permission or Privacy Blocked
5. Drafting and Review
6. Ready to Publish
7. Published Proof
8. Needs Update

Use valid Obsidian Bases syntax already present in the repository.

### 5. Create the Portfolio Proof Register or Extend the Existing One

The prior package requires:

`40 Resources/AI Consulting/AI Consultant Portfolio Proof Register.md`

If it exists, extend it. Do not create a duplicate.

Add fields and sections for:

- canonical evidence record;
- project context;
- ownership;
- permission;
- privacy;
- capability demonstrated;
- credential relationship;
- public channels;
- current public URL;
- repurposing status;
- last verified date;
- next refresh date;
- lead or conversation attribution where known.

### 6. Create a Portfolio Command Index

Create:

`40 Resources/AI Consulting/AI Consultant Portfolio Index.md`

It must provide:

- positioning statement;
- link to the active portfolio project;
- link to the showcase plan;
- embedded AI Portfolio Showcase Base;
- links to certification tracker and proof register;
- current three flagship selections;
- current blocked evidence;
- publishing queue;
- next public asset;
- weekly portfolio scorecard;
- monthly review checklist.

### 7. Update the Personal Dashboard

Update:

`00 Home/Personal Dashboard.md`

Under `AI Consultant Career`, add:

```markdown
- [[40 Resources/AI Consulting/AI Consultant Portfolio Index|AI Portfolio Command Index]]
- [[40 Resources/AI Consulting/AI Portfolio Showcase Plan|Portfolio Showcase Plan]]
- [[40 Resources/AI Consulting/Codex Package - AI Portfolio Showcase System|Codex Portfolio Engineering Package]]

![[00 Home/Bases/AI Portfolio Showcase.base]]
```

Do not remove existing dashboard content.

### 8. Update the Active Portfolio Project

Update:

`10 Projects/Build AI Consultant Portfolio.md`

Add success criteria:

- three flagship projects selected through the portfolio score;
- three complete case studies at or above the publish threshold;
- two working demo videos;
- one portfolio command index;
- one capability statement;
- one canonical public portfolio destination;
- each flagship repurposed across LinkedIn, Substack, GitHub, and video;
- zero unverified public claims;
- permission and privacy status visible for every candidate.

Set the immediate next action to candidate classification and evidence inventory unless a more current verified next action exists.

### 9. Create the Public Portfolio Site Specification

Create:

`docs/AI_PORTFOLIO_PUBLIC_SITE_SPEC.md`

This file is a product and engineering specification only. Do not build the site in this vault.

Required pages:

- Home
- Case Studies
- Individual Case Study
- Demonstrations
- Services
- Credentials
- Insights
- About
- Contact
- Privacy

Required capabilities:

- case studies driven by structured content;
- context and evidence-status disclosures;
- responsive Apple-quality presentation without decorative clutter;
- accessible keyboard and screen-reader behavior;
- metadata, sitemap, robots, canonical URLs, Open Graph, and structured data;
- fast performance and optimized media;
- contact conversion tracking;
- safe analytics with documented consent requirements;
- no direct connection to the private LifeOS vault;
- publish only explicitly approved export content.

### 10. Define the Safe Export Contract

In `docs/AI_PORTFOLIO_PUBLIC_SITE_SPEC.md`, define a publishable case-study data contract.

Required fields:

```text
slug
title
summary
contextLabel
capabilities
problem
constraints
solution
architectureSummary
humanApproval
results
evidenceStatus
limitations
coverImage
screenshots
videoUrl
githubUrl
credentialLinks
publishedAt
updatedAt
callToAction
```

Prohibited export fields:

- private note paths;
- secrets;
- internal tokens;
- private repository URLs;
- client personal information;
- unapproved business data;
- raw internal prompts;
- confidential architecture details;
- private health, financial, relationship, or journal information.

### 11. Add Content Repurposing Tracking

Create:

`99 Templates/Portfolio Content Repurposing.md`

Track one case study across:

- portfolio page;
- GitHub README;
- LinkedIn launch post;
- LinkedIn lesson post;
- LinkedIn visual brief;
- Substack article;
- 60–90 second video;
- 3–7 minute demo;
- one-page capability excerpt;
- Skool or community lesson;
- outreach proof block;
- proposal proof block.

Use the existing resource type.

## Future Public-Site Codex Package

Do not execute this phase until the target public repository is identified and the user authorizes implementation.

### Repository Inspection First

Codex must:

1. identify whether a personal portfolio or professional website repository already exists;
2. inspect its framework, package manager, design system, deployment, content model, analytics, and tests;
3. extend that repository rather than starting over when practical;
4. create a separate repository only after explicit approval if no suitable target exists.

### Routes

Target route architecture:

```text
/
/case-studies
/case-studies/[slug]
/demos
/services
/credentials
/insights
/about
/contact
/privacy
```

### Suggested Component Boundaries

Adapt names to the target framework:

```text
PortfolioShell
ExecutiveHero
CapabilityGrid
FeaturedCaseStudies
CaseStudyCard
CaseStudyDisclosure
EvidenceBadge
ArchitectureSummary
ResultsPanel
LimitationsPanel
CredentialGrid
DemoGallery
ServiceOfferCard
InsightFeed
ContactCTA
```

### Data and Content

- Prefer local structured content such as MDX, Markdown with validated frontmatter, or typed JSON.
- Validate exported content against a schema.
- Do not connect the public site directly to the private vault.
- Provide a documented manual export workflow before adding automation.
- Automate only after the export process is stable and repeatedly tested.

### Public-Site Tests

- unit tests for content validation;
- route rendering tests;
- broken-link check;
- accessibility check;
- mobile, tablet, and desktop visual verification;
- metadata and structured-data verification;
- Lighthouse performance, accessibility, SEO, and best-practices review;
- no secrets or private file paths in production artifacts;
- all CTA forms tested end to end;
- 404 and error handling verified.

## Validation — LifeOS Phase

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-vault.ps1
```

Then verify in Obsidian:

1. AI Portfolio Showcase Base renders.
2. All seeded case studies appear.
3. Candidate records are private and not falsely marked approved.
4. Personal Dashboard embeds render without broken links.
5. Portfolio Index answers the key decision questions within one minute.
6. No duplicate proof register was created.
7. Existing dashboards remain functional.
8. Mobile Obsidian view remains usable.

## Acceptance Criteria

The feature is complete when Bwa can open LifeOS and answer in under one minute:

- What are the top three flagship case-study candidates?
- Which capability does each prove?
- Which evidence is missing?
- Which projects require permission?
- Which assets are safe to publish?
- What is the next portfolio action?
- Which public channel should receive the next asset?
- Which case study is producing professional conversations or leads?
- Which claims require refresh or correction?

## Commit Strategy

Use logical commits:

1. `add AI portfolio case study template and schema`
2. `add candidate case studies and showcase Base`
3. `add portfolio index and dashboard integration`
4. `add portfolio site and export specifications`
5. `add content repurposing workflow`

Keep the pull request draft until the structural audit and Obsidian rendering checks pass.