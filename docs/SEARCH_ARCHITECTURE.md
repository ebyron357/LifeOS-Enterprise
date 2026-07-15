# LifeOS — Search Architecture

> **Version:** 1.0  
> **Status:** Official  
> **Owner:** Chief Product Officer  
> **Last Updated:** 2026-07-04

---

## Overview

Universal Search is the single query interface for all objects in LifeOS. An operator can search any term and receive results from every module — projects, businesses, knowledge, people, meetings, repositories, agents, prompts, workflows, tools, and automations — ranked by relevance and enriched with relationship data.

Search does not duplicate data. It indexes metadata fields from canonical module sources and returns pointers to the source objects.

---

## Searchable Entity Types

| Entity Type | Source Module | ID Pattern | Searchable Fields |
|-------------|--------------|------------|------------------|
| **Project** | `/projects` | `PRJ-XXXX` | title, summary, tags, owner, next_action, status |
| **Business** | `/businesses` | `BIZ-XXXX` | name, description, industry, model, tags |
| **Knowledge Object** | `/knowledge` | `KNO-XXXX` | title, summary, tags, domain, related_concepts |
| **Person** | `/people` | `PER-XXXX` | name, role, email, company, tags |
| **Meeting** | `/meetings` | `MTG-XXXX` | title, attendees, date, summary, action_items |
| **Repository** | `/github` | repo name | name, description, topics, language |
| **Agent** | `/agents` | agent_id | name, type, description, capabilities |
| **Prompt** | `/ai` | prompt_id | title, purpose, tags |
| **Workflow** | `/workflows` | `WRK-XXXX` | name, description, trigger, tags |
| **Tool** | `/mcp` | tool_id | name, type, description, capabilities |
| **Automation** | `/automations` | `AUTO-XXXX` | name, trigger, description, status, tags |
| **Decision** | `/decisions` | `DEC-XXXX` | title, context, decision, rationale, tags |
| **SOP** | `/sops` | `SOP-XXXX` | title, purpose, steps summary, tags |
| **Risk** | `/projects` | `RISK-XXXX` | description, project, status, severity |

---

## Search Architecture

### Index Structure

The search index is a flat in-memory map keyed by entity ID. Each index entry contains:

```json
{
  "id": "PRJ-0042",
  "type": "Project",
  "title": "ClientVerse API v2",
  "summary": "Rebuild the ClientVerse API with GraphQL...",
  "tags": ["api", "graphql", "clientverse"],
  "status": "Active",
  "owner": "operator",
  "source_path": "/projects/clientverse-api-v2/README.md",
  "relationships": {
    "business": "BIZ-0003",
    "knowledge": ["KNO-0012", "KNO-0019"],
    "agents": ["chief-of-staff"],
    "repositories": ["clientverse/api"]
  },
  "last_indexed": "2026-07-04"
}
```

### Query Processing

```
Query Input
    │
    ▼
Tokenize and normalize
    │
    ▼
Match against index fields:
  title (weight: 3)
  tags (weight: 2)
  summary (weight: 1)
    │
    ▼
Score each result
    │
    ▼
Filter by entity type (if filter applied)
    │
    ▼
Enrich with relationship data
    │
    ▼
Return ordered results
```

### Relevance Scoring

```
relevance_score =
  (title_match × 3)
  + (tag_match × 2)
  + (summary_match × 1)
  + recency_bonus(updated)     // +1 if updated within 7 days
  + status_bonus(status)       // +1 if status is Active or Final
```

---

## Search Result Format

Each result includes:

```json
{
  "rank": 1,
  "id": "PRJ-0042",
  "type": "Project",
  "title": "ClientVerse API v2",
  "excerpt": "...rebuild the ClientVerse API with GraphQL to support real-time...",
  "status": "Active",
  "owner": "operator",
  "source_path": "/projects/clientverse-api-v2/README.md",
  "relationships": {
    "business": { "id": "BIZ-0003", "name": "ClientVerse" },
    "knowledge": [
      { "id": "KNO-0012", "title": "GraphQL Pagination Patterns" }
    ],
    "agents": [
      { "id": "chief-of-staff", "name": "Chief of Staff" }
    ]
  },
  "matched_fields": ["title", "tags"],
  "relevance_score": 11
}
```

Results always display relationships to give context without requiring navigation.

---

## Search Filters

Users can filter results by:

| Filter | Values |
|--------|--------|
| `type` | Any entity type from the table above |
| `status` | Active, Draft, Completed, Failed, etc. |
| `business` | Filter to a specific business ID |
| `owner` | Filter by person or agent |
| `tags` | One or more tags |
| `updated_since` | Date filter on last-modified |
| `domain` | For knowledge objects: business, technology, etc. |

---

## Search UX Patterns

### Type-Ahead
As the operator types, the search engine returns instant results using prefix matching on `title` and `tags`.

### Faceted Search
After a query, filters appear showing the count of results per type:
```
Projects (4) | Knowledge (7) | People (2) | Decisions (1)
```

### Entity-First Navigation
An operator can navigate directly to a type: `type:knowledge graphql` returns only knowledge objects matching "graphql".

### Relationship Drill-Down
From any search result, the operator can see all related objects:
```
ClientVerse API v2 (Project)
  → Business: ClientVerse
  → Knowledge: GraphQL Pagination Patterns, API Versioning Strategy
  → Agent: Chief of Staff, Engineering Lead
```

---

## Index Maintenance

The search index is rebuilt from source files:

| Trigger | Action |
|---------|--------|
| New object created | Index entry added |
| Object updated | Index entry refreshed |
| Object deleted/archived | Index entry removed |
| Manual rebuild | Full index rebuild from all source files |

In the file-based system, index maintenance is triggered by the operator or a scheduled automation.

---

## API Contract (Future)

```
GET /api/search?q={query}
GET /api/search?q={query}&type=knowledge
GET /api/search?q={query}&type=project&status=Active
GET /api/search?q={query}&business=BIZ-0003
GET /api/search/{entity_type}/{id}/relationships
```

All responses include `results[]`, `total_count`, `filters_applied`, and `computed_at`.

---

## Integration Points

| Module | Integration |
|--------|-------------|
| Command Center | Search bar in the Command Center header |
| Knowledge Engine | Knowledge objects are the richest search targets |
| Decision Engine | Decisions are searchable by context and rationale |
| Agent System | Agents can invoke search to find relevant knowledge or projects |

---

## Future Extensions

- **Semantic search** — Embedding-based similarity search for knowledge objects
- **Natural language** — "Show me all blocked projects in ClientVerse" parsed to structured query
- **Saved searches** — Operator saves frequently used queries
- **Search analytics** — Track what operators search for to identify knowledge gaps
- **Cross-tenant search** — In SaaS mode, search is tenant-scoped with no cross-contamination
