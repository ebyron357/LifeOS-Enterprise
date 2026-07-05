# PRD-002: Knowledge Graph

**Status:** Draft
**Phase:** 2
**Version:** 0.1
**Last Updated:** 2026-07-05

---

## Overview

The Knowledge Graph phase transforms LifeOS Enterprise from a task manager into an intelligent knowledge system. All entities — projects, tasks, contacts, notes, documents, decisions — are connected in a graph that agents and operators can traverse, search, and query.

---

## Goals

1. Operators can create and organize notes and documents
2. Notes can be linked to any entity (project, task, contact, business unit)
3. Semantic search returns relevant results across all entity types
4. Related entities are automatically surfaced based on graph proximity
5. The knowledge graph can be queried programmatically by AI agents

---

## Non-Goals

- No AI-generated content in this phase (agents can read but not write)
- No real-time collaborative editing
- No public sharing of knowledge

---

## User Stories

### Epic 1: Notes & Documents
- As an operator, I can create a note with rich text formatting
- As an operator, I can link a note to a project, task, or contact
- As an operator, I can tag a note with custom labels
- As an operator, I can view all notes linked to any entity
- As an operator, notes support inline links to other entities (`@project`, `@contact`)

### Epic 2: Search
- As an operator, I can search across all content (tasks, notes, contacts, projects) from a single search bar
- As an operator, search returns results ranked by semantic relevance
- As an operator, I can filter search results by entity type, business unit, and date range

### Epic 3: Knowledge Graph Navigation
- As an operator, I can view a visual graph of an entity and its relationships
- As an operator, I can see which entities are most strongly connected to a given entity
- As an operator, I can discover related items I did not explicitly link

### Epic 4: Decisions Log
- As an operator, I can record a decision with its context, options, and rationale
- As an operator, decisions are linked to the project or context they relate to
- As an operator, I can review the decision history for any project

---

## Acceptance Criteria

### AC-001: Notes
- [ ] Notes support: headings, bold, italic, lists, code blocks, links
- [ ] Notes support entity references (`@entity-name`) that resolve to live links
- [ ] Editing a note creates a version history (last 50 versions retained)
- [ ] Notes are full-text indexed within 5 seconds of creation/update

### AC-002: Search
- [ ] Search returns results across all entity types in a single query
- [ ] Semantic search finds conceptually related content even without exact keyword match
- [ ] Search results appear within 500ms for queries across up to 100,000 entities
- [ ] Zero-result queries suggest related terms or entities

### AC-003: Knowledge Graph
- [ ] Graph query API returns neighbors within N hops for any entity
- [ ] Automatic relationship detection links entities mentioned in note text
- [ ] Graph is updated within 30 seconds of any entity creation or note edit

### AC-004: Decisions
- [ ] Decisions require: title, context, options considered, chosen option, rationale
- [ ] Decisions appear in the activity timeline of their linked project
- [ ] Decisions are immutable after 24 hours (append-only amendments allowed)

---

## Technical Notes

- Embeddings generated for all text content (notes, task descriptions, project goals)
- Graph store: PostgreSQL with adjacency list, or dedicated graph DB (implementation decision)
- Full-text search: PostgreSQL full-text or Elasticsearch (implementation decision)
- Vector search: pgvector or Qdrant (implementation decision)

See [Tech Radar](../../architecture/tech-radar.md) for guidance.
