# NotebookLM

## Purpose
The NotebookLM module manages the integration between LifeOS and Google's NotebookLM for deep document analysis, knowledge synthesis, and research summarization. It serves as the document intelligence layer, ingesting long-form content and producing structured knowledge objects for the `/knowledge` module.

## Inputs
- Document uploads (PDFs, Google Docs, web clips)
- Research requests from AI agents
- Project documentation for deep analysis
- Business strategy documents
- Technical specifications and whitepapers

## Outputs
- Structured summaries sent to `/knowledge`
- Q&A-style knowledge extraction
- Topic clusters and concept maps
- Source citations and evidence bundles
- Research briefings for AI agents

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| MCP/NotebookLM connector | /mcp | Integration |
| Knowledge engine | /knowledge | Output target |
| Agents/Research | /agents | Consumer |
| Google Drive | /mcp/registry/google-drive.md | Source documents |

## Relationships
- NotebookLM **feeds** the knowledge engine with synthesized content
- The Research agent **directs** NotebookLM processing requests
- Google Drive documents are **piped through** NotebookLM for analysis
- Output knowledge objects are **linked** to source projects and businesses

## Structure
```
notebooklm/
├── README.md               # This file
├── sources/                # Source document registry
│   └── sources-index.md
└── outputs/                # Processed output summaries
    └── outputs-index.md
```

## Future Extensions
- Automated document ingestion pipeline from Google Drive
- Scheduled re-analysis of evolving documents
- Cross-notebook concept linking
- Audio and video transcript processing
- Competitive intelligence pipeline
