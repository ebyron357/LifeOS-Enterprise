---
type: resource
status: approved
source: LifeOS requirements and official platform documentation
author: LifeOS
topic: youtube-knowledge-engine
created: 2026-07-16
updated: 2026-07-16
review_date: 2026-08-01
tags:
  - resource
  - youtube
  - transcript
  - notebooklm
  - knowledge-engine
  - learning
  - url-library
---

# YouTube to Knowledge Engine Specification

## Objective

Turn selected YouTube videos into verified, organized, reusable knowledge without losing the original URL, transcript source, extracted resources, actions, or derivative learning assets.

## Required Workflow

```text
YouTube URL
      ↓
Transcript acquisition
      ↓
Transcript normalization and source check
      ↓
AI analysis
      ↓
Extract
• URLs
• tools
• products
• commands
• code
• resources
• books
• websites
      ↓
Generate
• executive summary
• course outline
• step-by-step SOP
• checklist
• flashcards
• quiz
• action items
• Obsidian notes
• Markdown bundle
• PDF
      ↓
Human verification
      ↓
LifeOS storage and NotebookLM study layer
```

## Operating Context

Every source must be tagged as one of:

- personal;
- internal venture;
- client-approved;
- nonprofit;
- community;
- research;
- demonstration;
- public learning.

Do not assume the video relates to a business, client, nonprofit, or personal project unless the source record explicitly says so.

## Transcript Acquisition Order

### Route 1 — NotebookLM YouTube Import

Use when the video is public and has user-uploaded or auto-generated captions.

NotebookLM imports the text transcript of supported public YouTube videos. It may fail when captions are unavailable, the URL is invalid, the language is unsupported, the content is flagged, or the video was uploaded recently.

### Route 2 — YouTube Transcript Supplied by the User

Use copied transcript text, an authorized caption file, or a transcript exported from an account the user controls.

### Route 3 — Authorized Audio Transcription

Use only when the user owns the audio, has permission to process it, or provides an authorized local audio file. NotebookLM can transcribe supported local audio during import. A separate speech-to-text API may be used only with explicit permission and documented cost.

### Route 4 — YouTube Captions API for Authorized Content

The official YouTube Data API can list and download caption tracks, but the captions endpoints require OAuth authorization. Treat this as an owner/channel workflow, not a generic public-video transcript scraper.

### Prohibited Default Route

Do not download restricted video media, bypass access controls, scrape private videos, or republish full transcripts without permission.

## Source Record Requirements

Each video record must include:

- original YouTube URL;
- video ID;
- title;
- channel or creator;
- publication date when known;
- date captured;
- operating context;
- purpose for learning;
- related project, area, goal, client, business, community, or nonprofit when applicable;
- transcript source;
- transcript status;
- transcript language;
- rights and permission status;
- evidence status;
- NotebookLM notebook URL when used;
- output folder;
- next action;
- review date.

## Extraction Contract

The AI must return each category separately.

### URLs

Capture:

- exact URL when visible in transcript, description, or user-provided notes;
- display name;
- purpose;
- category;
- transcript timestamp or evidence location;
- verification status;
- related tool or resource;
- review date.

Never construct or guess a URL from a product or company name. If a URL is not explicitly available, store the named resource with `url_status: needs-verification`.

### Tools and Products

Capture:

- exact name;
- vendor or creator;
- stated use;
- free, paid, open source, or unknown;
- source location;
- whether the speaker recommends, compares, criticizes, or merely mentions it;
- action recommendation: test, research, save, reject, or no action.

### Commands

Preserve commands exactly in fenced code blocks. Include:

- shell or platform when known;
- purpose;
- prerequisites;
- source location;
- safety warning;
- execution status: never-run, tested, failed, or verified.

Do not execute extracted commands automatically.

### Code

Capture only code that appears in the transcript, description, captions, source files, or authorized notes. Preserve language and formatting where possible. Mark incomplete snippets and transcription uncertainty.

### Books, Websites, and Other Resources

Capture:

- title;
- author or organization when stated;
- resource type;
- reason mentioned;
- source timestamp;
- URL if explicit;
- verification status;
- related learning outcome.

## Generated Outputs

### Executive Summary

Explain:

- what the video teaches;
- why it matters;
- who it is for;
- what can be applied now;
- what requires additional verification.

### Course Outline

Include:

- course title;
- audience;
- prerequisites;
- measurable learning outcomes;
- modules and lessons;
- practical exercises;
- final applied project;
- assessment plan;
- source coverage and content gaps.

Do not imply the source covers material not present in the transcript.

### Step-by-Step SOP

Follow the LifeOS SOP standard:

- purpose;
- trigger;
- inputs;
- numbered procedure;
- expected result;
- validation;
- exceptions;
- troubleshooting;
- owner;
- version;
- last-tested date;
- review date.

### Checklist

Create:

- prerequisites;
- action checklist;
- verification checklist;
- follow-up checklist.

### Flashcards

Each card must have:

- question or term;
- answer or definition;
- source timestamp or section;
- difficulty;
- topic;
- confidence.

### Quiz

Include:

- multiple choice;
- true/false only when unambiguous;
- short-answer questions;
- scenario/application questions;
- answer key;
- explanation;
- source reference;
- difficulty.

### Action Items

Every action must include:

- action;
- reason;
- priority;
- estimated effort;
- owner;
- related project or area;
- dependency;
- due date when appropriate;
- evidence required for completion.

### Obsidian and Markdown Package

Required output package:

```text
<video-slug>/
├── 00 Source Record.md
├── 01 Transcript.md
├── 02 Executive Summary.md
├── 03 Extracted URLs.md
├── 04 Tools and Products.md
├── 05 Commands and Code.md
├── 06 Books Websites and Resources.md
├── 07 Course Outline.md
├── 08 SOP.md
├── 09 Checklist.md
├── 10 Flashcards.md
├── 11 Quiz.md
├── 12 Action Items.md
├── 13 Verification Log.md
└── exports/
    └── <video-slug>-learning-package.pdf
```

LifeOS stores the canonical records. NotebookLM may use the transcript and selected Markdown outputs as sources, but NotebookLM is not the authoritative storage layer.

### PDF

The canonical PDF must be generated from reviewed Markdown, not directly from an unreviewed AI response. The preferred general converter is Pandoc. NotebookLM Slide Deck export may be used for presentation PDFs, but it is not a substitute for the canonical written learning package.

## NotebookLM Workflow

For a supported source:

1. Create or open the correct purpose-specific NotebookLM notebook.
2. Add the public YouTube URL.
3. Confirm the transcript source imported successfully.
4. Ask source-grounded questions and verify citations.
5. Generate reports or study guides.
6. Generate flashcards and quizzes in Studio when helpful.
7. Save useful responses to Notes.
8. Export reviewed notes to Google Docs or Sheets when needed.
9. Export or recreate the canonical outputs in LifeOS Markdown.
10. Store the NotebookLM URL in the source record.

NotebookLM notebooks are independent. Do not expect one notebook to search all other notebooks.

## Verification Rules

- Every factual extraction must be traceable to transcript text, description text, or a named source.
- Exact URLs must be verified before being marked active.
- Tool names must match official spelling before publication.
- Code and commands require human review.
- AI-inferred resources must be labeled `inferred`, not `mentioned`.
- Transcript errors must be corrected in a verification log, not silently changed.
- Each output must state its evidence status.
- Medical, legal, financial, compliance, or safety instructions require additional qualified review.

## Official URLs

### NotebookLM

- Application: https://notebooklm.google.com/
- Learn about NotebookLM: https://support.google.com/notebooklm/answer/16164461
- Add sources and YouTube URLs: https://support.google.com/notebooklm/answer/16215270
- Create a notebook and Studio outputs: https://support.google.com/notebooklm/answer/16206563
- Create and export notes: https://support.google.com/notebooklm/answer/16262519
- Flashcards and quizzes: https://support.google.com/notebooklm/answer/16958963
- Audio Overviews: https://support.google.com/notebooklm/answer/16212820
- Slide Decks and PDF/PPTX export: https://support.google.com/notebooklm/answer/16757456

### YouTube

- YouTube Data API reference: https://developers.google.com/youtube/v3/docs
- Captions list: https://developers.google.com/youtube/v3/docs/captions/list
- Captions download: https://developers.google.com/youtube/v3/docs/captions/download

### Transcription and Export

- OpenAI speech-to-text guide: https://developers.openai.com/api/docs/guides/speech-to-text
- Pandoc getting started: https://pandoc.org/getting-started.html

## Evidence Status

- NotebookLM public YouTube transcript import: Verified from official Google documentation.
- NotebookLM flashcards, quizzes, notes, and slide deck/PDF capabilities: Verified from official Google documentation.
- YouTube captions API authorization requirements: Verified from official Google developer documentation.
- OpenAI speech-to-text as an authorized audio fallback: Verified from official OpenAI documentation.
- Fully automated end-to-end LifeOS workflow: Unverified until three pilots pass.

## Review Date

Review this specification monthly during initial implementation and quarterly after stabilization.