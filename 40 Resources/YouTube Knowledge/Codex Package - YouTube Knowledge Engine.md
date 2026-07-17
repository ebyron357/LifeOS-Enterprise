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
  - youtube
  - transcript
  - knowledge-engine
  - automation
---

# Codex Package — YouTube Knowledge Engine

## Feature ID

`LIFEOS-KNOWLEDGE-003`

## Objective

Implement a safe, source-grounded YouTube-to-knowledge workflow inside the existing Obsidian LifeOS vault. The system must preserve the source URL, obtain only authorized transcript text, extract resources without hallucinating them, generate reusable learning outputs, create a canonical Markdown package, and optionally export a reviewed PDF.

## Critical Context

This repository is an Obsidian vault with native Bases, Markdown templates, PowerShell validation, and a small Node/OpenAI integration. Extend it. Do not rebuild it or scaffold a web application inside the vault.

## Read First

1. `README.md`
2. `AGENTS.md`
3. `docs/LifeOS_Specification_v1.md`
4. `architecture/METADATA_SCHEMA.md`
5. `scripts/audit-vault.ps1`
6. `scripts/validate-vault-links.ps1`
7. `integrations/openrouter/package.json`
8. `20 Areas/Learning and Knowledge.md`
9. `10 Projects/Build YouTube to Knowledge Engine.md`
10. `40 Resources/YouTube Knowledge/YouTube to Knowledge Engine Specification.md`
11. `40 Resources/Prompts/YouTube Transcript Knowledge Extraction Prompt.md`
12. `80 SOPs/Process YouTube Video into LifeOS Knowledge.md`
13. `99 Templates/YouTube Knowledge Capture.md`
14. `00 Home/Bases/YouTube Knowledge Pipeline.base`

## Non-Negotiable Boundaries

Do not:

- download YouTube video media as the default workflow;
- bypass private, paid, age-gated, region-restricted, or access-controlled content;
- add an arbitrary public-video transcript scraper as the default provider;
- publish or commit full copyrighted transcripts;
- invent URLs, tools, books, products, commands, code, timestamps, or source claims;
- execute extracted commands or code;
- expose API keys or private NotebookLM URLs;
- connect a public site directly to the private vault;
- automate end-to-end processing before the three manual pilots are documented;
- create a duplicate note type when `resource`, `project`, `area`, or `sop` fits;
- replace NotebookLM as the preferred no-code route for supported public captioned videos.

## Current Manual Implementation Already Present

- Learning and Knowledge Area
- Active YouTube Knowledge Engine project
- System specification with official URLs
- Source-grounded extraction prompt
- Processing SOP
- YouTube Knowledge Capture template
- Native pipeline Base
- YouTube Knowledge Command Index

Preserve and validate these files.

## Phase 1 — Complete Vault Integration Now

### 1. Extend the Metadata Contract

Update `architecture/METADATA_SCHEMA.md` under Resource with a subsection titled `YouTube Knowledge Resource Extension`.

Document these properties:

```yaml
youtube_url:
video_id:
video_title:
channel:
published_date:
captured_date:
operating_context:
purpose:
transcript_source:
transcript_status:
transcript_language:
rights_status:
evidence_status:
notebooklm_url:
output_folder:
url_count:
tool_count:
command_count:
code_count:
book_count:
action_count:
course_status:
sop_status:
checklist_status:
flashcards_status:
quiz_status:
markdown_status:
pdf_status:
next_action:
review_date:
```

Controlled values:

#### `transcript_status`

- not-started
- importing
- available
- needs-review
- blocked-no-captions
- blocked-permission
- failed
- verified

#### `rights_status`

- review-required
- public-captioned
- user-provided
- owned
- permission-granted
- restricted
- denied
- unknown

#### output statuses

- not-started
- draft
- needs-review
- verified
- blocked
- complete

Validation rules:

- a YouTube knowledge record requires `youtube_url`, `purpose`, `operating_context`, `transcript_status`, `rights_status`, `next_action`, and `review_date`;
- `transcript_status: verified` requires a transcript source;
- `pdf_status: complete` requires `markdown_status: verified` or `complete`;
- `rights_status: restricted` or `denied` prevents public export;
- exact URL counts must never be populated from inferred links;
- code and command outputs remain non-executable records.

### 2. Update the Vault Audit

Update `scripts/audit-vault.ps1` to require:

- `99 Templates/YouTube Knowledge Capture.md`;
- `00 Home/Bases/YouTube Knowledge Pipeline.base`;
- `40 Resources/YouTube Knowledge/YouTube Knowledge Command Index.md`;
- `80 SOPs/Process YouTube Video into LifeOS Knowledge.md`.

Add template checks for key fields:

- `type: resource`;
- `topic: youtube-knowledge`;
- `youtube_url:`;
- `transcript_status:`;
- `rights_status:`;
- `evidence_status:`;
- `next_action:`;
- `review_date:`.

Do not make the audit depend on internet access, NotebookLM access, Pandoc, or an AI API key.

### 3. Add Dashboard Navigation

Update `00 Home/Personal Dashboard.md` without removing existing content.

Add:

```markdown
## Learning and Knowledge

- [[20 Areas/Learning and Knowledge|Learning and Knowledge Area]]
- [[10 Projects/Build YouTube to Knowledge Engine|Build YouTube to Knowledge Engine]]
- [[40 Resources/YouTube Knowledge/YouTube Knowledge Command Index|YouTube Knowledge Command Index]]
- [[80 SOPs/Process YouTube Video into LifeOS Knowledge|YouTube Processing SOP]]

![[00 Home/Bases/YouTube Knowledge Pipeline.base]]
```

Also add one navigation link from `00 Home/Life OS.md` to the command index or Learning and Knowledge Area. Do not clutter the home page with the full Base if Personal Dashboard already embeds it.

### 4. Create a Non-Network Capture Script

Create:

`scripts/youtube-knowledge/New-YouTubeKnowledgeCapture.ps1`

Purpose:

- accept a YouTube URL, purpose, operating context, and optional related project;
- validate only recognized YouTube URL formats;
- extract the video ID locally;
- request or accept a title slug without calling external services;
- create a safe folder under `40 Resources/YouTube Knowledge/Processed/<slug>/`;
- create the standard empty Markdown files;
- populate `00 Source Record.md` from the capture template;
- preserve the exact original URL;
- set transcript and output statuses to `not-started`;
- refuse to overwrite an existing folder unless an explicit safe flag is supplied;
- output the created paths and next action.

Supported URL forms should include common `youtube.com/watch?v=`, `youtu.be/`, and `youtube.com/shorts/` patterns. Reject malformed or non-YouTube URLs.

The script must not:

- retrieve metadata;
- fetch captions;
- download media;
- call an AI service;
- open a browser;
- write secrets.

Add Pester tests or a deterministic PowerShell test script covering valid IDs, invalid URLs, safe slugging, no-overwrite behavior, and generated frontmatter.

## Phase 2 — Pilot-Assisted Processing CLI

Implement only after the manual pilot output format is confirmed. If no pilot record exists, create the code behind a clearly experimental command and document that it is not approved for routine use.

### Suggested Location

`integrations/youtube-knowledge/`

### Suggested Runtime

Prefer Node.js ESM to align with `integrations/openrouter`, unless repository inspection proves PowerShell is materially simpler and testable.

### Required CLI Contract

```text
lifeos-youtube analyze \
  --source-record <path> \
  --transcript-file <path> \
  --description-file <optional-path> \
  --output-dir <path> \
  --provider openai|openrouter \
  --dry-run
```

The CLI must require a local transcript file. It must not fetch a public transcript or video automatically in Phase 2.

### Required Pipeline

1. Load and validate the source record.
2. Load the authorized transcript and optional description.
3. Normalize line endings and timestamps without deleting the original.
4. Detect exact URLs using deterministic parsing before AI analysis.
5. Send the transcript and source context to the approved model using structured output.
6. Validate the model response against a schema.
7. Reject model-generated exact URLs that are not in the deterministic source URL set.
8. Separate explicit, inferred, and missing items.
9. Generate the Markdown file bundle.
10. Create a Verification Log containing warnings and unsupported claims.
11. In `--dry-run`, write only a preview or print the file plan.
12. Never execute extracted code or commands.
13. Update output statuses only after files are written successfully.

### Required Structured Output

Use a schema containing:

- sourceIntegrity;
- executiveSummary;
- topics;
- urls;
- tools;
- products;
- commands;
- code;
- books;
- websites;
- people;
- communities;
- resources;
- courseOutline;
- sop;
- checklist;
- flashcards;
- quiz;
- actionItems;
- verificationQueue;
- finalDecision.

Each extracted item requires:

- evidence class;
- transcript evidence location;
- confidence;
- verification status.

### Model and Prompt Handling

- Store prompt text in a versioned local file.
- Record prompt version and model name in the Verification Log.
- Use environment variables for API credentials.
- Support deterministic retry limits.
- Cap transcript size and provide chunking with overlap when needed.
- Merge chunk results using deterministic de-duplication.
- Do not silently discard conflicting extractions.
- Track estimated token or provider cost when available.

### Tests

Use synthetic fixture transcripts created for this repository. Do not commit copyrighted video transcripts.

Test:

- exact URL preservation;
- invented URL rejection;
- duplicate resource merging;
- command/code non-execution;
- transcript timestamp preservation;
- malformed model output rejection;
- partial failure behavior;
- no API key behavior;
- dry run;
- safe Markdown filenames;
- existing-file protection;
- private/restricted export blocking.

## Phase 3 — PDF Export

Create:

`scripts/youtube-knowledge/Export-YouTubeKnowledgePdf.ps1`

Requirements:

- accept a processed folder;
- verify required reviewed Markdown files exist;
- refuse export when `markdown_status` is not verified or complete unless `-AllowDraft` is explicitly supplied;
- detect Pandoc with `pandoc --version`;
- build the approved file order;
- create an `exports` folder;
- invoke Pandoc without shell interpolation vulnerabilities;
- capture stdout, stderr, exit code, Pandoc version, date, and input files in an export log;
- never include the full transcript in a public/shareable PDF by default;
- preserve code blocks and URLs;
- fail clearly when a PDF engine is unavailable;
- leave Markdown untouched when PDF generation fails.

Add tests for file ordering, missing Pandoc, missing inputs, restricted export, and draft override.

## Phase 4 — NotebookLM Handoff

NotebookLM does not provide a general public automation contract for this LifeOS workflow in the current specification. Treat it as a manual handoff.

Create:

`40 Resources/YouTube Knowledge/NotebookLM Handoff Checklist.md`

Include:

- notebook naming;
- YouTube URL import;
- transcript confirmation;
- prompts to run;
- flashcard/quiz settings;
- Notes export;
- LifeOS reconciliation;
- NotebookLM URL storage;
- privacy and sharing review.

Do not automate browser interaction with NotebookLM in this sprint.

## Documentation

Update:

- `docs/LifeOS_Specification_v1.md`;
- `docs/CHANGELOG.md` or the existing changelog mechanism;
- `README.md` Key Files only if the command index becomes primary navigation;
- `URLs/README.md` with a short rule that extracted URLs must link back to the YouTube source record and include purpose and verification status.

Create:

`docs/YOUTUBE_KNOWLEDGE_ENGINE.md`

This user-facing reference must include:

- quick start;
- desktop NotebookLM steps;
- mobile share-to-NotebookLM steps;
- transcript fallbacks;
- output structure;
- command examples;
- verification rules;
- PDF export;
- troubleshooting;
- official URLs;
- copyright and privacy boundaries.

## Validation

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-vault.ps1
```

Run new script tests.

Verify in Obsidian:

- Learning and Knowledge section renders;
- YouTube Knowledge Pipeline Base renders;
- source records appear;
- internal links resolve;
- the command index works on desktop and mobile;
- no private transcript is committed;
- no API key or NotebookLM private URL is committed.

## Acceptance Criteria

The feature is complete when Bwa can:

1. register a YouTube URL safely;
2. see transcript and rights status;
3. process an authorized transcript;
4. inspect extracted URLs, tools, products, commands, code, books, websites, and resources;
5. review a course outline, SOP, checklist, flashcards, quiz, and action items;
6. open a structured Obsidian/Markdown bundle;
7. generate a reviewed PDF when Pandoc is available;
8. identify every unverified or inferred item;
9. find the next action from the Personal Dashboard;
10. process three pilot videos without losing source traceability.

## Commit Strategy

1. `add YouTube knowledge metadata and vault integration`
2. `add safe YouTube capture script and tests`
3. `add transcript analysis CLI and structured output`
4. `add PDF export and NotebookLM handoff`
5. `add documentation and validation updates`

Open a draft pull request. Do not merge until Vault Health passes and the manual Pilot 1 is documented.