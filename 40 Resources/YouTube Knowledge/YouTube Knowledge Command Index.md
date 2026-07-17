---
type: resource
status: active
source: LifeOS
author: LifeOS
topic: youtube-knowledge-command
created: 2026-07-16
updated: 2026-07-16
review_date: 2026-07-23
tags:
  - resource
  - youtube
  - knowledge-engine
  - dashboard
  - notebooklm
---

# YouTube Knowledge Command Index

## Start Here

1. Copy the YouTube URL.
2. Confirm why the video deserves processing.
3. Create a source record from [[99 Templates/YouTube Knowledge Capture|YouTube Knowledge Capture]].
4. Follow [[80 SOPs/Process YouTube Video into LifeOS Knowledge|Process YouTube Video into LifeOS Knowledge]].
5. Use [[40 Resources/Prompts/YouTube Transcript Knowledge Extraction Prompt|YouTube Transcript Knowledge Extraction Prompt]].
6. Verify extracted links, tools, code, commands, books, and actions.
7. Save canonical Markdown and generate the reviewed PDF.

## Pipeline

![[00 Home/Bases/YouTube Knowledge Pipeline.base]]

## Core Records

- [[20 Areas/Learning and Knowledge|Learning and Knowledge Area]]
- [[10 Projects/Build YouTube to Knowledge Engine|Build YouTube to Knowledge Engine]]
- [[40 Resources/YouTube Knowledge/YouTube to Knowledge Engine Specification|System Specification]]
- [[80 SOPs/Process YouTube Video into LifeOS Knowledge|Processing SOP]]
- [[40 Resources/Prompts/YouTube Transcript Knowledge Extraction Prompt|Source-Grounded Analysis Prompt]]
- [[40 Resources/YouTube Knowledge/Codex Package - YouTube Knowledge Engine|Codex Engineering Package]]

## Official URLs

### NotebookLM

- [Open NotebookLM](https://notebooklm.google.com/)
- [Add sources and YouTube URLs](https://support.google.com/notebooklm/answer/16215270)
- [Create a notebook and Studio outputs](https://support.google.com/notebooklm/answer/16206563)
- [Create and export notes](https://support.google.com/notebooklm/answer/16262519)
- [Generate flashcards and quizzes](https://support.google.com/notebooklm/answer/16958963)
- [Generate Audio Overviews](https://support.google.com/notebooklm/answer/16212820)
- [Generate Slide Decks and export PDF/PPTX](https://support.google.com/notebooklm/answer/16757456)

### YouTube and Transcription

- [YouTube Data API](https://developers.google.com/youtube/v3/docs)
- [YouTube captions list](https://developers.google.com/youtube/v3/docs/captions/list)
- [YouTube captions download](https://developers.google.com/youtube/v3/docs/captions/download)
- [OpenAI speech-to-text](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Pandoc Markdown-to-PDF setup](https://pandoc.org/getting-started.html)

## Required Output Checklist

- [ ] Original YouTube URL
- [ ] Transcript
- [ ] Executive summary
- [ ] Extracted URLs
- [ ] Tools and products
- [ ] Commands and code
- [ ] Books, websites, and resources
- [ ] Course outline
- [ ] Step-by-step SOP
- [ ] Checklist
- [ ] Flashcards
- [ ] Quiz
- [ ] Action items
- [ ] Obsidian notes
- [ ] Markdown bundle
- [ ] Verification log
- [ ] Reviewed PDF

## Current Build Gate

The manual workflow must successfully process three different videos before end-to-end automation is approved.

### Pilot Status

| Pilot | Purpose | Status | Required next action |
|---|---|---|---|
| Public captioned tutorial | Verify NotebookLM transcript and learning outputs | Not started | Select one purposeful video |
| Technical video | Verify URLs, tools, commands, and code | Not started | Select after Pilot 1 |
| Business or strategy video | Verify course, SOP, and action extraction | Not started | Select after Pilot 2 |

## Verification Rules

- Never fabricate exact URLs.
- Never execute extracted commands or code automatically.
- Separate explicit, inferred, and missing information.
- Record transcript corrections.
- Keep restricted content private.
- Verify AI outputs against the transcript.
- LifeOS is the source of truth; NotebookLM is the study and grounded-analysis layer.

## Weekly Review

- [ ] Process the current highest-purpose video.
- [ ] Review blocked transcripts.
- [ ] Verify newly extracted URLs.
- [ ] Promote practical actions to active projects.
- [ ] Convert repeated procedures to SOPs.
- [ ] Review Markdown and PDF output quality.
- [ ] Remove low-value saved sources.

## Next Action

Process one public captioned YouTube video through the complete manual pilot and record the actual output quality, time required, errors, and corrections.