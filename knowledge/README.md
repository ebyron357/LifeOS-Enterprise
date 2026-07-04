# Knowledge

## Purpose
The Knowledge module is the atomic intelligence layer of LifeOS. Every piece of validated knowledge is stored as a discrete, linkable object with evidence, applications, and confidence scores. This enables AI agents and humans to retrieve, apply, and build upon knowledge systematically rather than losing it in documents or chat histories.

## Inputs
- Research outputs from AI agents (Research, Engineering, Legal, Finance agents)
- Insights extracted from project retrospectives
- External sources (articles, papers, documentation) processed via NotebookLM
- Manual knowledge entries from operators
- AI-assisted knowledge extraction from meetings and documents

## Outputs
- Searchable knowledge object registry
- Concept relationship graph
- Knowledge-per-business index
- Knowledge-per-project index
- AI usage logs showing which agents consumed which objects
- Knowledge growth metrics for dashboards

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| NotebookLM | /notebooklm | Source processor |
| AI agents | /agents | Consumer and producer |
| Projects | /projects | Linked context |
| Businesses | /businesses | Linked context |
| MCP connectors | /mcp | Ingestion pipeline |

## Relationships
- Knowledge objects are **linked to** projects, businesses, and agents
- Knowledge is **produced** by AI agents and human operators
- Knowledge is **consumed** by AI agents to improve responses
- Knowledge objects are **referenced** in SOPs and documentation

## Structure
```
knowledge/
├── README.md               # This file
├── _templates/
│   └── knowledge-object.md # Atomic knowledge template
├── concepts/               # Domain-agnostic concepts
├── domains/                # Domain-specific knowledge trees
│   ├── business/
│   ├── technology/
│   ├── marketing/
│   ├── finance/
│   ├── legal/
│   └── operations/
└── index.md                # Master knowledge index
```

## Required Knowledge Object Fields
Every knowledge object must include:
- `summary` — One-paragraph plain-language description
- `evidence` — Supporting data, citations, or references
- `applications` — How and where this knowledge can be applied
- `confidence` — Score from 0.0 to 1.0 with reasoning
- `sources` — Original source URLs or references
- `related_concepts` — Linked knowledge objects
- `businesses` — Applicable business contexts
- `projects` — Projects where this has been applied
- `ai_usage` — Which agents have used this object

## Future Extensions
- Automated knowledge extraction from document ingestion pipeline
- Knowledge confidence decay scoring over time
- Knowledge graph visualization
- Contradiction detection between conflicting knowledge objects
- Knowledge versioning and change history
