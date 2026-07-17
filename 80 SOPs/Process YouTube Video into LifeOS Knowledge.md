---
type: sop
status: active
area: "[[20 Areas/Learning and Knowledge]]"
owner: Bwa
version: 1.0
last_tested:
review_date: 2026-07-23
tags:
  - sop
  - youtube
  - transcript
  - notebooklm
  - knowledge-engine
---

# Process YouTube Video into LifeOS Knowledge

## Purpose

Convert one selected YouTube video into verified, practical, permanent LifeOS knowledge with the source URL, transcript, extracted resources, course structure, SOP, checklist, flashcards, quiz, action items, Markdown files, and PDF preserved.

## Trigger

Use this SOP when a YouTube video contains information worth learning, applying, teaching, referencing, or turning into a repeatable workflow.

Do not process a video merely because it is interesting. Record the purpose first.

## Inputs and Requirements

Required:

- YouTube URL;
- reason for processing;
- operating context;
- target project, area, goal, client, business, nonprofit, community, or research record when applicable;
- public captions, authorized transcript, or authorized audio;
- LifeOS vault;
- source-grounded AI tool;
- review time.

Preferred:

- NotebookLM;
- transcript with timestamps;
- video description and visible links;
- Pandoc for final Markdown-to-PDF export.

## Procedure

### Step 1 — Decide Whether the Video Deserves Processing

1. State the purpose in one sentence.
2. Identify the decision, skill, workflow, project, or goal it supports.
3. Choose one operating context.
4. Decide the intended output: reference, course, SOP, implementation, teaching material, or all.
5. Stop if there is no practical purpose.

### Step 2 — Create the Source Record

1. In Obsidian, create a note from `99 Templates/YouTube Knowledge Capture.md`.
2. Enter the original YouTube URL.
3. Record the title, creator, capture date, purpose, operating context, and related record.
4. Set `transcript_status: not-started`.
5. Set `rights_status: review-required` until the source is assessed.
6. Add one next action and review date.

### Step 3 — Obtain the Transcript

#### Preferred Route: NotebookLM

Desktop:

1. Open `https://notebooklm.google.com/`.
2. Create or open a notebook dedicated to the topic or project.
3. Select **Add source**.
4. Choose **YouTube** or paste the public YouTube URL.
5. Wait for the source to import.
6. Open the source and confirm transcript text is visible.
7. Copy the NotebookLM notebook URL into the LifeOS source record.
8. Record `transcript_source: NotebookLM YouTube import`.

Mobile-assisted route:

1. Open the YouTube video.
2. Tap **Share**.
3. Choose NotebookLM when available.
4. Select the correct existing notebook or create a new one.
5. Open NotebookLM and confirm the source imported.
6. Complete the detailed extraction and export steps on desktop when mobile features are limited.

#### Fallback: User-Provided Transcript

1. Obtain the transcript from an authorized source.
2. Save it as `01 Transcript.md`.
3. Record the source and date.
4. Preserve timestamps when available.

#### Fallback: Authorized Audio

1. Confirm ownership or permission.
2. Import the authorized local audio into NotebookLM or an approved speech-to-text service.
3. Record the transcription provider, cost, and date.
4. Review transcript accuracy before analysis.

If no authorized transcript or audio is available, mark the record blocked and stop.

### Step 4 — Capture Supporting Source Text

1. Copy the video description when permitted.
2. Capture visible URLs exactly.
3. Record chapter names and timestamps.
4. Save creator-provided files or links as separate Resource records when useful.
5. Do not invent missing URLs.

### Step 5 — Run Source Analysis

1. Open `40 Resources/Prompts/YouTube Transcript Knowledge Extraction Prompt.md`.
2. Insert the source metadata, transcript, description, and stated purpose.
3. Run the prompt in NotebookLM or another source-grounded AI tool.
4. Require evidence locations for factual extractions.
5. Save the raw AI output privately for comparison.
6. Do not mark it verified yet.

### Step 6 — Verify Extracted Items

Review every category:

1. URLs
2. Tools
3. Products
4. Commands
5. Code
6. Books
7. Websites
8. People and communities
9. Other resources

For each item:

1. Confirm it appears in the transcript, description, or supplied notes.
2. Preserve exact spelling.
3. Verify exact URLs before marking active.
4. Mark inferred items separately.
5. Mark ambiguous items `needs-verification`.
6. Do not execute commands or code.
7. Add corrections to the Verification Log.

### Step 7 — Create the Learning Package

Create this folder under `40 Resources/YouTube Knowledge/Processed/<video-slug>/`:

```text
00 Source Record.md
01 Transcript.md
02 Executive Summary.md
03 Extracted URLs.md
04 Tools and Products.md
05 Commands and Code.md
06 Books Websites and Resources.md
07 Course Outline.md
08 SOP.md
09 Checklist.md
10 Flashcards.md
11 Quiz.md
12 Action Items.md
13 Verification Log.md
exports/
```

1. Use the reviewed AI output to populate each file.
2. Keep the transcript separate from derivative outputs.
3. Link every file back to the Source Record.
4. Add source timestamps or evidence locations.
5. Keep confidential content private.

### Step 8 — Create NotebookLM Study Outputs

1. Keep only the relevant source selected.
2. Generate a report or study guide.
3. Generate flashcards with the appropriate difficulty.
4. Generate a quiz with the appropriate difficulty.
5. Save useful chat responses to Notes.
6. Export reviewed notes to Docs or Sheets when needed.
7. Reconcile NotebookLM outputs with the canonical LifeOS Markdown.
8. Record any contradictions or citation errors.

### Step 9 — Convert Learning into Action

1. Remove low-value or unrelated actions.
2. Assign an owner.
3. Link each action to the correct project or area.
4. Add dependencies and evidence required for completion.
5. Promote immediate actions into the project system.
6. Backlog non-urgent ideas instead of interrupting active work.

### Step 10 — Generate the PDF

1. Review the canonical Markdown files.
2. Remove private notes and internal verification chatter from the public or shareable version.
3. Combine the approved Markdown in the correct order.
4. Use Pandoc or another approved converter to create the PDF.
5. Open the PDF and inspect headings, code blocks, tables, URLs, page breaks, and accessibility.
6. Save it under `exports/<video-slug>-learning-package.pdf`.
7. Record the export date and conversion method.

Example command after Pandoc is installed:

```powershell
pandoc "00 Source Record.md" "02 Executive Summary.md" "07 Course Outline.md" "08 SOP.md" "09 Checklist.md" "10 Flashcards.md" "11 Quiz.md" "12 Action Items.md" -o "exports/video-learning-package.pdf" --toc
```

Do not run this command until the file paths and outputs are reviewed.

### Step 11 — Update the Pipeline

1. Update transcript status.
2. Update output statuses.
3. Record counts for URLs, tools, commands, code, books, and actions.
4. Update evidence status.
5. Add the next action.
6. Set a review date.
7. Confirm the record appears in the YouTube Knowledge Pipeline Base.

## Expected Result

A complete source-linked learning package exists in LifeOS, with reviewed outputs, clearly separated evidence classes, actionable tasks, NotebookLM references, Markdown files, and an optional verified PDF.

## Validation Checklist

- [ ] Original YouTube URL is preserved.
- [ ] Purpose and operating context are recorded.
- [ ] Transcript source and rights status are recorded.
- [ ] Transcript is available or the item is correctly blocked.
- [ ] Extracted URLs are exact and verified.
- [ ] Mentioned and inferred resources are separated.
- [ ] Commands and code were not executed automatically.
- [ ] Course outline matches source coverage.
- [ ] SOP identifies missing information.
- [ ] Flashcards and quiz contain evidence references.
- [ ] Action items have owners and related records.
- [ ] Canonical Markdown files exist.
- [ ] PDF was reviewed after export.
- [ ] Private or restricted content is not exposed.
- [ ] Source record appears in the Base.
- [ ] Next action and review date are current.

## Exceptions and Troubleshooting

### NotebookLM Cannot Import the Video

Possible causes include missing captions, a newly uploaded video, unsupported language, invalid URL, or safety restrictions.

Action:

1. Verify the URL is public.
2. Confirm captions exist.
3. Try again after the video is older than 72 hours when applicable.
4. Use an authorized transcript or local audio fallback.
5. Do not use an unauthorized scraper as the default workaround.

### Transcript Contains Errors

1. Compare questionable sections with the video.
2. Record corrections in the Verification Log.
3. Keep the original text available.
4. Mark uncertain extractions as unverified.

### AI Invents a Resource or URL

1. Delete the fabricated exact URL.
2. Keep the named resource only if the source actually mentions it.
3. Mark the URL as needing verification.
4. Record the hallucination in the Verification Log.

### Code Is Incomplete

1. Preserve the snippet.
2. Mark it incomplete.
3. Do not repair it silently.
4. Create a separate research or implementation task if completion is valuable.

### PDF Conversion Fails

1. Confirm Pandoc is installed.
2. Confirm input paths exist.
3. Simplify unsupported Markdown features.
4. Check tables and code blocks.
5. Keep the Markdown package as the source of truth.

## Review and Maintenance

- **Owner:** Bwa
- **Version:** 1.0
- **Last tested:** Not yet tested
- **Review date:** 2026-07-23
- **Promotion rule:** Do not automate beyond the pilot stage until three different videos complete this SOP successfully.