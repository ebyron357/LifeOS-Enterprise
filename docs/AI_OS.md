# LifeOS Enterprise — AI OS

> Defines the AI integration architecture, principles, and workflows for LifeOS Enterprise.

---

## Overview

The AI layer is the highest-order layer in the LifeOS architecture. It does not replace any layer below it — it augments the system by providing intelligent assistance, synthesis, and automation on top of the structured vault.

This document defines:
- The role of AI in LifeOS
- Integration principles
- AI workflow inventory
- Provider evaluation criteria
- Privacy and data handling policy

---

## The Role of AI in LifeOS

AI in LifeOS serves three functions:

### 1. Capture Assistance
Reducing friction at the point of information entry. AI helps transform raw, unstructured captures into properly typed and tagged notes.

### 2. Synthesis
Identifying patterns, connections, and insights across notes that a human reader would miss or not have time to find.

### 3. Review Support
Assisting with periodic reviews by summarizing recent activity, flagging stale items, and generating review prompts tailored to current context.

---

## Integration Principles

### Principle 1: AI Augments, Structure Governs
AI outputs are suggestions, not authoritative. The human user approves all structural changes to the vault. AI never autonomously modifies note metadata or folder placement.

### Principle 2: Structured Input, Structured Output
AI prompts are designed to receive well-structured note content (with frontmatter context) and return structured Markdown or JSON responses. The vault's schema is the AI's "API."

### Principle 3: Local First, Cloud Optional
Where possible, AI capabilities run locally (e.g., Ollama with a local model). Cloud AI providers are opt-in with explicit user consent.

### Principle 4: Prompt as Code
AI prompts are version-controlled, named, and documented like code. Prompt templates live in `03-Resources/Prompts/` and this repository's `specifications/prompts/`.

### Principle 5: No Raw Data Exfiltration
Sensitive personal data is never sent to cloud AI providers without explicit anonymization or user acknowledgment.

---

## AI Workflow Inventory

> **Status:** Placeholder — AI workflows will be built in Phase 5.

### Capture Workflows

| Workflow | Description | Priority |
|----------|-------------|---------|
| Smart Capture | Convert raw text captures into typed notes | P0 |
| Voice-to-Note | Transcribe voice memos and route to inbox | P1 |
| Email Digest | Parse important emails into meeting/task notes | P2 |

### Synthesis Workflows

| Workflow | Description | Priority |
|----------|-------------|---------|
| Weekly Synthesis | Summarize last 7 days' journal entries | P0 |
| Project Context Brief | Summarize project history before a work session | P1 |
| Knowledge Connection | Find related notes for a given topic | P1 |
| Relationship Summary | Summarize recent interactions with a person | P2 |

### Review Support Workflows

| Workflow | Description | Priority |
|----------|-------------|---------|
| Daily Briefing | Morning summary of priorities and context | P0 |
| Review Prompt Generator | Generate tailored review questions from recent notes | P1 |
| Stale Item Detection | Flag notes that haven't been accessed in a configurable period | P1 |
| Goal Alignment Check | Assess whether current projects align with stated goals | P2 |

---

## AI Provider Evaluation Criteria

When selecting AI providers, evaluate against:

| Criterion | Weight | Notes |
|-----------|--------|-------|
| Privacy & data handling | High | No training on personal data |
| Local operation capability | High | Prefer offline-capable models |
| API quality and reliability | Medium | REST API required |
| Cost | Medium | Per-token costs at vault scale |
| Model quality for personal use | Medium | Writing, summarization, tagging |
| Obsidian plugin availability | Low | Nice to have, not required |

---

## Candidate AI Providers

> **Status:** Under evaluation — no selection has been made.

| Provider | Local? | Notes |
|----------|--------|-------|
| Ollama (local) | ✅ | Open source, runs locally, no data privacy concerns |
| OpenAI GPT-4o | ❌ | High quality, cloud-only, privacy requires careful data handling |
| Anthropic Claude | ❌ | Strong writing/synthesis, cloud-only |
| Google Gemini | ❌ | Multimodal, cloud-only |
| Mistral (local via Ollama) | ✅ | Good quality, fully local |

---

## Privacy and Data Handling Policy

1. **Sensitive categories** (health data, financial data, personal relationships) require explicit opt-in before being included in AI prompts.
2. **Cloud prompts** include only the data necessary for the task — not full vault exports.
3. **Prompt logs** are stored locally and can be reviewed by the user.
4. **No AI provider** is permitted to use submitted data for model training (governed by provider terms of service at selection time).

---

## TODO

- [ ] Select and ratify the AI provider(s) in PROJECT_TRUTH.md
- [ ] Build the prompt library in `specifications/prompts/`
- [ ] Define the AI plugin architecture within Obsidian
- [ ] Create a data classification schema for privacy-aware prompting
- [ ] Document the local AI setup procedure (Ollama)
- [ ] Build and test the Daily Briefing workflow
- [ ] Define the AI workflow testing methodology
