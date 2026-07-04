# AI

## Purpose
The AI module defines the strategic intelligence layer of LifeOS. It establishes the design principles, model registry, prompt engineering standards, memory architecture, and orchestration patterns that govern how AI is used across the entire platform. This module does not contain individual agents (see `/agents`) but defines the system within which all agents operate.

## Inputs
- Agent capability requirements from `/agents`
- Model provider connections from `/mcp` (OpenAI, Claude, Gemini)
- Knowledge base from `/knowledge`
- Prompt libraries and system instructions
- User feedback and performance metrics

## Outputs
- Model registry (which models are available and their capabilities)
- Prompt library (reusable system prompts)
- Memory configuration patterns
- AI usage analytics
- Cost tracking per model and agent
- AI performance benchmarks

## Dependencies
| Dependency | Module | Type |
|-----------|--------|------|
| MCP connectors | /mcp | Model access (OpenAI, Claude, Gemini) |
| Knowledge engine | /knowledge | Context injection |
| Agents | /agents | Consumers of AI config |
| Dashboards | /dashboards | AI activity reporting |

## Relationships
- AI module **governs** all agents in `/agents`
- AI module **consumes** knowledge from `/knowledge` for context enrichment
- AI module **reports** to `/dashboards` via AI Activity dashboard
- AI module **relies on** `/mcp` for model API access

## Structure
```
ai/
├── README.md               # This file
├── models/                 # Model registry and capability specs
│   ├── openai.md
│   ├── claude.md
│   └── gemini.md
├── prompts/                # Reusable system and task prompts
│   ├── system/
│   └── task/
├── memory/                 # Memory architecture patterns
│   ├── short-term.md
│   └── long-term.md
├── orchestration/          # Multi-agent orchestration patterns
└── benchmarks/             # Model performance tracking
```

## Future Extensions
- Fine-tuned model management
- Automatic prompt optimization pipeline
- Cross-agent memory sharing protocol
- AI cost budget alerts and throttling
- Model evaluation harness with automated benchmarks
- Reinforcement learning from operator feedback
