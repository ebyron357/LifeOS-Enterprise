---
type: prompt
title: Librarian Attention Classification
purpose: Classify unprocessed notes into LifeOS note types with destination, template, metadata, and links.
status: approved
version: 1.0
created: 2026-07-07
updated: 2026-09-20
owner: Byron
agent: Librarian
tags: [prompt, ai-role, librarian, classification]
task_types: [classification, inbox, librarian]
trigger_context: [unprocessed notes, classify, inbox, librarian]
recommended_context: Unprocessed Inbox notes that need a destination folder and template.
source_path: AI/Librarian.md
source_origin: embedded-ai-role
canonical_prompt_id: prompt:librarian-attention-classification
last_result_status: UNTESTED
quality_state: UNTESTED
review_date: 2026-10-20
privacy_level: internal
---

# Librarian Attention Classification

## Purpose

Classify unprocessed notes into LifeOS note types with destination, template, metadata, and links.

## Recommended context

Unprocessed Inbox notes. Keep the Librarian role file as the agent instruction; use this record to reuse the prompt.

## Expected input

Unprocessed note titles, current folders, and any existing metadata.

## Expected output

A cleanup report: items to process, destination folder, template, metadata, links, archive candidates.

## Prompt

```text
Review unprocessed notes and classify them into LifeOS note types. For each item, recommend the destination folder, template, metadata, and links to add.
```
