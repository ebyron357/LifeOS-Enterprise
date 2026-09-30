---
type: resource
status: inbox
source: ""
canonical_source: ""
source_type: ""
source_identity: ""
capture_channel: "obsidian-manual"
captured_at: "{{date}}"
last_captured: "{{date}}"
capture_count: 1
processing_state: "needs-review"
architecture_classification: "PENDING"
disposition: "PENDING"
processor_route: "owner-review"
evidence_status: "capture-only"
evidence_inspected_at: ""
related_project: ""
related_area: ""
owner: ""
review_date: "{{date}}"
file_name: ""
file_hash: ""
file_size: 0
file_type: ""
next_action: "Owner review: inspect the source manually, then record architecture classification and disposition in /resources/review."
topic: ""
author: ""
created: "{{date}}"
tags:
  - resource
  - resource-intelligence
---

# {{title}}

%%
Manual capture follows the Resource Intelligence record contract (docs/RESOURCE_INTELLIGENCE.md).
Prefer the LifeOS web intake: it computes the stable identity, dedupes exact duplicates, gathers GitHub evidence server-side, and stages a draft PR.
When capturing by hand:
- source_type: github, youtube, pdf-document, tool-course, social, webpage, file, or generic-internal.
- source_identity: github:owner/repository (lowercase), youtube:VIDEO_ID, url:CANONICAL_URL, or file:SHA256.
- processor_route: "GitHub evidence processor (LifeOS)" for github, "80 SOPs/Process YouTube Video into LifeOS Knowledge.md" for youtube, "99 Templates/Technology or Repository Review.md" for webpage, pdf-document, or file, otherwise "owner-review". Update next_action to match.
- Leave architecture_classification and disposition PENDING until an owner review records them.
- Keep Source Evidence only for evidence you actually inspected; then set evidence_status to "source-evidence-captured" and evidence_inspected_at to the inspection time. Otherwise delete that section.
%%

## Source

- Canonical source:
- Source type:
- Stable identity:

## Evaluation

- Architecture classification: **PENDING**
- Disposition: **PENDING**
- Evidence: capture only; source inspection has not yet been performed.
- Next action: Owner review: inspect the source manually, then record architecture classification and disposition in /resources/review.

## Source Evidence

> Source evidence, not a disposition. Optional: record only what was actually inspected.

- Evidence status: capture-only
- Inspected at:
- Processor:

## Capture History

- {{date}} — captured through obsidian-manual.

## Governance

This record is canonical for the stable source identity above. Exact duplicates update this record instead of creating a competing record. Strategic classification and disposition require source-grounded review; capture alone does not prove adoption, value, or implementation. Source Evidence is provenance from a read-only processor, not a disposition.
