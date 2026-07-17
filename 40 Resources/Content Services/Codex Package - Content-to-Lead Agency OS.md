---
type: resource
status: approved
source: LifeOS requirements
author: LifeOS
topic: codex-engineering-package
created: 2026-07-16
updated: 2026-07-16
review_date: 2026-07-23
tags:
  - resource
  - codex
  - engineering-package
  - content-services
  - lead-generation
---

# Codex Package — Content-to-Lead Agency OS

## Feature ID

`LIFEOS-CONTENT-LEAD-003`

## Objective

Implement the Content-to-Lead Services operating system inside the existing Obsidian LifeOS vault and create safe, optional automation scaffolding for content records, lead records, Google Places account discovery, Apollo enrichment, Clay handoff, and CRM sync.

## Critical Context

LifeOS is the governance and knowledge source of truth. A CRM remains the operational source of truth for high-volume leads and outreach.

Do not:

- scaffold a web app inside the vault;
- rebuild LifeOS;
- create duplicate note types when `content`, `resource`, `project`, `area`, `person`, or `automation` fits;
- scrape Google Maps or LinkedIn;
- bypass access controls;
- send email, LinkedIn messages, SMS, or calls automatically in this phase;
- invent emails, people, roles, website gaps, search metrics, customer results, or consent;
- commit API keys, private lists, client data, or raw exports;
- treat enriched data as consent;
- make Clay, Apollo, or a sequencer the only system of record;
- automate final qualification, sensitive claims, compliance decisions, or public release.

## Existing Inputs

- `20 Areas/Content-to-Lead Services.md`
- `10 Projects/Operationalize Content-to-Lead Service.md`
- `40 Resources/Content Services/Content-to-Lead Agency Operating System.md`
- `40 Resources/Content Services/Lead Acquisition and Enrichment Playbook.md`
- `40 Resources/Content Services/Content Services Tool Stack.md`
- `99 Templates/Content Campaign.md`
- `99 Templates/Lead Prospect.md`
- `00 Home/Bases/Content Production Pipeline.base`
- `00 Home/Bases/Lead Prospecting Pipeline.base`
- `00 Home/Content Services Dashboard.md`
- `00 Home/Business Dashboard.md`
- `architecture/METADATA_SCHEMA.md`
- `scripts/audit-vault.ps1`
- `.github/workflows/vault-health.yml`

## Phase 1 — Vault Integration

### 1. Extend the Metadata Contract

Update `architecture/METADATA_SCHEMA.md`.

#### Content Campaign Extension

Document approved fields:

```text
client
content_type
primary_topic
primary_keyword
search_intent
funnel_stage
content_cluster
writer
reviewer
publication_date
review_deadline
primary_cta
secondary_cta
related_lead_magnet
conversion_goal
cms_url
published_url
analytics_url
search_console_url
revision_count
evidence_status
next_action
```

Controlled content workflow statuses:

```text
ideas
research
brief-review
brief-approved
client-input-required
drafting
internal-qa
client-review
revisions
ready-to-publish
scheduled
published
monitoring
refresh-required
archived
```

Use a dedicated `content_status` property if these conflict with the global status contract.

#### Lead Prospect Resource Extension

For `type: resource` and `topic: lead-prospect`, document:

```text
account_name
website
industry
location
source_platform
source_url
observed_gap
evidence_url
icp_score
qualification_status
contact_name
contact_role
linkedin_url
email
email_verification_status
email_verified_date
phone
suppression_status
consent_or_lawful_basis_note
outreach_angle
campaign
crm_id
reply_status
opportunity_status
owner
priority
next_action
review_date
```

Controlled values:

`qualification_status`:

```text
researching
qualified
review-required
nurture
rejected
contacted
responded
converted
archived
```

`email_verification_status`:

```text
unknown
unverified
valid
risky
invalid
accept-all
not-available
```

`suppression_status`:

```text
clear
opted-out
existing-client
partner
competitor
invalid
restricted
do-not-contact
```

`reply_status`:

```text
not-contacted
sent
positive
referral
timing
information-request
objection
not-relevant
opt-out
invalid-contact
auto-reply
unclear
```

`opportunity_status`:

```text
none
nurture
qualified
meeting
proposal
won
lost
paused
```

### 2. Extend Vault Audit Rules

Update `scripts/audit-vault.ps1`.

Add required files:

- `00 Home/Content Services Dashboard.md`
- `00 Home/Bases/Content Production Pipeline.base`
- `00 Home/Bases/Lead Prospecting Pipeline.base`
- `20 Areas/Content-to-Lead Services.md`
- `10 Projects/Operationalize Content-to-Lead Service.md`
- `40 Resources/Content Services/Content-to-Lead Agency Operating System.md`
- `40 Resources/Content Services/Lead Acquisition and Enrichment Playbook.md`
- `40 Resources/Content Services/Content Services Tool Stack.md`
- `99 Templates/Content Campaign.md`
- `99 Templates/Lead Prospect.md`

Add both Bases to required Base checks.

Add template-field validation:

#### Content Campaign

- `type: content`
- `status:` or `content_status:`
- `owner:`
- `priority:`
- `primary_topic:`
- `search_intent:`
- `funnel_stage:`
- `conversion_goal:`
- `next_action:`
- `review_date:`

#### Lead Prospect

- `type: resource`
- `topic: lead-prospect`
- `account_name:`
- `source_platform:`
- `source_url:`
- `icp_score:`
- `qualification_status:`
- `suppression_status:`
- `owner:`
- `next_action:`
- `review_date:`

Add validation rules:

- published content requires `published_url`, publication date, owner, CTA, conversion goal, and review date;
- a qualified prospect requires account, website or evidence URL, source, observed gap, ICP score, owner, and next action;
- a contacted prospect cannot have suppression status other than `clear`;
- an opt-out or do-not-contact record cannot have an active outreach next action;
- a result or revenue claim requires an evidence source;
- no private API key, password, or token field is permitted.

### 3. Documentation

Update:

- `docs/LifeOS_Specification_v1.md`
- repository changelog mechanism
- `README.md` Key Files only if Content Services Dashboard becomes primary navigation

## Phase 2 — Safe Local Record Creation

Create:

```text
scripts/content-services/New-ContentCampaign.ps1
scripts/content-services/New-LeadProspect.ps1
scripts/content-services/Test-ContentServices.ps1
```

### New-ContentCampaign.ps1

Accept:

- title;
- client or operating context;
- content type;
- primary topic;
- search intent;
- funnel stage;
- conversion goal;
- owner;
- optional related project.

Behavior:

- create a note from the canonical template;
- normalize safe filenames;
- preserve user input;
- fill ISO dates;
- set one next action and review date;
- prevent overwrite by default;
- support `-WhatIf` or dry-run;
- make no network calls.

### New-LeadProspect.ps1

Accept:

- account name;
- website;
- source platform;
- source URL;
- observed gap;
- owner;
- optional campaign and project.

Behavior:

- create a private lead-prospect note;
- set verification fields to unknown or unverified;
- set suppression status to clear only when explicitly supplied and validated;
- never invent contact data;
- prevent overwrite;
- support dry-run;
- make no network calls.

### Tests

Use temporary directories and synthetic data.

Test:

- valid record creation;
- invalid/missing required fields;
- filename sanitization;
- overwrite prevention;
- dry-run;
- ISO dates;
- no secret leakage;
- no network dependency.

## Phase 3 — Optional Lead Intelligence Integration

Create a separate integration package:

```text
integrations/lead-intelligence/
  package.json
  README.md
  .env.example
  src/
  tests/
```

Use Node.js and TypeScript only if consistent with repository policy; otherwise use plain ESM JavaScript with runtime schema validation.

### Operating Modes

- `import` — ingest approved CSV/JSON exports from Clay, Apollo, CRM, or spreadsheets;
- `google-places` — official Google Places API only;
- `apollo` — official Apollo API only when credentials and plan permit;
- `clay-webhook` — receive or validate approved Clay webhook/export payloads;
- `crm-export` — generate a reviewed handoff file or call an approved CRM webhook;
- `dry-run` — default for all network-capable operations.

### Google Places Connector

Use current official Places API (New).

Requirements:

- API key from environment variable;
- Text Search and/or Nearby Search;
- Place Details only when needed;
- explicit field masks;
- location/category inputs;
- pagination and quota controls;
- request logging without secrets;
- cost estimate or request count log;
- no HTML scraping;
- preserve Place ID and source query;
- output only approved business fields;
- deduplicate by Place ID and normalized domain;
- no outreach.

### Apollo Connector

Requirements:

- official API only;
- API key from environment;
- narrow query filters;
- account search before people search where possible;
- configurable role and seniority criteria;
- raw provider response kept outside the public vault or sanitized;
- record source and date;
- never mark email valid without provider evidence;
- never mark consent;
- no sequence activation by default;
- no outreach.

### Clay Handoff

Support safe import or webhook validation rather than automating the Clay UI.

Required fields:

- source row ID;
- provider/source;
- enrichment date;
- raw and normalized value;
- confidence;
- verification status;
- human-review flag;
- suppression status;
- cost/credit field when available.

Reject or quarantine:

- rows without source provenance;
- records marked opted out or restricted;
- unverifiable exact contact data;
- malformed URLs;
- secrets;
- unexpected fields.

### CRM Handoff

Start with reviewed export files.

Optional webhook sync must:

- use environment variables;
- support dry-run;
- map only approved fields;
- create idempotency keys;
- prevent duplicates;
- record CRM ID;
- respect suppression status;
- log success/failure without private payloads;
- never send outreach.

### Data Schema

Use a validated internal object:

```text
accountName
website
industry
location
sourcePlatform
sourceUrl
sourceRecordId
placeId
observedGap
evidenceUrl
icpScore
qualificationStatus
contactName
contactRole
linkedinUrl
email
emailVerificationStatus
emailVerifiedDate
phone
suppressionStatus
outreachAngle
campaign
owner
nextAction
reviewDate
crmId
provenance[]
```

### Security

- `.env.example` contains names only, no values;
- secrets never enter Markdown;
- logs redact email/phone when configured;
- exports default to a gitignored private directory;
- apply file permissions where practical;
- define retention and deletion rules;
- do not commit prospect exports.

## Phase 4 — Content and Funnel Automation

Do not implement until the manual pilot is stable.

Possible approved automations:

- intake creates project and checklist;
- content status creates review tasks;
- published URL creates monitoring tasks;
- form submission creates/updates CRM contact;
- approved tag starts delivery and nurture;
- review date creates refresh task;
- qualified reply creates owner task;
- monthly metrics populate a reviewed report.

Every automation requires:

- owner;
- trigger;
- input/output contract;
- permissions;
- retry limit;
- fallback;
- logging;
- human approval point;
- test cases;
- rollback.

## Phase 5 — Content and Lead Reporting

Create reusable resource templates or specifications for:

- client baseline report;
- monthly content report;
- topic-cluster review;
- lead-source report;
- campaign scorecard;
- tool cost and ROI review.

Do not claim attribution that cannot be supported.

## Acceptance Criteria

The feature is complete when Bwa can open the Business Dashboard and answer in under one minute:

- Which content assets are in each production stage?
- Which commercial service and CTA does each asset support?
- Which lead magnet and funnel are connected?
- Which prospects are qualified, blocked, contacted, or opted out?
- Which accounts came from Google Maps/Places, Apollo, Clay, LinkedIn, or another source?
- What evidence supports the observed gap?
- Which contact fields are verified?
- What is the next action and owner?
- Which leads reached the CRM?
- Which campaign created qualified conversations, customers, or revenue?
- Which tools are being paid for and used?

## Validation

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-vault.ps1
```

Run all new tests.

Verify:

- both Bases render;
- links resolve;
- templates create valid frontmatter;
- published content validation works;
- suppression validation works;
- no secrets or prospect exports are tracked;
- Google integration uses official API only;
- Apollo integration uses official API only;
- Clay integration is API/webhook/export based, not browser automation;
- all network modes default to dry-run;
- no outreach is sent;
- existing dashboards remain functional;
- mobile Obsidian remains usable.

## Commit Strategy

1. `add Content-to-Lead metadata and audit rules`
2. `add content and prospect templates and Bases`
3. `add safe local record scripts and tests`
4. `add optional lead intelligence integration scaffolding`
5. `add CRM handoff, reporting, and documentation`

Open a draft PR and keep it draft until Vault Health passes and the manual pilot is documented.