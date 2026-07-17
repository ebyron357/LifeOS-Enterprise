---
type: project
status: active
area: "[[20 Areas/Learning and Knowledge]]"
goal:
owner: Bwa
priority: P1
start_date: 2026-07-16
due_date: 2026-08-15
review_date: 2026-07-23
next_action: Process one public captioned YouTube video through the manual pilot workflow and record every failure, correction, and useful output.
tags:
  - project
  - youtube
  - transcript
  - knowledge-engine
  - notebooklm
  - sop
---

# Build YouTube to Knowledge Engine

## Desired Outcome

Create a reliable LifeOS workflow that accepts a YouTube URL, obtains an authorized transcript, analyzes the source, extracts actionable resources, and produces a structured learning package that can be stored in Obsidian, added to NotebookLM, exported as Markdown, and converted to PDF.

## Core Flow

```text
YouTube URL
      ↓
Transcript
      ↓
AI source analysis
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
• course outline
• step-by-step SOP
• checklist
• flashcards
• quiz
• action items
• Obsidian notes
• Markdown files
• PDF
```

## Success Criteria

- [ ] A YouTube Knowledge Capture template exists.
- [ ] A tested source-analysis prompt exists.
- [ ] A step-by-step SOP exists for desktop and mobile-assisted capture.
- [ ] A native Obsidian Base shows all videos, transcript status, extracted resources, output status, and next action.
- [ ] Every extracted URL includes purpose, category, source video, related project, and review date.
- [ ] Transcript acquisition follows rights, access, and privacy rules.
- [ ] The workflow supports NotebookLM as the preferred no-code transcript and study layer when a public captioned video is supported.
- [ ] The workflow supports user-provided transcripts and authorized local audio as fallbacks.
- [ ] The system creates a canonical Markdown bundle.
- [ ] The Markdown bundle can be converted to a readable PDF.
- [ ] Code and commands are preserved in fenced blocks without being executed automatically.
- [ ] AI outputs include source timestamps or transcript references where available.
- [ ] One pilot video passes the manual workflow.
- [ ] Three different pilot videos pass before automation is considered stable.
- [ ] Codex implementation instructions exist for the automation layer.
- [ ] Copyright, terms, confidentiality, and private-source controls are documented.

## Pilot Sequence

### Pilot 1 — Public Captioned Tutorial

Use NotebookLM with one public YouTube video that has captions. Verify transcript import, extracted resources, course outline, SOP, checklist, flashcards, quiz, and action items.

### Pilot 2 — Technical Video with Commands and Code

Verify code fences, command preservation, URL extraction, tool normalization, and warnings against automatic execution.

### Pilot 3 — Long-Form Business or Strategy Video

Verify topic segmentation, action prioritization, book/resource extraction, course conversion, and concise executive summary.

## Definition of Done

The engine is operational when Bwa can paste or register a supported YouTube URL and answer in under two minutes:

- Has the transcript been obtained?
- What is the source and rights status?
- Which URLs, tools, products, books, commands, and websites were mentioned?
- Which extracted items were verified against the transcript?
- What should be learned or implemented first?
- Where are the course outline, SOP, checklist, flashcards, quiz, and action items?
- Where is the canonical Markdown package?
- Has the PDF been generated?
- Which outputs still require human review?
- What is the next action?

## Risks

- Transcript unavailable because captions do not exist.
- Newly uploaded videos may not import immediately into NotebookLM.
- AI may invent URLs, tool names, commands, books, or code not present in the transcript.
- Transcript text may contain caption errors.
- Code may be incomplete or unsafe.
- Private, paid, client, or copyrighted material may not be authorized for processing or sharing.
- Generated courses may overstate what the source actually teaches.
- PDF export may not match the canonical Markdown.
- Tool automation may break when providers change behavior.

## Guardrails

- Never fabricate an extracted item.
- Preserve exact source wording for commands, code, titles, and URLs where available.
- Mark inferred items separately from explicitly mentioned items.
- Do not execute extracted commands or code without human approval.
- Do not download or process restricted video media as the default workflow.
- Do not publish full transcripts unless rights permit it.
- Treat the transcript and generated outputs as private unless explicitly approved.
- Store one canonical source record and link all derivative outputs to it.

## Linked Records

- [[20 Areas/Learning and Knowledge]]
- [[40 Resources/YouTube Knowledge/YouTube to Knowledge Engine Specification]]
- [[40 Resources/YouTube Knowledge/Codex Package - YouTube Knowledge Engine]]
- [[40 Resources/Prompts/YouTube Transcript Knowledge Extraction Prompt]]
- [[80 SOPs/Process YouTube Video into LifeOS Knowledge]]